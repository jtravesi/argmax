# syntax=docker/dockerfile:1

# Argmax: static SvelteKit build served by an unprivileged nginx.
# Base images are pinned by digest (ARCHITECTURE.md §7); Dependabot keeps them current.

# ---- Build stage -------------------------------------------------------------
FROM node:26-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Empty for Docker (served at the root); "/argmax" for GitHub Pages.
ARG BASE_PATH=""
ENV BASE_PATH=${BASE_PATH}
RUN npm run build

# ---- Runtime stage -----------------------------------------------------------
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime

LABEL org.opencontainers.image.title="Argmax" \
      org.opencontainers.image.description="Decision making under uncertainty with expected utility. Runs entirely in the browser." \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/jtravesi/argmax"

# Apply Alpine security fixes released after the base image (the Trivy scan in CI
# fails on fixable HIGH/CRITICAL issues), then drop back to the unprivileged user.
USER root
RUN apk upgrade --no-cache
USER 101

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/build /usr/share/nginx/html

# Runs as the non-root "nginx" user (uid 101) of the base image.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
