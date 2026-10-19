import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const leagueId = url.searchParams.get("leagueId");
  const scope = url.searchParams.get("scope") || "global"; // global | league
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

  // Aggregate points + coins from graded predictions
  if (scope === "league" && leagueId) {
    const rows = await prisma.prediction.groupBy({
      by: ["userId"],
      where: {
        status: "GRADED",
        match: { leagueId },
      },
      _sum: { pointsAwarded: true, coinsAwarded: true },
      orderBy: { _sum: { pointsAwarded: "desc" } },
      take: limit,
    });
    const users = await prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.userId) } },
      select: { id: true, username: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return NextResponse.json({
      scope: "league",
      leagueId,
      leaders: rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        username: byId.get(r.userId)?.username || "?",
        points: r._sum.pointsAwarded || 0,
        coins: r._sum.coinsAwarded || 0,
      })),
    });
  }

  // Global
  const rows = await prisma.prediction.groupBy({
    by: ["userId"],
    where: { status: "GRADED" },
    _sum: { pointsAwarded: true, coinsAwarded: true },
    orderBy: { _sum: { pointsAwarded: "desc" } },
    take: limit,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, username: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return NextResponse.json({
    scope: "global",
    leaders: rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      username: byId.get(r.userId)?.username || "?",
      points: r._sum.pointsAwarded || 0,
      coins: r._sum.coinsAwarded || 0,
    })),
  });
}
