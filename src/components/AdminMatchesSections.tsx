"use client";

import { useState } from "react";
import { ScoreEditor } from "@/components/ScoreEditor";

type M = {
  id: string;
  homeName: string;
  awayName: string;
  meta: string;
  status: string;
  htHome?: number | null;
  htAway?: number | null;
  ftHome?: number | null;
  ftAway?: number | null;
};

function MatchBlock({ m }: { m: M }) {
  return (
    <div className="card p-4">
      <div className="mb-3">
        <p className="font-semibold text-slate-900">
          {m.homeName} vs {m.awayName}
        </p>
        <p className="text-xs text-slate-500">{m.meta}</p>
      </div>
      <ScoreEditor
        matchId={m.id}
        homeName={m.homeName}
        awayName={m.awayName}
        status={m.status}
        htHome={m.htHome}
        htAway={m.htAway}
        ftHome={m.ftHome}
        ftAway={m.ftAway}
      />
    </div>
  );
}

export function AdminMatchesSections({
  live,
  upcoming,
  results,
}: {
  live: M[];
  upcoming: M[];
  results: M[];
}) {
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [allResults, setAllResults] = useState(false);

  const upShow = allUpcoming ? upcoming : upcoming.slice(0, 5);
  const resShow = allResults ? results : results.slice(0, 5);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-bold text-red-700">Live</h2>
        {live.length === 0 ? (
          <p className="text-sm text-slate-400">No live matches.</p>
        ) : (
          <div className="space-y-4">
            {live.map((m) => (
              <MatchBlock key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming matches.</p>
        ) : (
          <div className="space-y-4">
            {upShow.map((m) => (
              <MatchBlock key={m.id} m={m} />
            ))}
            {upcoming.length > 5 && (
              <button
                type="button"
                className="btn-secondary w-full text-sm"
                onClick={() => setAllUpcoming((v) => !v)}
              >
                {allUpcoming ? "Show fewer" : `View all upcoming (${upcoming.length})`}
              </button>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Results</h2>
        {results.length === 0 ? (
          <p className="text-sm text-slate-400">No results yet.</p>
        ) : (
          <div className="space-y-4">
            {resShow.map((m) => (
              <MatchBlock key={m.id} m={m} />
            ))}
            {results.length > 5 && (
              <button
                type="button"
                className="btn-secondary w-full text-sm"
                onClick={() => setAllResults((v) => !v)}
              >
                {allResults ? "Show fewer" : `View all results (${results.length})`}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
