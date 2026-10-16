import { prisma } from "@/lib/db";
import { StandingsTable } from "@/components/StandingsTable";
import { calculateOverallRanking } from "@/lib/standings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overall standings" };

export default async function StandingsPage() {
  const teams = await prisma.team.findMany({ include: { group: true } });
  const finished = await prisma.match.findMany({
    where: { status: "FULL_TIME", stage: "GROUP" },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      fullTimeHomeScore: true,
      fullTimeAwayScore: true,
      status: true,
      stage: true,
    },
  });

  const teamInputs = teams.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    shortName: t.shortName,
    groupCode: t.group.code,
    color1: (t as { color1?: string }).color1,
    color2: (t as { color2?: string }).color2,
    color3: (t as { color3?: string }).color3,
  }));
  const matchInputs = finished
    .filter((m) => m.homeTeamId && m.awayTeamId)
    .map((m) => ({
      homeTeamId: m.homeTeamId!,
      awayTeamId: m.awayTeamId!,
      fullTimeHomeScore: m.fullTimeHomeScore!,
      fullTimeAwayScore: m.fullTimeAwayScore!,
      status: m.status,
      stage: m.stage,
    }));

  const rows = calculateOverallRanking(teamInputs, matchInputs).map((r) => {
    const t = teamInputs.find((x) => x.id === r.teamId);
    return { ...r, color1: t?.color1, color2: t?.color2, color3: t?.color3 };
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overall ranking</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cross-group comparison for overview only. Qualification is determined solely by position
          within each group.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This list does <strong>not</strong> decide who qualifies. Top two from each of Groups A–D
        advance to the knockout stage.
      </div>

      <div className="card p-3">
        <StandingsTable rows={rows} showGroup />
      </div>
    </div>
  );
}
