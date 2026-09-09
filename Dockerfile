# Local/evaluator image for The Flock. Debian-based Node 24 keeps the native
# modules (@node-rs/argon2, Prisma query engine) on well-trodden ground.
FROM node:24-bookworm-slim

WORKDIR /app

# openssl is required by the Prisma query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Same package manager the repo pins for local development.
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

# Install with the committed lockfile. prisma/ and prisma.config.ts are copied
# first because the postinstall hook runs `prisma generate`.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

# Application sources.
COPY . .

# Regenerate against the final source tree, then build for production.
RUN pnpm db:generate && pnpm build

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
