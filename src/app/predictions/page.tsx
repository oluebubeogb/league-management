import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { PREDICTION_DISCLAIMER, formatDateTime } from "@/lib/utils";
import { formatPredictionLabel, formatPredDate } from "@/lib/prediction-label";
import { PredictionsClient } from "@/components/PredictionsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Predictions" };

function gradeIcon(
  p: { type: string; isCorrect: boolean | null; status: string },
  typeCount: number
): string {
  if (p.status !== "GRADED" || p.isCorrect == null) return "";
  if (typeCount > 1) return "➖"; // double entry in same category
  return p.isCorrect ? "✅" : "❌";
}

export default async function PredictionsPage() {
  const user = await getSessionUser();

  const upcoming = await prisma.match.findMany({
    where: {
      status: { in: ["SCHEDULED", "POSTPONED"] },
      published: true,
    },
    include: { homeTeam: true, awayTeam: true, group: true },
    orderBy: { kickoffAt: "asc" },
  });

  const userPreds =
    user != null
      ? await prisma.prediction.findMany({
          where: {
            userId: user.id,
            matchId: { in: upcoming.map((m) => m.id) },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const byMatch = new Map<string, typeof userPreds>();
  for (const p of userPreds) {
    const list = byMatch.get(p.matchId) || [];
    list.push(p);
    byMatch.set(p.matchId, list);
  }

  const matchPayload = upcoming.map((m) => {
    const homeName = m.homeTeam?.name || m.homeSlot || "TBD";
    const awayName = m.awayTeam?.name || m.awaySlot || "TBD";
    const preds = byMatch.get(m.id) || [];
    return {
      id: m.id,
      homeName,
      awayName,
      homeColor1: m.homeTeam?.color1,
      homeColor2: m.homeTeam?.color2,
      homeColor3: m.homeTeam?.color3,
      awayColor1: m.awayTeam?.color1,
      awayColor2: m.awayTeam?.color2,
      awayColor3: m.awayTeam?.color3,
      status: m.status,
      kickoffLabel: formatDateTime(m.kickoffAt),
      groupLabel: m.group ? `Group ${m.group.code}` : m.stage.replace(/_/g, " "),
      userPreds: preds.map((p) => ({
        id: p.id,
        type: p.type,
        label: formatPredictionLabel({
          type: p.type,
          selectedOutcome: p.selectedOutcome,
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          homeName,
          awayName,
        }),
        createdAt: p.createdAt.toISOString(),
      })),
    };
  });

  const recentPredictions = await prisma.prediction.findMany({
    where: { status: { in: ["ACTIVE", "CLOSED", "GRADED"] } },
    include: {
      user: { select: { username: true } },
      match: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  // Count same user+match+type for double-entry marker on feed
  const typeCounts = new Map<string, number>();
  for (const p of recentPredictions) {
    const k = `${p.userId}:${p.matchId}:${p.type}`;
    typeCounts.set(k, (typeCounts.get(k) || 0) + 1);
  }

  return (
    <div className="container-app space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Predictions</h1>
        <p className="mt-1 text-sm text-slate-500">Predict match outcomes and exact scores</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {PREDICTION_DISCLAIMER}
      </div>

      {!user && (
        <div className="card p-4 text-sm">
          <Link href="/login" className="text-emerald-600 underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="text-emerald-600 underline">
            sign up
          </Link>{" "}
          to submit predictions.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Upcoming matches</h2>
        {matchPayload.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">No open matches for prediction.</p>
        ) : (
          <PredictionsClient matches={matchPayload} loggedIn={!!user} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Recent fan predictions</h2>
        {recentPredictions.length === 0 ? (
          <p className="text-sm text-slate-400">No predictions yet.</p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {recentPredictions.map((p) => {
              const home = p.match.homeTeam?.name || "Home";
              const away = p.match.awayTeam?.name || "Away";
              const k = `${p.userId}:${p.matchId}:${p.type}`;
              const tc = typeCounts.get(k) || 1;
              const icon = gradeIcon(p, tc);
              const label = formatPredictionLabel({
                type: p.type,
                selectedOutcome: p.selectedOutcome,
                homeScore: p.homeScore,
                awayScore: p.awayScore,
                homeName: home,
                awayName: away,
              });
              return (
                <div key={p.id} className="px-4 py-3 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                  {icon && <span className="text-base leading-none">{icon}</span>}
                  <span className="font-medium">{p.user.username}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">
                    {home} vs {away}
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="font-medium text-emerald-800">{label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{formatPredDate(p.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
