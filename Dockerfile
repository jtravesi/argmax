# syntax=docker/dockerfile:1

# Argmax: static SvelteKit build served by an unprivileged nginx.
# Pin both base images by digest before the first release (see ARCHITECTURE.md §7).

ARG NODE_VERSION=24

# ---- Build stage -------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Empty for Docker (served at the root); "/argmax" for GitHub Pages.
ARG BASE_PATH=""
ENV BASE_PATH=${BASE_PATH}
RUN npm run build

# ---- Runtime stage -----------------------------------------------------------
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

LABEL org.opencontainers.image.title="Argmax" \
      org.opencontainers.image.description="Decision making under uncertainty with expected utility. Runs entirely in the browser." \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/jtravesi/argmax"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/build /usr/share/nginx/html

# The base image already runs as the non-root "nginx" user (uid 101).
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
