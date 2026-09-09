#!/bin/sh
# Container start-up: migrate, seed, serve. Compose already waited for the
# database healthcheck, so there is nothing to poll here.
set -eu

echo "==> Applying migrations"
pnpm db:migrate:deploy

echo "==> Seeding database (idempotent)"
pnpm db:seed

echo "==> Starting Next.js on port ${PORT:-3000}"
exec pnpm start
