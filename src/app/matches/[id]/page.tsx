import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  formatDateTime,
  statusLabel,
  statusColor,
  teamInitials,
  PREDICTION_DISCLAIMER,
} from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      group: true,
      events: {
        include: { player: true, team: true, relatedPlayer: true },
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
      },
      aiAnalyses: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 2,
      },
      predictions: {
        where: { status: { in: ["ACTIVE", "CLOSED", "GRADED"] } },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!match || !match.published) notFound();

  const homeName = match.homeTeam?.name || match.homeSlot || "TBD";
  const awayName = match.awayTeam?.name || match.awaySlot || "TBD";
  const showScore =
    match.status === "FULL_TIME" || match.status === "LIVE" || match.status === "HALF_TIME";

  const canPredict =
    user &&
    (match.status === "SCHEDULED" || match.status === "POSTPONED") &&
    (!match.predictionCutoffAt || match.predictionCutoffAt > new Date());

  return (
    <div className="container-app space-y-6 py-6">
      {/* Header */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            {match.group ? `Group ${match.group.code}` : match.stage.replace(/_/g, " ")}
            {match.slotCode && ` · ${match.slotCode}`}
          </span>
          <span className={`badge ${statusColor(match.status)}`}>{statusLabel(match.status)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
              {teamInitials(homeName, match.homeTeam?.shortName)}
            </span>
            <p className="text-sm font-semibold text-slate-900">{homeName}</p>
          </div>

          <div className="text-center">
            {showScore ? (
              <>
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {match.fullTimeHomeScore ?? 0}–{match.fullTimeAwayScore ?? 0}
                </p>
                {(match.halfTimeHomeScore != null || match.halfTimeAwayScore != null) && (
                  <p className="text-xs text-slate-400">
                    HT {match.halfTimeHomeScore ?? 0}–{match.halfTimeAwayScore ?? 0}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-slate-500">{formatDateTime(match.kickoffAt)}</p>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
              {teamInitials(awayName, match.awayTeam?.shortName)}
            </span>
            <p className="text-sm font-semibold text-slate-900">{awayName}</p>
          </div>
        </div>

        {match.venue && (
          <p className="mt-4 text-center text-xs text-slate-400">Venue: {match.venue}</p>
        )}
      </div>

      {/* Events timeline */}
      {match.events.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Match events</h2>
          <div className="card divide-y divide-slate-100">
            {match.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <span className="w-10 shrink-0 font-mono text-slate-400">
                  {e.minute != null ? `${e.minute}'` : "—"}
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    {e.eventType.replace(/_/g, " ")}
                    {e.ownGoal && " (OG)"}
                  </p>
                  <p className="text-slate-500">
                    {e.player?.fullName || "—"}
                    {e.team && ` · ${e.team.name}`}
                    {e.relatedPlayer && ` · Assist: ${e.relatedPlayer.fullName}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI analysis */}
      {match.aiAnalyses.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">AI analysis</h2>
          {match.aiAnalyses.map((a) => (
            <div key={a.id} className="card p-4">
              <p className="text-xs font-semibold uppercase text-emerald-600">{a.analysisType}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.content}</p>
            </div>
          ))}
        </section>
      )}

      {/* Predictions */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Fan predictions</h2>
        <p className="mb-3 text-xs text-slate-400">{PREDICTION_DISCLAIMER}</p>

        {canPredict ? (
          <div className="card p-4">
            <p className="text-sm text-slate-600">
              Logged in as <strong>{user!.username}</strong>.{" "}
              <Link href="/predictions" className="text-emerald-600 underline">
                Submit prediction
              </Link>
            </p>
          </div>
        ) : !user ? (
          <div className="card p-4 text-sm text-slate-600">
            <Link href="/login" className="text-emerald-600 underline">
              Log in
            </Link>{" "}
            to submit a prediction.
          </div>
        ) : null}

        {match.predictions.length > 0 ? (
          <div className="card mt-3 divide-y divide-slate-100">
            {match.predictions.map((p) => (
              <div key={p.id} className="px-4 py-3 text-sm">
                <span className="font-medium text-slate-900">{p.user.username}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-600">
                  {p.type === "CORRECT_SCORE"
                    ? `${p.homeScore}–${p.awayScore}`
                    : p.selectedOutcome}
                </span>
                {p.comment && (
                  <p className="mt-1 text-slate-500">{p.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No predictions yet.</p>
        )}
      </section>

      {match.notes && (
        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">Notes</h2>
          <p className="card p-4 text-sm text-slate-600">{match.notes}</p>
        </section>
      )}
    </div>
  );
}
