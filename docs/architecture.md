# Architecture

This project is a pragmatic modular monolith: one Next.js application, one PostgreSQL database, and feature modules that will be added as the product grows.

## Current boundaries

- `src/app` — App Router pages, layouts, and HTTP entry points
- `src/components` — shared UI used across routes
- `src/lib` — application-wide utilities and infrastructure (Prisma client)
- `prisma` — database schema and migrations

Feature code will live under `src/modules/<feature>` when the first domain slice lands. Until then that directory is intentionally absent.

## Principles

- Keep the stack small: Next.js, TypeScript, Prisma, PostgreSQL, and the test tools already in the repository.
- Prefer straightforward modules over Clean Architecture, CQRS, event sourcing, or extra services.
- Authentication will be custom application code, not Firebase Auth or Supabase Auth.
- Persistence is PostgreSQL. Schema and domain models are added with the features that need them, not in advance.
