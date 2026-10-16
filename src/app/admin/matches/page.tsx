import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScoreEditor } from "@/components/ScoreEditor";
import { formatMatchDate, statusLabel } from "@/lib/utils";
import { AdminMatchesSections } from "@/components/AdminMatchesSections";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Matches" };

export default async function AdminMatchesPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) redirect("/login");

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true, group: true },
    orderBy: [{ kickoffAt: "asc" }, { matchday: "asc" }],
  });

  const live = matches.filter((m) => m.status === "LIVE" || m.status === "HALF_TIME");
  const upcoming = matches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "POSTPONED"
  );
  const results = matches
    .filter((m) => m.status === "FULL_TIME" || m.status === "CANCELLED")
    .sort((a, b) => (b.kickoffAt?.getTime() || 0) - (a.kickoffAt?.getTime() || 0));

  function mapMatch(m: (typeof matches)[0]) {
    return {
      id: m.id,
      homeName: m.homeTeam?.name || m.homeSlot || "TBD",
      awayName: m.awayTeam?.name || m.awaySlot || "TBD",
      meta: `${m.group ? `Group ${m.group.code}` : m.stage} · ${formatMatchDate(m.kickoffAt)} · ${statusLabel(m.status)}`,
      status: m.status,
      htHome: m.halfTimeHomeScore,
      htAway: m.halfTimeAwayScore,
      ftHome: m.fullTimeHomeScore,
      ftAway: m.fullTimeAwayScore,
    };
  }

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match administration</h1>
          <p className="text-sm text-slate-500">Live & upcoming first, then results</p>
        </div>
        <a href="/admin" className="btn-secondary text-sm">
          ← Dashboard
        </a>
      </div>

      <AdminMatchesSections
        live={live.map(mapMatch)}
        upcoming={upcoming.map(mapMatch)}
        results={results.map(mapMatch)}
      />
    </div>
  );
}
