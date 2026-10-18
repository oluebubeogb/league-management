import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime, statusLabel, statusColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) notFound();

  const matches = await prisma.match.findMany({
    where: {
      leagueId: league.id,
      published: true,
      status: { in: ["SCHEDULED", "LIVE", "HALF_TIME", "POSTPONED"] },
    },
    include: { homeTeam: true, awayTeam: true, group: true },
    orderBy: [{ matchday: "asc" }, { kickoffAt: "asc" }],
  });

  return (
    <div className="container-app space-y-4 py-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/l/${slug}`} className="text-emerald-700">
          {league.name}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Fixtures</span>
      </div>
      <h1 className="text-xl font-bold">Fixtures</h1>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500">No fixtures scheduled yet.</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">
                    {m.homeTeam?.name || m.homeSlot || "TBD"}{" "}
                    <span className="text-slate-400">vs</span>{" "}
                    {m.awayTeam?.name || m.awaySlot || "TBD"}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {m.matchday != null && `MD ${m.matchday} · `}
                    {formatDateTime(m.kickoffAt)}
                    {m.venue ? ` · ${m.venue}` : ""}
                    {m.group ? ` · Group ${m.group.code}` : ""}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(m.status)}`}>
                  {statusLabel(m.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
