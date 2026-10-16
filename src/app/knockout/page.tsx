import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Knockout" };

const ORDER = ["QF1", "QF2", "QF3", "QF4", "SF1", "SF2", "ThirdPlace", "Final"];

export default async function KnockoutPage() {
  const matches = await prisma.match.findMany({
    where: { stage: { not: "GROUP" }, published: true },
    include: { homeTeam: true, awayTeam: true },
  });

  const sorted = [...matches].sort((a, b) => {
    const ia = ORDER.indexOf(a.slotCode || "");
    const ib = ORDER.indexOf(b.slotCode || "");
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const byStage: Record<string, typeof sorted> = {};
  for (const m of sorted) {
    const key = m.stage;
    if (!byStage[key]) byStage[key] = [];
    byStage[key].push(m);
  }

  const stageLabels: Record<string, string> = {
    QUARTER_FINAL: "Quarter-finals",
    SEMI_FINAL: "Semi-finals",
    THIRD_PLACE: "Third-place match",
    FINAL: "Final",
  };

  return (
    <div className="container-app space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Knockout bracket</h1>
        <p className="mt-1 text-sm text-slate-500">
          Opponents are resolved from group standings and previous knockout results. Slots show
          until teams are confirmed.
        </p>
      </div>

      {Object.entries(stageLabels).map(([stage, label]) => {
        const list = byStage[stage] || [];
        if (list.length === 0) return null;
        return (
          <section key={stage}>
            <h2 className="mb-3 text-lg font-bold text-slate-900">{label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((m) => (
                <MatchCard
                  key={m.id}
                  id={m.id}
                  homeName={m.homeTeam?.name || ""}
                  awayName={m.awayTeam?.name || ""}
                  homeShort={m.homeTeam?.shortName}
                  awayShort={m.awayTeam?.shortName}
                  homeScore={m.fullTimeHomeScore}
                  awayScore={m.fullTimeAwayScore}
                  htHome={m.halfTimeHomeScore}
                  htAway={m.halfTimeAwayScore}
                  status={m.status}
                  kickoffAt={m.kickoffAt}
                  stage={m.stage}
                  slotHome={m.homeSlot}
                  slotAway={m.awaySlot}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
