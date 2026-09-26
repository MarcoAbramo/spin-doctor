# syntax=docker/dockerfile:1
# Builds the static client and serves it with Caddy (also the reverse proxy for /api).
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY packages/shared packages/shared
COPY apps/client apps/client
RUN pnpm --filter @spin-doctor/client build

FROM caddy:2-alpine
# The official binary has cap_net_bind_service, so it can bind :80/:443 as non-root.
RUN addgroup -S web && adduser -S -G web web \
 && mkdir -p /data /config && chown -R web:web /data /config
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=web:web /app/apps/client/dist /srv
USER web
