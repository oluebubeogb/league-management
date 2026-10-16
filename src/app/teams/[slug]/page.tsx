import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/MatchCard";
import { teamInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      group: true,
      players: { where: { status: "ACTIVE" }, orderBy: { fullName: "asc" } },
      homeMatches: {
        include: { homeTeam: true, awayTeam: true, group: true },
        orderBy: { kickoffAt: "asc" },
      },
      awayMatches: {
        include: { homeTeam: true, awayTeam: true, group: true },
        orderBy: { kickoffAt: "asc" },
      },
    },
  });

  if (!team) notFound();

  const allMatches = [...team.homeMatches, ...team.awayMatches].sort((a, b) => {
    const da = a.kickoffAt?.getTime() ?? 0;
    const db = b.kickoffAt?.getTime() ?? 0;
    return da - db;
  });

  return (
    <div className="container-app space-y-8 py-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700">
          {teamInitials(team.name, team.shortName)}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
          <p className="text-sm text-slate-500">Group {team.group.code}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Squad ({team.players.length})
        </h2>
        {team.players.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">
            No players registered yet. Admins can import a CSV roster.
          </p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {team.players.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{p.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {p.position || "—"}
                    {p.jerseyNumber != null && ` · #${p.jerseyNumber}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Fixtures & results</h2>
        {allMatches.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">No matches scheduled.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 max-w-full">
            {allMatches.map((m) => (
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
      </section>
    </div>
  );
}
