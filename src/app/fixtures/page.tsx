import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fixtures" };

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; status?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = { published: true };

  if (params.group) {
    where.group = { code: params.group.toUpperCase() };
  }
  if (params.status) {
    where.status = params.status.toUpperCase();
  } else {
    where.status = { in: ["SCHEDULED", "LIVE", "HALF_TIME", "POSTPONED"] };
  }

  const matches = await prisma.match.findMany({
    where,
    include: { homeTeam: true, awayTeam: true, group: true },
    orderBy: [{ kickoffAt: "asc" }, { matchday: "asc" }],
  });

  const groups = await prisma.group.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="container-app space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fixtures</h1>
        <p className="mt-1 text-sm text-slate-500">All upcoming and scheduled matches</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/fixtures"
          className={`badge ${!params.group ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
        >
          All groups
        </a>
        {groups.map((g) => (
          <a
            key={g.code}
            href={`/fixtures?group=${g.code}`}
            className={`badge ${params.group === g.code ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
          >
            Group {g.code}
          </a>
        ))}
      </div>

      {matches.length === 0 ? (
        <p className="card p-8 text-center text-sm text-slate-500">No fixtures match the filter.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
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
    </div>
  );
}
