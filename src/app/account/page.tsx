import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/LogoutButton";
import { formatPredictionLabel, formatPredDate } from "@/lib/prediction-label";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: {
      match: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  // Double-entry detection per match+type
  const typeCounts = new Map<string, number>();
  for (const p of predictions) {
    const k = `${p.matchId}:${p.type}`;
    typeCounts.set(k, (typeCounts.get(k) || 0) + 1);
  }

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your account</h1>
          <p className="text-sm text-slate-500">@{user.username}</p>
          <div className="mt-1">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="card p-4 text-sm">
        <p>
          <span className="text-slate-500">Role:</span> {user.role}
        </p>
        <p className="mt-1">
          <span className="text-slate-500">Member since:</span>{" "}
          {user.createdAt.toISOString().slice(0, 10)}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Prediction history</h2>
        {predictions.length === 0 ? (
          <p className="text-sm text-slate-400">No predictions yet.</p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {predictions.map((p) => {
              const home = p.match.homeTeam?.name || "Home";
              const away = p.match.awayTeam?.name || "Away";
              const tc = typeCounts.get(`${p.matchId}:${p.type}`) || 1;
              let mark = "";
              if (p.status === "GRADED" && p.isCorrect != null) {
                if (tc > 1) mark = "➖";
                else mark = p.isCorrect ? "✅" : "❌";
              }
              const label = formatPredictionLabel({
                type: p.type,
                selectedOutcome: p.selectedOutcome,
                homeScore: p.homeScore,
                awayScore: p.awayScore,
                homeName: home,
                awayName: away,
              });
              return (
                <div key={p.id} className="px-4 py-3 text-sm flex flex-wrap items-center gap-2">
                  {mark && <span>{mark}</span>}
                  <Link href={`/matches/${p.matchId}`} className="font-medium text-emerald-700">
                    {home} vs {away}
                  </Link>
                  <span className="text-slate-300">·</span>
                  <span>{label}</span>
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
