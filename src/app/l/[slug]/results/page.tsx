import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) notFound();

  const matches = await prisma.match.findMany({
    where: { leagueId: league.id, published: true, status: "FULL_TIME" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffAt: "desc" },
  });

  return (
    <div className="container-app space-y-4 py-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/l/${slug}`} className="text-emerald-700">
          {league.name}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Results</span>
      </div>
      <h1 className="text-xl font-bold">Results</h1>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500">No results yet.</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id} className="card flex items-center justify-between text-sm">
              <span>
                {m.homeTeam?.name || "TBD"}{" "}
                <strong>
                  {m.fullTimeHomeScore ?? "-"} – {m.fullTimeAwayScore ?? "-"}
                </strong>{" "}
                {m.awayTeam?.name || "TBD"}
              </span>
              <span className="text-xs text-slate-400">{formatDateTime(m.kickoffAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
