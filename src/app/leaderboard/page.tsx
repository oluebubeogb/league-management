import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string }>;
}) {
  const sp = await searchParams;
  const leagueId = sp.leagueId;

  const where = leagueId
    ? { status: "GRADED" as const, match: { leagueId } }
    : { status: "GRADED" as const };

  const rows = await prisma.prediction.groupBy({
    by: ["userId"],
    where,
    _sum: { pointsAwarded: true, coinsAwarded: true },
    orderBy: { _sum: { pointsAwarded: "desc" } },
    take: 50,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, username: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const leaders = rows.map((r, i) => ({
    rank: i + 1,
    username: byId.get(r.userId)?.username || "?",
    points: r._sum.pointsAwarded || 0,
    coins: r._sum.coinsAwarded || 0,
  }));

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {leagueId ? "League leaderboard" : "Global leaderboard"}
        </h1>
        <Link href="/" className="text-sm text-emerald-700">
          Home
        </Link>
      </div>
      <p className="text-sm text-slate-500">
        Ranked by prediction points. Coins are virtual only — no real money.
      </p>
      {leaders.length === 0 ? (
        <p className="text-sm text-slate-500">No graded predictions yet.</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Player</th>
                <th className="p-3">Points</th>
                <th className="p-3">Coins won</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l) => (
                <tr key={l.rank} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{l.rank}</td>
                  <td className="p-3">{l.username}</td>
                  <td className="p-3">{l.points}</td>
                  <td className="p-3 text-amber-800">{l.coins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
