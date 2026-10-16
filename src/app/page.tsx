import Link from "next/link";
import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/MatchCard";
import { StandingsTable } from "@/components/StandingsTable";
import { calculateGroupTable } from "@/lib/standings";
import { SPONSOR, PREDICTION_DISCLAIMER } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [liveMatches, lastResult, upcoming, recent, groups, teams, finishedMatches, analyses] =
    await Promise.all([
      prisma.match.findMany({
        where: { status: { in: ["LIVE", "HALF_TIME"] }, published: true },
        include: { homeTeam: true, awayTeam: true, group: true },
        orderBy: { kickoffAt: "asc" },
        take: 1,
      }),
      prisma.match.findFirst({
        where: { status: "FULL_TIME", published: true },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { kickoffAt: "desc" },
      }),
      prisma.match.findMany({
        where: { status: { in: ["SCHEDULED", "LIVE", "HALF_TIME"] }, published: true },
        include: { homeTeam: true, awayTeam: true, group: true },
        orderBy: { kickoffAt: "asc" },
        take: 6,
      }),
      prisma.match.findMany({
        where: { status: "FULL_TIME", published: true },
        include: { homeTeam: true, awayTeam: true, group: true },
        orderBy: { kickoffAt: "desc" },
        take: 4,
      }),
      prisma.group.findMany({ orderBy: { displayOrder: "asc" }, include: { teams: true } }),
      prisma.team.findMany({ include: { group: true } }),
      prisma.match.findMany({
        where: { status: "FULL_TIME", stage: "GROUP" },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          fullTimeHomeScore: true,
          fullTimeAwayScore: true,
          status: true,
          stage: true,
        },
      }),
      prisma.aIAnalysis.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 2,
        include: { match: { include: { homeTeam: true, awayTeam: true } } },
      }),
    ]);

  const groupA = groups.find((g) => g.code === "A");
  let sampleTable = null;
  if (groupA) {
    const teamInputs = groupA.teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      shortName: t.shortName,
      groupCode: "A",
      color1: t.color1,
      color2: t.color2,
      color3: t.color3,
    }));
    const matchInputs = finishedMatches
      .filter((m) => m.homeTeamId && m.awayTeamId)
      .map((m) => ({
        homeTeamId: m.homeTeamId!,
        awayTeamId: m.awayTeamId!,
        fullTimeHomeScore: m.fullTimeHomeScore!,
        fullTimeAwayScore: m.fullTimeAwayScore!,
        status: m.status,
        stage: m.stage,
      }));
    sampleTable = calculateGroupTable(teamInputs, matchInputs).map((r) => {
      const t = teamInputs.find((x) => x.id === r.teamId);
      return { ...r, color1: t?.color1, color2: t?.color2, color3: t?.color3 };
    });
  }

  return {
    liveMatches,
    lastResult,
    upcoming,
    recent,
    sampleTable,
    analyses,
    groupCount: groups.length,
    teamCount: teams.length,
  };
}

export default async function HomePage() {
  const data = await getHomeData();
  const live = data.liveMatches[0];
  const highlight = live || data.lastResult;

  return (
    <div className="container-app space-y-8 py-6">
      {/* Live / last result strip */}
      {highlight && (
        <Link
          href={`/matches/${highlight.id}`}
          className="block overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 px-4 py-3 text-white shadow-md transition hover:shadow-lg"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
            {live ? (live.status === "HALF_TIME" ? "Half-time" : "Live") : "Full-time"}
          </p>
          <p className="mt-0.5 text-base font-semibold sm:text-lg">
            {highlight.homeTeam?.name || "Home"}{" "}
            <span className="tabular-nums text-emerald-300">
              {highlight.fullTimeHomeScore ?? 0}–{highlight.fullTimeAwayScore ?? 0}
            </span>{" "}
            {highlight.awayTeam?.name || "Away"}
          </p>
        </Link>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-5 py-8 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
        <p className="relative text-sm font-medium text-emerald-400">11 Oct 2026 – 3 Jan 2027</p>
        <h1 className="relative mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          League Management
        </h1>
        <p className="relative mt-2 max-w-xl text-sm text-slate-300">
          Official fixtures, live standings, fan predictions and AI match analysis for the
          community leagues.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <Link href="/fixtures" className="btn-primary">
            View fixtures
          </Link>
          <Link
            href="/groups"
            className="btn border border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
          >
            Group tables
          </Link>
        </div>
      </section>

      {/* Sponsor — lively card */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 px-5 py-5 shadow-sm">
        <div className="pointer-events-none absolute -right-4 top-0 text-6xl opacity-20">⚽</div>
        <div className="pointer-events-none absolute bottom-1 left-2 text-4xl opacity-15">🏆</div>
        <div className="pointer-events-none absolute right-12 bottom-2 h-16 w-16 rounded-full bg-emerald-300/30 blur-xl" />
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Sponsored by</p>
        <p className="mt-2 text-sm font-semibold leading-snug text-emerald-950 sm:text-base">
          {SPONSOR}
        </p>
        <p className="mt-2 text-[11px] text-emerald-800/70">League Management · Community football</p>
      </section>

      {/* Stats strip — richer cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Groups", value: data.groupCount, emoji: "🏟️", tint: "from-emerald-500/15 to-emerald-600/5" },
          { label: "Teams", value: data.teamCount, emoji: "👕", tint: "from-sky-500/15 to-sky-600/5" },
          { label: "Upcoming", value: data.upcoming.length, emoji: "📅", tint: "from-amber-500/15 to-amber-600/5" },
          { label: "Results", value: data.recent.length, emoji: "📊", tint: "from-violet-500/15 to-violet-600/5" },
        ].map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br ${s.tint} px-4 py-4 text-center shadow-sm`}
          >
            <span className="absolute right-2 top-2 text-lg opacity-40">{s.emoji}</span>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Upcoming fixtures</h2>
          <Link href="/fixtures" className="text-sm font-medium text-emerald-600">
            All →
          </Link>
        </div>
        {data.upcoming.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">No upcoming fixtures yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.upcoming.map((m) => (
              <MatchCard
                key={m.id}
                id={m.id}
                homeName={m.homeTeam?.name || ""}
                awayName={m.awayTeam?.name || ""}
                homeShort={m.homeTeam?.shortName}
                awayShort={m.awayTeam?.shortName}
                homeColor1={m.homeTeam?.color1}
                homeColor2={m.homeTeam?.color2}
                homeColor3={m.homeTeam?.color3}
                awayColor1={m.awayTeam?.color1}
                awayColor2={m.awayTeam?.color2}
                awayColor3={m.awayTeam?.color3}
                homeScore={m.fullTimeHomeScore}
                awayScore={m.fullTimeAwayScore}
                status={m.status}
                kickoffAt={m.kickoffAt}
                groupCode={m.group?.code}
                stage={m.stage}
                slotHome={m.homeSlot}
                slotAway={m.awaySlot}
              />
            ))}
          </div>
        )}
      </section>

      {data.recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent results</h2>
            <Link href="/results" className="text-sm font-medium text-emerald-600">
              All →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.recent.map((m) => (
              <MatchCard
                key={m.id}
                id={m.id}
                homeName={m.homeTeam?.name || ""}
                awayName={m.awayTeam?.name || ""}
                homeShort={m.homeTeam?.shortName}
                awayShort={m.awayTeam?.shortName}
                homeColor1={m.homeTeam?.color1}
                homeColor2={m.homeTeam?.color2}
                homeColor3={m.homeTeam?.color3}
                awayColor1={m.awayTeam?.color1}
                awayColor2={m.awayTeam?.color2}
                awayColor3={m.awayTeam?.color3}
                homeScore={m.fullTimeHomeScore}
                awayScore={m.fullTimeAwayScore}
                htHome={m.halfTimeHomeScore}
                htAway={m.halfTimeAwayScore}
                status={m.status}
                kickoffAt={m.kickoffAt}
                groupCode={m.group?.code}
                stage={m.stage}
              />
            ))}
          </div>
        </section>
      )}

      {data.sampleTable && data.sampleTable.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Group A standings</h2>
            <Link href="/groups" className="text-sm font-medium text-emerald-600">
              All groups →
            </Link>
          </div>
          <div className="card p-3">
            <StandingsTable rows={data.sampleTable} compact />
            <p className="mt-2 px-2 text-xs text-slate-400">
              Top 2 qualify for quarter-finals. Sorted by Pts → GD → GF.
            </p>
          </div>
        </section>
      )}

      {data.analyses.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">AI analysis</h2>
          <div className="space-y-3">
            {data.analyses.map((a) => (
              <div key={a.id} className="card p-4">
                <p className="text-xs font-medium uppercase text-emerald-600">{a.analysisType}</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-700">{a.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-slate-400">{PREDICTION_DISCLAIMER}</p>
    </div>
  );
}
