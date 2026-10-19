import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime, statusLabel, statusColor } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import { PredictionForm } from "@/components/PredictionForm";

export const dynamic = "force-dynamic";

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) notFound();

  const user = await getSessionUser();

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Fixtures</h1>
        <Link
          href={`/leaderboard?leagueId=${league.id}`}
          className="text-sm font-medium text-emerald-700"
        >
          Leaderboard
        </Link>
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500">No fixtures scheduled yet.</p>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => {
            const canPredict =
              !!user &&
              m.status === "SCHEDULED" &&
              (!m.kickoffAt || m.kickoffAt > new Date()) &&
              (!m.predictionCutoffAt || m.predictionCutoffAt > new Date());
            return (
              <li key={m.id} className="card space-y-2">
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
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(m.status)}`}
                  >
                    {statusLabel(m.status)}
                  </span>
                </div>
                {user && (
                  <PredictionForm
                    matchId={m.id}
                    homeName={m.homeTeam?.name || "Home"}
                    awayName={m.awayTeam?.name || "Away"}
                    disabled={!canPredict}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
