"use client";

import { useState } from "react";
import { PredictionForm } from "@/components/PredictionForm";
import { TeamFlag } from "@/components/TeamFlag";
import { formatPredDate } from "@/lib/prediction-label";

export interface MatchForPred {
  id: string;
  homeName: string;
  awayName: string;
  homeColor1?: string | null;
  homeColor2?: string | null;
  homeColor3?: string | null;
  awayColor1?: string | null;
  awayColor2?: string | null;
  awayColor3?: string | null;
  status: string;
  kickoffLabel: string;
  groupLabel: string;
  userPreds: {
    id: string;
    label: string;
    createdAt: string;
    type: string;
  }[];
}

export function PredictionsClient({
  matches,
  loggedIn,
}: {
  matches: MatchForPred[];
  loggedIn: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? matches : matches.slice(0, 5);
  const hasMore = matches.length > 5;

  return (
    <div className="space-y-3">
      {visible.map((m) => {
        const open = openId === m.id;
        return (
          <div key={m.id} className="card overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
              onClick={() => setOpenId(open ? null : m.id)}
            >
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <span className="truncate text-sm font-semibold">{m.homeName}</span>
                <TeamFlag color1={m.homeColor1} color2={m.homeColor2} color3={m.homeColor3} size="sm" />
              </div>
              <div className="shrink-0 text-center text-xs text-slate-400 px-1">vs</div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamFlag color1={m.awayColor1} color2={m.awayColor2} color3={m.awayColor3} size="sm" />
                <span className="truncate text-sm font-semibold">{m.awayName}</span>
              </div>
              <span className="ml-2 shrink-0 text-slate-400 text-lg">{open ? "▾" : "▸"}</span>
            </button>
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
              <span>{m.groupLabel}</span>
              <span>{m.kickoffLabel}</span>
              {!loggedIn && <span className="text-amber-700">Log in to predict</span>}
            </div>

            {m.userPreds.length > 0 && (
              <div className="border-t border-slate-50 px-4 py-2 space-y-1">
                {m.userPreds.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-emerald-800">{p.label}</span>
                    <span className="text-slate-400">{formatPredDate(p.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}

            {open && loggedIn && (
              <div className="border-t border-slate-100 p-3">
                <PredictionForm matchId={m.id} homeName={m.homeName} awayName={m.awayName} />
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          className="btn-secondary w-full text-sm"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show fewer matches" : `View all upcoming (${matches.length})`}
        </button>
      )}
    </div>
  );
}
