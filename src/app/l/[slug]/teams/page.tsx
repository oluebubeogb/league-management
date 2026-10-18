import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) notFound();

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id, status: "ACTIVE" },
    include: { group: true, _count: { select: { players: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container-app space-y-4 py-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/l/${slug}`} className="text-emerald-700">
          {league.name}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Teams</span>
      </div>
      <h1 className="text-xl font-bold">Teams</h1>
      {teams.length === 0 ? (
        <p className="text-sm text-slate-500">No teams yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded"
                  style={{
                    background: `linear-gradient(180deg, ${t.color1} 0%, ${t.color2} 50%, ${t.color3} 100%)`,
                  }}
                />
                <span className="font-semibold">{t.name}</span>
                {t.shortName && (
                  <span className="text-xs text-slate-400">({t.shortName})</span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {t.group ? `Group ${t.group.code}` : "No group"} · {t._count.players} players
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
