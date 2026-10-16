import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Results" };

export default async function ResultsPage() {
  const matches = await prisma.match.findMany({
    where: { status: "FULL_TIME", published: true },
    include: { homeTeam: true, awayTeam: true, group: true },
    orderBy: { kickoffAt: "desc" },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">Completed matches</p>
      </div>

      {matches.length === 0 ? (
        <p className="card p-8 text-center text-sm text-slate-500">
          No results yet. Scores will appear here once matches are completed.
        </p>
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
              htHome={m.halfTimeHomeScore}
              htAway={m.halfTimeAwayScore}
              status={m.status}
              kickoffAt={m.kickoffAt}
              groupCode={m.group?.code}
              stage={m.stage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
