import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPredictionLabel } from "@/lib/prediction-label";
import { AdminPredictionsFilter } from "@/components/AdminPredictionsFilter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Predictions" };

export default async function AdminPredictionsPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) redirect("/login");

  const [predictions, allMatches, total] = await Promise.all([
    prisma.prediction.findMany({
      include: {
        user: { select: { id: true, username: true, phone: true } },
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true, group: true },
      orderBy: { kickoffAt: "desc" },
    }),
    prisma.prediction.count(),
  ]);

  // Double-entry counts: userId + matchId + type
  const typeCounts = new Map<string, number>();
  for (const p of predictions) {
    const k = `${p.userId}:${p.matchId}:${p.type}`;
    typeCounts.set(k, (typeCounts.get(k) || 0) + 1);
  }

  const rows = predictions.map((p) => {
    const home = p.match.homeTeam?.name || p.match.homeSlot || "Home";
    const away = p.match.awayTeam?.name || p.match.awaySlot || "Away";
    const k = `${p.userId}:${p.matchId}:${p.type}`;
    const tc = typeCounts.get(k) || 1;
    let outcome: "correct" | "wrong" | "double" | "pending" = "pending";
    if (p.status === "GRADED" && p.isCorrect != null) {
      if (tc > 1) outcome = "double";
      else outcome = p.isCorrect ? "correct" : "wrong";
    }
    return {
      id: p.id,
      username: p.user.username,
      phone: p.user.phone,
      matchId: p.matchId,
      matchLabel: `${home} vs ${away}`,
      label: formatPredictionLabel({
        type: p.type,
        selectedOutcome: p.selectedOutcome,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        homeName: home,
        awayName: away,
      }),
      status: p.status,
      isCorrect: p.isCorrect,
      outcome,
      createdAt: p.createdAt.toISOString(),
      createdAtMs: p.createdAt.getTime(),
    };
  });

  const matchOptions = allMatches.map((m) => {
    const home = m.homeTeam?.name || m.homeSlot || "Home";
    const away = m.awayTeam?.name || m.awaySlot || "Away";
    const g = m.group ? ` · Group ${m.group.code}` : "";
    return { id: m.id, label: `${home} vs ${away}${g}` };
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Predictions</h1>
          <p className="text-sm text-slate-500">
            {total} total · showing latest {predictions.length}
          </p>
        </div>
        <a href="/admin" className="btn-secondary text-sm shrink-0">
          ← Dashboard
        </a>
      </div>

      <AdminPredictionsFilter rows={rows} matches={matchOptions} />
    </div>
  );
}
