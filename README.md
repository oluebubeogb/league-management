# League Management

Full-stack platform for **League Management** — manage multiple football leagues, teams, fixtures, standings, predictions and more.

Originally built for a single community league; evolving into a multi-league system where each league and its teams can securely manage their own affairs (like a social platform for leagues).

Mobile-first website with fixtures, results, group tables, knockout bracket, fan predictions (no money), player rosters/CSV import, admin console, AI match analysis (RunPod), and Docker/Coolify deployment.

**Sponsor (example):** High Chief Dickson Oguguo Nzenwa. Aku Bara-Oha 1 Of Ibeku Ancient Kingdom.

---
## Stack

| Layer | Choice |
|-------|--------|
| Frontend / API | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS |
| Database | PostgreSQL 17 + Prisma |
| Auth | Server sessions (JWT + hashed session tokens), bcrypt password hashes |
| AI | RunPod OpenAI-compatible API (optional, env-configured) |
| Deploy | Docker Compose → Coolify on Ubuntu VPS |

---

## Quick start (local)

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, SESSION_SECRET, PRIMARY_ADMIN_*

npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

Open http://localhost:3000 — health: http://localhost:3000/api/health

---

## Docker Compose / Coolify

```bash
cp .env.example .env
# Set strong POSTGRES_PASSWORD, SESSION_SECRET, PRIMARY_ADMIN_PASSWORD, etc.

docker compose up -d --build
```

Services:

- `db` — PostgreSQL 17, persistent volume `league_pgdata`, **not** published publicly
- `web` — Next.js standalone on port 3000

Entrypoint waits for DB, runs migrations, seeds idempotently, then starts the server.

### Coolify checklist

1. Push this repo to GitHub.
2. Create application → Docker Compose → select this repo/branch.
3. Set Compose file: `docker-compose.yml`.
4. Configure domain + HTTPS.
5. Set **all** runtime env vars from `.env.example` in Coolify UI (never commit secrets).
6. Ensure web port is 3000.
7. Deploy; check build logs and `/api/health`.
8. Log in with `PRIMARY_ADMIN_USERNAME` / `PRIMARY_ADMIN_PASSWORD`.
9. Test score edit, table recalculation, prediction, CSV import.
10. Redeploy once — seed must not duplicate fixtures or reset admin password.

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Use hostname `db` inside Compose |
| `SESSION_SECRET` | Yes | ≥32 chars; `openssl rand -base64 48` |
| `PRIMARY_ADMIN_USERNAME` | First boot | Bootstrap only; not reset on restart |
| `PRIMARY_ADMIN_PASSWORD` | First boot | |
| `PRIMARY_ADMIN_PHONE` | First boot | |
| `COOKIE_SECURE` | Prod | `true` behind HTTPS |
| `APP_URL` | Recommended | Public URL |
| `LLM_BASE_URL` | Optional | RunPod OpenAI path |
| `LLM_API_KEY` | Optional | **Server-only** — never `NEXT_PUBLIC_*` |
| `LLM_MODEL` | Optional | |
| `AI_ENABLED` | Optional | `true` to enable |
| `POSTGRES_*` | Compose | User / password / db name |

---

## Main routes

**Public:** `/` `/fixtures` `/results` `/groups` `/standings` `/knockout` `/predictions` `/teams` `/teams/[slug]` `/matches/[id]` `/login` `/signup` `/account` `/forgot-password` `/privacy` `/terms`

**Admin (role-protected):** `/admin` `/admin/matches` `/admin/players` (+ stubs for teams, AI, users, admins)

**API:** `/api/health` `/api/auth/*` `/api/predictions` `/api/admin/matches` `/api/admin/players/import`

---

## League data

- 4 groups (A–D), 16 teams as specified in the blueprint
- 24 group-stage fixtures with exact dates (Africa/Lagos); **kick-off times are TBC** until an admin sets them
- 8 knockout slots (QF1–4, SF1–2, Third place, Final) with dynamic opponent slots
- Group schedule is **not** a full round-robin; an admin validation screen should confirm completeness before kick-off
- Tables: Pts → GD → GF; top 2 per group qualify. Overall ranking is comparison only

---

## Predictions

Entertainment only — **no money, stakes or payouts**. Correct-score limited to one active record per user per match; outcomes upserted. Cutoff when match goes Live (or admin cutoff). Graded on FULL_TIME.

---

## Fan recovery

No SMS provider configured. Recovery uses username/phone + year of birth with rate-friendly generic responses and a short-lived token. Documented limitation; designed so an SMS/OTP provider can be plugged in later. Admin accounts have **no** forgot-password flow.

---

## CSV player import

Admin selects team → upload CSV → preview (row numbers, errors) → commit valid rows. Headers: `name`/`player`/`full_name`, optional `position`, `age`, `phone`, `jersey`. Duplicate within team → merge empty fields only. Private phones never exposed publicly.

---

## AI (RunPod)

Set `AI_ENABLED=true` and LLM vars. Keys stay server-side. Generation is optional; site works without AI. Drafts require review before publish (auto-publish off by default).

---

## Tests & build

```bash
npm run typecheck
npm run lint
npm test          # vitest unit tests for standings
npm run build
```

---

## Backups

```bash
docker compose exec db pg_dump -U league league_management > backup.sql
# Restore:
docker compose exec -T db psql -U league league_management < backup.sql
```

---

## Known limitations / next steps for owner

1. Group schedule is incomplete vs full round-robin — confirm with organiser before tournament start.
2. Fan recovery has no SMS — consider adding an OTP provider.
3. Shareable score-card image rendering is scaffolded for Phase 7 (download/share endpoints can use `satori` or Playwright).
4. Some admin sub-pages (teams CRUD UI, AI review UI, secondary admin management) are linked from the dashboard; core match score + CSV import + auth are fully wired.
5. Set production secrets in Coolify only; rotate `SESSION_SECRET` and DB password carefully.

---

## Licence

Proprietary — League Management organisers. Not for redistribution without permission.
