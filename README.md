# The Flock

A Twitter clone built for The Flock AI Verified technical challenge.

The repository currently contains the application scaffold and development tooling only. Product features have not been implemented yet.

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

- Node.js 20 (`20.x`, currently developed on 20.19+)
- npm

Use the Node version in `.nvmrc`:

```bash
nvm use
```

## Getting started

```bash
npm install
cp .env.example .env
```

`.env` is gitignored. Set `DATABASE_URL` to a local PostgreSQL instance when database work begins. Prisma is configured, but no application schema has been created yet.

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | Lint the project |
| `npm run typecheck` | TypeScript check without emitting files |
| `npm test` | Run unit/component tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:e2e` | Playwright smoke tests (`npx playwright install chromium` on first run) |
| `npm run db:generate` | Generate the Prisma client |

## Architecture

The app is a modular monolith. Shared UI lives in `src/components`, infrastructure in `src/lib`, and App Router entry points in `src/app`. Feature modules will be added under `src/modules` as slices land.

Authentication will be custom. Firebase Auth and Supabase Auth will not be used.

See [docs/architecture.md](docs/architecture.md) for boundaries and principles.

## AI-assisted development

Agentic coding tools are used throughout this challenge. Changes are reviewed and validated (lint, typecheck, tests, and build as applicable) before they are committed.
