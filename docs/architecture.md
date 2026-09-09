# Architecture

This project is a pragmatic modular monolith: one Next.js application, one PostgreSQL database, and feature modules that will be added as the product grows.

## Current boundaries

- `src/app` — App Router pages, layouts, and HTTP entry points
- `src/components` — shared UI used across routes
- `src/lib` — application-wide utilities and infrastructure (Prisma client, password hashing)
- `prisma` — database schema, migrations, and development seed

Feature modules will live under `src/modules/<feature>` when the first product slice lands. Until then that directory is intentionally absent.

## Principles

- Keep the stack small: Next.js, TypeScript, Prisma, PostgreSQL, and the test tools already in the repository.
- Prefer straightforward modules over Clean Architecture, CQRS, event sourcing, or extra services.
- Authentication will be custom application code, not Firebase Auth or Supabase Auth.
- Persistence is PostgreSQL. Schema is evolved with Prisma migrations.

## Data model

The current schema is the social graph and the tables custom auth will need. Authentication behavior (register, login, session cookies) is **not** implemented yet. `Session` and `User.passwordHash` exist so the next slice can add that behavior without another schema redesign.

| Table | Role |
| --- | --- |
| `users` | Accounts. Unique `email` and `username`. Optional `bio` and `avatar_url` placeholder. |
| `sessions` | Future custom sessions. Unique `token_hash`, belongs to one user. |
| `tweets` | Status text, max 280 characters at the database (`VARCHAR(280)`). Application validation will still be required. |
| `follows` | Directed edge `follower_id → following_id`. Composite primary key prevents duplicates. |
| `likes` | Pair of `user_id` + `tweet_id`. Composite primary key prevents duplicates. |

### ID strategy

All primary keys are UUID v4 values stored as PostgreSQL `uuid`. Prisma generates them with `@default(uuid())`. UUIDs avoid a shared sequence, are stable in seed data, and do not leak row counts. We did not enable `pgcrypto` / `uuid-ossp` because Prisma client generation is enough for this app and seed.

### Username uniqueness

`username` is unique. Values are stored in lowercase in the seed. Application writes will normalize to lowercase so the unique index is effectively case-insensitive without installing `citext`.

### Follow graph

`follows` is a directed adjacency list. Looking up who a user follows uses the composite primary key prefix on `follower_id`. Looking up followers uses `follows_following_id_idx`.

Self-follows are rejected in PostgreSQL with a CHECK constraint (`follows_no_self_follow`: `follower_id <> following_id`). Prisma cannot express that CHECK in the schema file, so it lives in the SQL migration. Application logic should still reject self-follow before hitting the database.

### Cascades

Deleting a user deletes their sessions, tweets, follows (either side), and likes. Deleting a tweet deletes its likes. Foreign keys use `ON DELETE CASCADE`.

### Indexes

Only access paths we already know:

- `tweets (author_id, created_at DESC)` — a user's tweets
- `tweets (created_at DESC)` — reverse-chronological feeds
- `follows (following_id)` — follower lists
- `likes (tweet_id)` — like counts / who liked a tweet
- unique indexes from `users.email`, `users.username`, `sessions.token_hash`, and the follow/like primary keys

No trigram or full-text indexes yet. Search is not implemented.

### Password hashing

Passwords are hashed with Argon2id via `@node-rs/argon2` (19 MiB memory, 2 iterations, parallelism 1). Prebuilt binaries keep evaluator setup off node-gyp. Hashes are stored on `users.password_hash`. Login is not implemented.

## Trade-offs

- Database `VARCHAR(280)` is a backstop, not the only validation the app should do.
- Seed upserts a fixed set of user IDs and recreates their tweets/follows/likes. It does not truncate unrelated rows.
- `pnpm db:reset` is a local development wipe (`prisma migrate reset --force`). Do not run it against a shared database.
