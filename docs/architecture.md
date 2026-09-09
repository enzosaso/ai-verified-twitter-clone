# Architecture

This project is a pragmatic modular monolith: one Next.js application, one PostgreSQL database, and feature modules that grow with the product.

## Current boundaries

- `src/app` — App Router pages, layouts, and HTTP route handlers
- `src/components` — shared UI
- `src/lib` — Prisma client and Argon2id password helpers
- `src/modules/auth` — custom authentication
- `src/modules/users` — public profiles and people search
- `prisma` — schema, migrations, and development seed

Social feature modules (`tweets`, `follows`, `likes`) are not present yet.

## Principles

- Keep the stack small: Next.js, TypeScript, Prisma, PostgreSQL, and the existing test tools.
- Prefer functions over classes and skip Clean Architecture / CQRS ceremony.
- Authentication is custom application code, not Firebase Auth or Supabase Auth.

## Authentication

Custom cookie sessions are implemented. Tweets, follows, likes, and timeline are not.

### HTTP surface

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create user + session, set cookie, return safe user (`201`) |
| `POST` | `/api/auth/login` | Verify credentials, create session, set cookie (`200`) |
| `POST` | `/api/auth/logout` | Delete current session if present, clear cookie (`204`, idempotent) |
| `GET` | `/api/auth/me` | Return the authenticated safe user, or `401` |

Pages: `/` (guest or signed-in home), `/login`, `/register`, `/search`, `/users/[username]`.

## Public profiles and search

Profiles and people search are public reads. They return a `PublicProfile` only:

- `id`
- `username`
- `displayName`
- `bio`
- `avatarUrl`

Email, `passwordHash`, and session fields are not selected from the database for these surfaces.

### Profile

`GET /users/[username]` loads the user after lowercasing the username (same rule as registration). Missing users render a 404. Avatars are initials placeholders; there is no upload.

The profile layout leaves room for later posts, counts, and a follow button. Those are not implemented.

### Search

`GET /search?q=` (HTML) and `GET /api/users/search?q=` (JSON).

- Trim the query. Empty queries return no users (they do not list everyone).
- Queries over 64 characters are rejected.
- Match is case-insensitive `contains` on `username` OR `displayName` (Prisma `mode: "insensitive"`, no raw SQL, no trigram index).
- At most 20 results, from a fetch of up to 50 matches.
- Order: exact username, username prefix, exact display name, display-name prefix, then other contains matches, then username A–Z.

Search is public. Knowing that a username exists is intentional.

### Normalization and validation

- Email: trim, lowercase, basic `user@host.tld` shape, max 255.
- Username: trim, lowercase, 3–32 chars, `[a-z0-9_]+`. Stored lowercase so the unique index is case-insensitive without `citext`.
- Display name: trim, 1–50 characters.
- Password: 8–128 characters, hashed with Argon2id (`src/lib/password.ts`). Never logged or returned.

Duplicate email/username become `409` application errors, not raw Prisma payloads. Login failures use one generic `401` (`Invalid email or password`) whether the email is missing or the password is wrong.

### Sessions

- Token: 32 cryptographically random bytes, base64url.
- Storage: SHA-256 hex of the token in `sessions.token_hash`. The raw token is only in the cookie.
- Lifetime: 7 days. No rolling refresh.
- Expired sessions are treated as logged out. The expired row is deleted opportunistically. There is no background cleanup job.

### Cookie

Name: `flock_session`

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Max-Age` 7 days
- `Secure` when `NODE_ENV=production`

### Route protection

`requireAuthenticatedUser()` (and `getCurrentUser()`) read the cookie on the server, hash the token, and load an unexpired session. UI hiding is not authorization. There is no Edge middleware: Prisma stays on the Node server.

`requireAuthenticatedUserFromToken()` is the same check without Next.js cookies, for tests and route handlers.

### CSRF

State changes are POST-only. The session cookie is `SameSite=Lax`. POSTs also reject a present `Origin` that does not match the request URL. Missing `Origin` is allowed so non-browser clients and tests still work. This is not a full CSRF token scheme.

### Safe user

API responses use `toSafeUser` / `SAFE_USER_SELECT`: `id`, `email`, `username`, `displayName`, `bio`, `avatarUrl`. `passwordHash` and session hashes are never returned.

## Data model

| Table | Role |
| --- | --- |
| `users` | Accounts. Unique `email` and `username`. |
| `sessions` | Opaque hashed session tokens, 7-day expiry, cascade on user delete. |
| `tweets` / `follows` / `likes` | Social graph tables exist but have no product API yet. |

IDs are UUID v4 stored as PostgreSQL `uuid`.

## Testing

- Unit tests cover validation, token hashing, cookie options, and safe-user mapping.
- Integration tests hit the route handlers against PostgreSQL.
- Playwright covers register → authenticated home → logout → login.

Database tests use `TEST_DATABASE_URL` if set, otherwise `DATABASE_URL`. Both must look local/test (`localhost`, `127.0.0.1`, `twitter_clone`, or `_test`). Tests create isolated rows and delete them; they do not run `db:reset`.

```bash
pnpm test
pnpm test:coverage
pnpm test:e2e
```

## Trade-offs

- Expired session rows can linger until they are seen again.
- `SameSite=Lax` plus Origin checking is the CSRF baseline; no synchronizer tokens.
- `pnpm db:reset` is a local wipe. Do not run it against a shared database.
