# The Flock

A Twitter clone built for The Flock AI Verified technical challenge.

The repository currently contains the application scaffold, development tooling, and the relational data model. Product features such as authentication, timelines, and tweet UI have not been implemented yet.

## Stack

- **Next.js** (App Router) — full-stack UI and HTTP layer in one application
- **TypeScript** — static typing across the app
- **PostgreSQL** — relational database for application data
- **Prisma** — schema, migrations, and typed database access
- **Tailwind CSS** — utility-first styling
- **Vitest** and **React Testing Library** — unit and component tests
- **Playwright** — end-to-end smoke tests
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

The app runs at [http://localhost:3000](http://localhost:3000). The home page is still a scaffold shell; the database is ready for later slices.

### Demo account

Seeded for later authentication work. Login is not implemented yet.

- email: `demo@example.com`
- username: `demo`
- password: `Demo1234!`

The password is stored as an Argon2id hash. Other seed users use the same development password so they can be used in later auth tests.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm lint` | Lint the project |
| `pnpm typecheck` | TypeScript check without emitting files |
| `pnpm test` | Run unit/component tests |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm test:e2e` | Playwright smoke tests (`pnpm exec playwright install chromium` on first run) |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Create/apply Prisma migrations in development |
| `pnpm db:migrate:deploy` | Apply existing migrations |
| `pnpm db:seed` | Upsert the deterministic development seed |
| `pnpm db:reset` | Drop the local database, migrate, and seed (**destructive**) |

## Architecture

The app is a modular monolith. Shared UI lives in `src/components`, infrastructure in `src/lib`, and App Router entry points in `src/app`. Feature modules will be added under `src/modules` as slices land.

The database models `User`, `Session`, `Tweet`, `Follow`, and `Like`. Sessions and password hashes are in place for custom authentication; authentication behavior is not implemented yet. Firebase Auth and Supabase Auth will not be used.

See [docs/architecture.md](docs/architecture.md) for the data model, constraints, indexes, cascades, and seed strategy.

## AI-assisted development

Agentic coding tools are used throughout this challenge. Changes are reviewed and validated (lint, typecheck, tests, and build as applicable) before they are committed.
