import { prisma } from "@/lib/db";
import { StandingsTable } from "@/components/StandingsTable";
import { calculateGroupTable } from "@/lib/standings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Groups" };

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: { displayOrder: "asc" },
    include: { teams: true },
  });

  const finished = await prisma.match.findMany({
    where: { status: "FULL_TIME", stage: "GROUP" },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      fullTimeHomeScore: true,
      fullTimeAwayScore: true,
      status: true,
      stage: true,
      groupId: true,
    },
  });

  const tables = groups.map((g) => {
    const teamInputs = g.teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      shortName: t.shortName,
      groupCode: g.code,
      color1: t.color1,
      color2: t.color2,
      color3: t.color3,
    }));
    const matchInputs = finished
      .filter((m) => m.groupId === g.id && m.homeTeamId && m.awayTeamId)
      .map((m) => ({
        homeTeamId: m.homeTeamId!,
        awayTeamId: m.awayTeamId!,
        fullTimeHomeScore: m.fullTimeHomeScore!,
        fullTimeAwayScore: m.fullTimeAwayScore!,
        status: m.status,
        stage: m.stage,
      }));
    const rows = calculateGroupTable(teamInputs, matchInputs).map((r) => {
      const t = teamInputs.find((x) => x.id === r.teamId);
      return { ...r, color1: t?.color1, color2: t?.color2, color3: t?.color3 };
    });
    return { group: g, rows };
  });

  return (
    <div className="container-app space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Group standings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Top two teams in each group qualify for the quarter-finals.
        </p>
      </div>

      {tables.map(({ group, rows }) => (
        <section key={group.id}>
          <h2 className="mb-2 text-lg font-bold text-slate-900">Group {group.code}</h2>
          <div className="card p-3">
            <StandingsTable rows={rows} />
          </div>
        </section>
      ))}

      <div className="card p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Tie-break order</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
          <li>Points</li>
          <li>Goal difference</li>
          <li>Goals scored</li>
          <li>Head-to-head (admin review if still tied)</li>
        </ol>
        <p className="mt-2 text-xs text-slate-400">
          Qualification is always within each group. Cross-group points do not affect who advances.
        </p>
      </div>
    </div>
  );
}
