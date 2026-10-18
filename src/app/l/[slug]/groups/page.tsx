import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { calculateGroupTable } from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) notFound();

  const groups = await prisma.group.findMany({
    where: { leagueId: league.id },
    include: {
      teams: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  const matches = await prisma.match.findMany({
    where: {
      leagueId: league.id,
      stage: "GROUP",
      status: "FULL_TIME",
      fullTimeHomeScore: { not: null },
      fullTimeAwayScore: { not: null },
    },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/l/${slug}`} className="text-emerald-700">
          {league.name}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Tables</span>
      </div>
      <h1 className="text-xl font-bold">Group tables</h1>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">No groups defined yet.</p>
      ) : (
        groups.map((g) => {
          const teamInputs = g.teams.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            shortName: t.shortName,
            groupCode: g.code,
          }));
          const matchInputs = matches
            .filter((m) => m.groupId === g.id && m.homeTeamId && m.awayTeamId)
            .map((m) => ({
              homeTeamId: m.homeTeamId!,
              awayTeamId: m.awayTeamId!,
              fullTimeHomeScore: m.fullTimeHomeScore!,
              fullTimeAwayScore: m.fullTimeAwayScore!,
              status: m.status,
              stage: m.stage,
            }));
          const table = calculateGroupTable(teamInputs, matchInputs);

          return (
            <section key={g.id} className="card overflow-x-auto">
              <h2 className="mb-3 font-semibold">
                {g.name} <span className="text-slate-400">({g.code})</span>
              </h2>
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-slate-500">
                    <th className="pb-2 pr-2">#</th>
                    <th className="pb-2 pr-2">Team</th>
                    <th className="pb-2 pr-1 text-center">P</th>
                    <th className="pb-2 pr-1 text-center">W</th>
                    <th className="pb-2 pr-1 text-center">D</th>
                    <th className="pb-2 pr-1 text-center">L</th>
                    <th className="pb-2 pr-1 text-center">GD</th>
                    <th className="pb-2 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, i) => (
                    <tr key={row.teamId} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2 text-slate-400">{i + 1}</td>
                      <td className="py-1.5 pr-2 font-medium">{row.teamName}</td>
                      <td className="py-1.5 pr-1 text-center">{row.played}</td>
                      <td className="py-1.5 pr-1 text-center">{row.won}</td>
                      <td className="py-1.5 pr-1 text-center">{row.drawn}</td>
                      <td className="py-1.5 pr-1 text-center">{row.lost}</td>
                      <td className="py-1.5 pr-1 text-center">{row.goalDifference}</td>
                      <td className="py-1.5 text-center font-semibold">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </div>
  );
}
