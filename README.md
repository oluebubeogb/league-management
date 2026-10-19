# League Management — Phase 2

Multi-tenant football league platform with CSV bulk ops, virtual wallet, and gamified predictions.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- Session auth (JWT + hashed tokens)
- Docker / Coolify

## Phase 2 features

- **CSV import/export** for Teams, Players, Groups, Fixtures, Scores (preview → commit)
- **Virtual wallet** — starter coins, mock top-up, transaction history (no real money)
- **Predictions** — 1X2 + correct score with optional coin stakes; auto-graded on FULL_TIME
- **Leaderboards** — global and per-league by prediction points
- Invite codes, multi-league core (from Phase 1)

## Quick start (local)

```bash
cp .env.example .env
# Set SESSION_SECRET, PRIMARY_ADMIN_*, POSTGRES_PASSWORD

docker compose up --build
# or: npm install && npx prisma migrate deploy && npx tsx prisma/seed.ts && npm run dev
```

## Coolify

### Option A — Postgres inside Compose (recommended if linking external DB fails)

Use the included `docker-compose.yml` (services: `db` + `web`). Set `POSTGRES_PASSWORD`, `SESSION_SECRET`, `PRIMARY_ADMIN_*`, `APP_URL`.

### Option B — External Coolify Postgres

1. Create a PostgreSQL service in Coolify.
2. Set `DATABASE_URL` to the **internal** hostname.
3. Remove or ignore the `db` service if you prefer external only.
4. Deploy. Entrypoint waits for DB, runs migrations, seeds platform admin.

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
| `/l/[slug]/admin` | League admin (+ CSV import tab) |
| `/admin` | Platform admin |
| `/account` | Profile + wallet + memberships |
| `/leaderboard` | Global prediction leaderboard |

## CSV columns (templates)

- **Teams:** `name, shortName, groupCode, color1, color2, color3, description`
- **Players:** `fullName, team, team_slug, position, age, jerseyNumber, phone, nationality`
- **Groups:** `code, name, displayOrder`
- **Fixtures:** `matchday, stage, home, away, kickoff, venue, group`
- **Scores:** `match_id, home, away, matchday, ht_home, ht_away, ft_home, ft_away, status`

Import flow: Admin → CSV tab → choose entity → Preview → Commit valid rows. Export downloads current data.

## Predictions & coins

- Starter balance: **1000** coins on first wallet open
- Mock top-up: +500 (account page)
- Stakes optional; payouts: correct score ×4, outcome ×2
- Grading runs automatically when a match is set to FULL_TIME
- **No real-money paths**

## Seed

Idempotent. Creates `PRIMARY_ADMIN` from env and optional public **Demo League** (`demo-league` / invite `DEMO2026`).
