# The Flock

A Twitter clone built for The Flock AI Verified technical challenge.

The app includes custom authentication, public profiles, people search, tweet create/delete, follow/unfollow with follower and following lists, an authenticated home timeline with cursor pagination, and tweet likes. Replies, image uploads, notifications, and realtime updates are not implemented.

## Live demo

**Production: https://ai-verified-twitter-clone.vercel.app/**

Sign in with the seeded demo account. It is a sample account created by the database seed for evaluators, not a production secret:

- Email: `demo@example.com`
- Password: `Demo1234!`

## Screenshots

![The Flock authenticated desktop timeline](docs/screenshots/home-desktop.png)

_Authenticated home timeline: desktop rail, composer, and seeded posts with like counts._

![The Flock mobile timeline](docs/screenshots/home-mobile.png)

_Home timeline at 375px: top navigation, composer, and tweet actions._

![The Flock public profile](docs/screenshots/profile-desktop.png)

_Public profile: avatar, bio, follower and following counts, follow control, and the user's posts._

## Stack

- **Next.js** (App Router) — full-stack UI and HTTP layer in one application
- **TypeScript** — static typing across the app
- **PostgreSQL** — relational database for application data
- **Prisma** — schema, migrations, and typed database access
- **Tailwind CSS** — utility-first styling
- **Vitest** — unit and backend integration tests
- **Playwright** — end-to-end tests
- **ESLint** — linting

This is a pragmatic modular monolith. Next.js and Prisma keep the UI, API, and persistence in one codebase so features can ship without extra services or ceremony. Authentication is custom application code, not Firebase Auth or Supabase Auth.

Feature modules live under `src/modules` (`auth`, `users`, `tweets`, `follows`, `timeline`, `likes`). HTTP handlers are in `src/app/api`.

See [docs/architecture.md](docs/architecture.md) for session design, the follow graph, timeline keyset pagination, likes, privacy boundaries, and trade-offs.

## Quick start with Docker

Docker is the **implemented challenge bonus** and the fastest way to run the project locally. Docker is the only prerequisite for this path: Node, pnpm, and PostgreSQL are not needed on the host.

```bash
docker compose up --build
```

That starts PostgreSQL, waits for it to report healthy, applies the committed migrations, runs the deterministic seed, and serves a production build of the app. Then open [http://localhost:3000](http://localhost:3000).

Demo account:

- Email: `demo@example.com`
- Password: `Demo1234!`

Stop the stack:

```bash
docker compose down
```

Full reset:

```bash
docker compose down -v
```

`-v` also deletes the local PostgreSQL Docker volume, so the next `docker compose up --build` migrates and seeds a brand-new database.

Notes:

- The database credentials in `docker-compose.yml` (`postgres` / `postgres` / `twitter_clone`) are local Docker development defaults, not secrets. Compose supplies the app's `DATABASE_URL`, so no `.env` is needed for this path.
- PostgreSQL is published on `localhost:5432` so you can inspect it with `psql` if you want. If you already run PostgreSQL on that port, stop it first or change the published port in `docker-compose.yml`.
- The seed is idempotent: restarting the stack does not multiply users, tweets, follows, or likes.
- The manual setup below still works and is unchanged; use it if you prefer running against a host PostgreSQL.

## Prerequisites

- **Git**
- **Node.js 24** (`24.x`). The repo pins this in `.nvmrc` and `package.json` `engines.node` (`>=24 <25`).
- **pnpm 10.34.5**, via Corepack (the repo sets `"packageManager": "pnpm@10.34.5"`). Do not assume a global pnpm install.
- **PostgreSQL**, installed and **running** before migrations. Prisma does not create the database.
- **Playwright Chromium** for E2E tests (`pnpm exec playwright install chromium` on first run).

## Fresh clone

```bash
git clone https://github.com/enzosaso/ai-verified-twitter-clone.git
cd ai-verified-twitter-clone
nvm use
corepack enable
corepack prepare pnpm@10.34.5 --activate
```

`nvm use` reads `.nvmrc` (`24`). Then enable Corepack and activate the pinned pnpm:

```bash
pnpm --version
```

That should print `10.34.5`.

### PostgreSQL

Create an empty database **before** applying migrations. Prisma applies tables to an existing database; it does not create `twitter_clone` for you.

Example:

```bash
createdb twitter_clone
```

Equivalent SQL:

```sql
CREATE DATABASE twitter_clone;
```

Copy the example env file and point it at your instance:

```bash
cp .env.example .env
```

`.env` is gitignored. Required:

- `DATABASE_URL` — PostgreSQL connection string for the app, migrations, and seed.

Optional:

- `TEST_DATABASE_URL` — if set, Vitest integration tests use this instead of `DATABASE_URL`.

`.env.example` uses `postgresql://postgres:postgres@localhost:5432/twitter_clone` as a **placeholder**. Many local installs use a different role, no password, another host, or another port. Edit username, password, host, and port to match your PostgreSQL. Do not assume `postgres` / `postgres`.

Integration tests refuse URLs that do not look local/test (`localhost`, `127.0.0.1`, `twitter_clone`, or `_test`). They insert isolated rows and delete them. They never run `db:reset`.

### Install, migrate, seed

```bash
pnpm install
pnpm db:migrate:deploy
pnpm db:seed
```

`pnpm install` also runs `postinstall` → `prisma generate`.

On a fresh clone, **`pnpm db:migrate:deploy`** is the evaluator path: it applies the committed migration in `prisma/migrations`. It does not create new migrations.

| Command | What it does |
| --- | --- |
| `pnpm db:migrate:deploy` | Apply existing migrations (`prisma migrate deploy`). Use this on a fresh clone. |
| `pnpm db:migrate` | `prisma migrate dev` — development only; can create new migrations. |
| `pnpm db:seed` | Upsert the deterministic development seed. |
| `pnpm db:reset` | Drop the database, migrate, and seed. **Destructive. Local development only. Do not run against a shared database.** |
| `pnpm db:generate` | Regenerate the Prisma client (also runs on `pnpm install`). |

### Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials (development only)

- email: `demo@example.com`
- username: `demo`
- password: `Demo1234!`

These are seeded development credentials, not production secrets. Other seed users use the same development password. The password is stored as an Argon2id hash.

### Checklist

1. Clone the repository.
2. `nvm use`, then Corepack pnpm `10.34.5`.
3. PostgreSQL installed and running.
4. Create database `twitter_clone`.
5. `cp .env.example .env` and edit `DATABASE_URL`.
6. `pnpm install`.
7. `pnpm db:migrate:deploy`.
8. `pnpm db:seed`.
9. `pnpm dev`.
10. Run the validation suite below.

## Authentication

Custom sessions, not Firebase Auth or Supabase Auth.

- Register: `/register` → `POST /api/auth/register`
- Login: `/login` → `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- Current user: `GET /api/auth/me`
- Email and username are trimmed and lowercased. Usernames are `[a-z0-9_]{3,32}`.
- Passwords are 8–128 characters, hashed with Argon2id.
- Session token: 32 random bytes, SHA-256 hashed in PostgreSQL, raw value only in the `flock_session` HttpOnly cookie (`SameSite=Lax`, 7 days, `Secure` in production).
- Server-side protection: `requireAuthenticatedUser()`.

See [docs/architecture.md](docs/architecture.md) for CSRF, cookie attributes, and route protection.

## Profiles and search

Public profile: `/users/[username]` (display name, @username, bio, initials avatar, follower/following counts). Email is not shown.

People search: `/search?q=...` and `GET /api/users/search?q=...`. Case-insensitive contains on username or display name, max 20 results. Empty queries return no one. Signed-in home includes a search field and a link to your profile.

Follower list: `/users/[username]/followers`. Following list: `/users/[username]/following`. Both are public reads of public profiles.

## Tweets

- Create: `POST /api/tweets` with `{ "content": "..." }` (authenticated). Author comes from the session.
- Delete: `DELETE /api/tweets/[id]` — owner only (`403` otherwise, `404` if missing).
- Content is trimmed, required, max 280 characters. Internal newlines are kept.
- Public profiles list that user's posts newest first (up to 30).

## Likes

- Like: `POST /api/tweets/[id]/like` (authenticated). The liker is always the session user.
- Unlike: `DELETE /api/tweets/[id]/like` (authenticated).
- Duplicate like and repeated unlike are idempotent (`204`, one row max, no 500).
- Missing tweets return `404`. Unauthenticated requests return `401`. Cross-origin mutations return `403`.
- `likeCount` is public on timeline and profile tweet cards. `likedByViewer` is true only for the current session user.
- Guests see the count and no Like button. Signed-in viewers can like any tweet, including their own.
- Counts come from PostgreSQL `_count.likes` plus a `take: 1` existence check for the viewer, not by loading the full like list.

## Home timeline

Signed-in `/` is a social home feed, not “only your posts.”

- Includes the viewer’s tweets and tweets from accounts they follow.
- Excludes everyone else. Deleted tweets disappear because they are gone from `tweets`.
- Order: `createdAt DESC`, then `id DESC` so equal timestamps stay stable.
- Pagination is a keyset cursor on that `(createdAt, id)` pair, not `OFFSET`. Default page size is 20, maximum 50.
- `GET /api/timeline?cursor=&limit=` (authenticated). `nextCursor` is opaque base64url JSON; a malformed cursor is `400`. The last page returns `nextCursor: null`.
- Home server-renders the first page. **Load more** appends the next page. Posting refreshes the first page; there is no live insert or websocket.

## Follows

- Follow: `POST /api/users/[username]/follow` (authenticated). The follower is always the session user.
- Unfollow: `DELETE /api/users/[username]/follow` (authenticated).
- Self-follow and self-unfollow are rejected (`400`) in application code, before the database CHECK.
- Missing target users return `404`. Unauthenticated requests return `401`. Cross-origin mutations return `403`.
- Duplicate follow and repeated unfollow are idempotent (`204`, no duplicate rows, no 500).
- Public profiles show follower and following counts for everyone, including guests. Counts come from PostgreSQL `COUNT`, not by loading the full lists.
- A Follow/Unfollow button appears only for a signed-in user looking at someone else's profile. Guests and own profiles see counts only.
- Follower and following lists are public, newest relationship first (`createdAt DESC`, then the related user id DESC), up to 50 people.

## Testing

Unit and PostgreSQL integration tests (need a local `DATABASE_URL` or `TEST_DATABASE_URL`):

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Integration tests use `TEST_DATABASE_URL` when set, otherwise `DATABASE_URL`. The URL must look local/test (`localhost`, `127.0.0.1`, `twitter_clone`, or `_test`). Tests insert isolated rows and delete them; they do not reset the database.

Playwright E2E also needs PostgreSQL: the tests register users and hit the running app. `playwright.config.ts` starts `pnpm dev` at `http://127.0.0.1:3000` automatically (`webServer`). Outside CI it reuses an already-running server if one is listening. Install Chromium once, then run:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

The auth E2E test registers a unique user, confirms the signed-in home page, logs out, logs back in, and checks the session again. The search E2E test registers a user, finds them by query, opens the public profile, and checks that email is not shown. The tweet E2E test registers, posts a note, sees it on home and profile, then deletes it. The follow E2E test registers two isolated users, follows from a profile, checks counts and the followers list, then unfollows. The timeline E2E test registers two users, follows, and checks that followed and own tweets appear on home in newest-first order. The likes E2E test follows a user, likes their tweet on home, confirms the same state on the profile, then unlikes. A focused responsive E2E test exercises registration and the signed-in composer/header at a 375px mobile viewport and asserts that the document has no horizontal overflow.

GitHub Actions (`.github/workflows/ci.yml`) runs that same validation on every push to `main` and every pull request targeting `main`: lint, typecheck, PostgreSQL-backed Vitest tests and coverage, production build, and Playwright E2E. CI uses an isolated PostgreSQL 17 service container (`twitter_clone_test`). It never touches Neon or production.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Lint the project |
| `pnpm typecheck` | TypeScript check without emitting files |
| `pnpm test` | Run unit/integration tests |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:coverage` | Tests with coverage |
| `pnpm test:e2e` | Playwright tests (`pnpm exec playwright install chromium` on first run) |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Create/apply Prisma migrations in development |
| `pnpm db:migrate:deploy` | Apply existing migrations |
| `pnpm db:seed` | Upsert the deterministic development seed |
| `pnpm db:reset` | Drop the local database, migrate, and seed (**destructive**) |

## Limitations

Implemented: auth, profiles, search, tweets, follows, lists, home timeline with cursor pagination, likes.

Bonus implemented: **Docker / docker-compose one-command local setup** (see [Quick start with Docker](#quick-start-with-docker)).

Not implemented:

- replies
- image uploads
- notifications
- realtime (WebSockets / SSE)

Other current limits:

- Expired session rows are deleted when seen, not by a background job.
- CSRF baseline is `SameSite=Lax` plus Origin/Host validation, not synchronizer tokens.
- Follower and following lists are a first page of 50.
- Profile tweet lists are a first page of 30.

## AI-assisted development

This repository was built with the **Codex coding agent** as the primary implementation and testing agent through the feature slices, with **GitHub MCP** used for repository operations where the workflow needed GitHub (creating the empty public repository). **Claude** was used later, for the final UI/presentation refinement and the responsive and accessibility review; it did not implement the backend or domain features. Architecture, scope, trade-offs, review criteria, and acceptance decisions remained human-directed throughout.

Work was **feature-sliced**, not “build the whole challenge in one shot.” Each commit on `main` is one coherent slice (scaffold, pnpm, Node 24, schema/seed, auth, profiles/search, tweets, follows, timeline, likes). History was kept linear and unsquashed so evaluators can read the progression.

Typical slice:

1. Requirements and acceptance criteria were defined for that slice only.
2. The coding agent inspected the current repository and existing patterns.
3. It implemented only that slice (no timeline during tweets, no likes during follows, and so on).
4. Unit, integration, frontend, and E2E tests were added with the implementation.
5. The diff was reviewed for security and data boundaries (session identity, origin checks, public vs private fields, self-follow, cursor stability).
6. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, and `pnpm test:e2e` were run as applicable.
7. Only then was **one** commit created and pushed to `main`.
8. The next slice started from that verified state.

AI accelerated implementation and test generation. Architecture, scope, trade-offs, review criteria, and acceptance decisions stayed human-directed. Generated code was not accepted solely because it compiled. Git history was preserved on purpose rather than squashed into a single dump.
