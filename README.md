# League Management — Phase 1 (Multi-league)

Multi-tenant football league platform. Users register, create local leagues, manage teams/players/fixtures/scores, and view standings.

**Phase 1 scope:** multi-league core, external Postgres (Coolify), no legacy single-league data.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- Session auth (JWT + hashed tokens)
- Docker / Coolify

## Quick start (local)

```bash
cp .env.example .env
# Set DATABASE_URL to a local or remote Postgres
# Set SESSION_SECRET (>=32 chars), PRIMARY_ADMIN_*

npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

## Coolify

1. Create a **PostgreSQL** service in Coolify.
2. Create this app as Docker Compose (compose file = `docker-compose.yml`).
3. Set env vars from `.env.example` — especially `DATABASE_URL` pointing at the Coolify Postgres **internal hostname**.
4. Deploy. Entrypoint waits for DB, runs migrations, seeds platform admin + optional demo league.

There is **no** Postgres service in Compose.

## What Phase 1 includes

- Global users + league memberships (OWNER / ADMIN / COACH / FAN / REFEREE)
- Create / join / discover leagues (public + invite codes)
- League-scoped groups, teams, players, matches
- Score entry + group standings
- Platform admin overview
- Auth: signup, login, logout, basic recovery

## What comes in Phase 2

- CSV import/export (teams, players, fixtures, scores)
- Virtual wallet + prediction gamification
- Leaderboards, invite polish, pagination

## Routes

| Path | Description |
|------|-------------|
| `/` | Discover + my leagues |
| `/leagues` | Public directory + join by code |
| `/leagues/new` | Create league |
| `/l/[slug]` | League home |
| `/l/[slug]/fixtures` | Fixtures |
| `/l/[slug]/groups` | Tables |
| `/l/[slug]/results` | Results |
| `/l/[slug]/teams` | Teams |
| `/l/[slug]/admin` | League admin (groups/teams/matches/scores) |
| `/admin` | Platform admin |
| `/account` | Profile + memberships |

## Seed

Idempotent. Creates `PRIMARY_ADMIN` from env and a public **Demo League** (slug `demo-league`, invite `DEMO2026`). No hard-coded tournament fixtures.
