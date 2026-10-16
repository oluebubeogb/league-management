#!/bin/sh
set -e

echo "[entrypoint] Waiting for database…"
node <<'WAIT_DB'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  for (let i = 0; i < 40; i++) {
    try {
      await p.$queryRaw`SELECT 1`;
      console.log("[entrypoint] Database ready");
      await p.$disconnect();
      process.exit(0);
    } catch (e) {
      console.log("[entrypoint] DB not ready, retry", i + 1);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error("[entrypoint] Database timeout");
  process.exit(1);
})();
WAIT_DB

echo "[entrypoint] Running migrations…"
PRISMA="/prisma-tools/node_modules/.bin/prisma"
if [ ! -x "$PRISMA" ]; then
  PRISMA="node /prisma-tools/node_modules/prisma/build/index.js"
fi
echo "[entrypoint] Using: $PRISMA"

cd /app
$PRISMA migrate deploy || {
  echo "[entrypoint] migrate deploy failed — trying db push…"
  $PRISMA db push --accept-data-loss --skip-generate
}

echo "[entrypoint] Seeding (idempotent)…"
export NODE_PATH="/prisma-tools/node_modules:${NODE_PATH:-}"
if [ -f ./prisma/seed.js ]; then
  node ./prisma/seed.js || echo "[entrypoint] Seed reported an error (continuing)"
else
  echo "[entrypoint] No prisma/seed.js — skipping seed"
fi

echo "[entrypoint] Starting application…"
exec "$@"
