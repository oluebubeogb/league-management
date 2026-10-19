# Low-memory Coolify build: single concurrent npm fetch, no long retry loops

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# Cap concurrency + heap so npm does not get OOM-killed (~8 min hang → Exit handler never called)
RUN npm config set maxsockets 3 \
 && npm config set fetch-retries 3 \
 && npm config set fetch-retry-mintimeout 10000 \
 && npm config set fetch-retry-maxtimeout 60000 \
 && npm config set progress false \
 && npm config set fund false \
 && npm config set audit false
ENV NODE_OPTIONS=--max-old-space-size=1536
# One install attempt only (retries multiply 8-minute failures)
RUN npm install --ignore-scripts --no-audit --no-fund \
 && test -x node_modules/.bin/prisma

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN node_modules/.bin/prisma generate
RUN npm run build

FROM node:20-alpine AS prisma-tools
WORKDIR /prisma-tools
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm init -y \
 && npm install prisma@6.19.0 @prisma/client@6.19.0 tsx bcryptjs --no-audit --no-fund

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
