# ── Stage 1: deps ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# npm ci is flaky on some hosts ("Exit handler never called").
# Use npm install with retries; always verify prisma lands in node_modules.
RUN npm install --ignore-scripts --no-audit --no-fund \
    || (sleep 5 && npm install --ignore-scripts --no-audit --no-fund) \
    || (sleep 10 && npm install --ignore-scripts --no-audit --no-fund)
RUN test -x ./node_modules/.bin/prisma || npm install prisma@6.19.0 @prisma/client@6.19.0 --ignore-scripts --no-audit --no-fund
RUN test -x ./node_modules/.bin/prisma

# ── Stage 2: builder ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Prefer local binary; fall back to pinned install if deps stage was incomplete
RUN if [ ! -x ./node_modules/.bin/prisma ]; then \
      npm install prisma@6.19.0 @prisma/client@6.19.0 --ignore-scripts --no-audit --no-fund; \
    fi
RUN ./node_modules/.bin/prisma generate
RUN npm run build

# ── Stage 3: prisma tools (migrate + seed at runtime) ────────────────
FROM node:20-alpine AS prisma-tools
WORKDIR /prisma-tools
RUN npm init -y \
 && npm install prisma@6.19.0 @prisma/client@6.19.0 tsx bcryptjs --no-audit --no-fund

# ── Stage 4: runner ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=prisma-tools /prisma-tools /prisma-tools
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
