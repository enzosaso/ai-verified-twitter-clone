# The Flock

A Twitter clone built for The Flock AI Verified technical challenge.

The repository currently includes the application scaffold, the relational data model, custom authentication, public profiles, and people search. Tweets, follows, likes, and timeline are not implemented yet.

## Stack

- **Next.js** (App Router) — full-stack UI and HTTP layer in one application
- **TypeScript** — static typing across the app
- **PostgreSQL** — relational database for application data
- **Prisma** — schema, migrations, and typed database access
- **Tailwind CSS** — utility-first styling
- **Vitest** — unit and backend integration tests
- **Playwright** — end-to-end tests, including authentication
- **ESLint** — linting

This is a pragmatic modular monolith. Next.js and Prisma keep the UI, API, and persistence in one codebase so features can ship without extra services or ceremony.

## Runtime

- Node.js 24 (`24.x`)
- pnpm

Use the Node version in `.nvmrc`:

```bash
nvm use
```

## Getting started

```bash
pnpm install
cp .env.example .env
```

`.env` is gitignored. Point `DATABASE_URL` at a local PostgreSQL database, then apply migrations and seed:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Demo account

- email: `demo@example.com`
- username: `demo`
- password: `Demo1234!`

The password is stored as an Argon2id hash. Other seed users use the same development password.

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

See [docs/architecture.md](docs/architecture.md) for CSRF trade-offs, cookie attributes, and route protection.

## Profiles and search

Public profile: `/users/[username]` (display name, @username, bio, initials avatar). Email is not shown.

People search: `/search?q=...` and `GET /api/users/search?q=...`. Case-insensitive contains on username or display name, max 20 results. Empty queries return no one. Signed-in home includes a search field and a link to your profile.

## Testing

Unit and PostgreSQL integration tests:

```bash
pnpm test
pnpm test:coverage
```

Integration tests use `TEST_DATABASE_URL` when set, otherwise `DATABASE_URL`. The URL must look local/test (`localhost`, `127.0.0.1`, `twitter_clone`, or `_test`). Tests insert isolated rows and delete them; they do not reset the database.

Playwright, including the authentication flow:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

The auth E2E test registers a unique user, confirms the signed-in home page, logs out, logs back in, and checks the session again. The search E2E test registers a user, finds them by query, opens the public profile, and checks that email is not shown.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
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

## Architecture

Feature code lives under `src/modules`. Auth is in `src/modules/auth`. Public profiles and search are in `src/modules/users`. HTTP route handlers are in `src/app/api`.

See [docs/architecture.md](docs/architecture.md) for the data model, session design, and testing notes.

## AI-assisted development

Agentic coding tools are used throughout this challenge. Changes are reviewed and validated (lint, typecheck, tests, and build as applicable) before they are committed.
