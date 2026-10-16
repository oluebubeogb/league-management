"use client";

import { useMemo, useState } from "react";
import { formatPredDate } from "@/lib/prediction-label";

export type AdminPredRow = {
  id: string;
  username: string;
  phone: string;
  matchId: string;
  matchLabel: string;
  label: string;
  status: string;
  isCorrect: boolean | null;
  outcome: "correct" | "wrong" | "double" | "pending";
  createdAt: string;
  createdAtMs: number;
};

export function AdminPredictionsFilter({
  rows,
  matches,
}: {
  rows: AdminPredRow[];
  matches: { id: string; label: string }[];
}) {
  const [matchId, setMatchId] = useState("");
  const [matchQuery, setMatchQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showMatchList, setShowMatchList] = useState(false);

  const filteredMatches = useMemo(() => {
    const q = matchQuery.trim().toLowerCase();
    if (!q) return matches.slice(0, 40);
    return matches.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 40);
  }, [matches, matchQuery]);

  const filtered = useMemo(() => {
    let list = rows;
    if (matchId) list = list.filter((r) => r.matchId === matchId);
    if (outcome !== "all") list = list.filter((r) => r.outcome === outcome);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (!Number.isNaN(from)) list = list.filter((r) => r.createdAtMs >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      if (!Number.isNaN(to)) list = list.filter((r) => r.createdAtMs <= to);
    }
    return list;
  }, [rows, matchId, outcome, dateFrom, dateTo]);

  const selectedMatchLabel = matchId
    ? matches.find((m) => m.id === matchId)?.label || "Selected match"
    : "";

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</p>

        {/* Match autocomplete */}
        <div className="relative">
          <label className="label">Match</label>
          <input
            className="input"
            placeholder="Search match… (team names)"
            value={matchId ? selectedMatchLabel : matchQuery}
            onChange={(e) => {
              setMatchId("");
              setMatchQuery(e.target.value);
              setShowMatchList(true);
            }}
            onFocus={() => setShowMatchList(true)}
          />
          {showMatchList && !matchId && (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                onClick={() => {
                  setMatchId("");
                  setMatchQuery("");
                  setShowMatchList(false);
                }}
              >
                All matches
              </button>
              {filteredMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-emerald-50"
                  onClick={() => {
                    setMatchId(m.id);
                    setMatchQuery("");
                    setShowMatchList(false);
                  }}
                >
                  {m.label}
                </button>
              ))}
              {filteredMatches.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">No matches found</p>
              )}
            </div>
          )}
          {matchId && (
            <button
              type="button"
              className="mt-1 text-xs text-emerald-700 underline"
              onClick={() => {
                setMatchId("");
                setMatchQuery("");
              }}
            >
              Clear match filter
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Outcome</label>
            <select
              className="input"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="all">All</option>
              <option value="correct">Correct ✅</option>
              <option value="wrong">Wrong ❌</option>
              <option value="double">Double entry ➖</option>
              <option value="pending">Pending / ungraded</option>
            </select>
          </div>
          <div>
            <label className="label">From date</label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To date</label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong>{filtered.length}</strong> of {rows.length} loaded predictions
        </p>
      </div>

      <div className="card divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No predictions match the filters.</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {p.outcome === "correct" && <span title="Correct">✅</span>}
                {p.outcome === "wrong" && <span title="Wrong">❌</span>}
                {p.outcome === "double" && <span title="Double entry">➖</span>}
                <span className="font-medium">{p.username}</span>
                <span className="text-xs text-slate-400">{p.phone}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-600">{p.matchLabel}</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium text-emerald-800">{p.label}</span>
                <span className="text-slate-400">{p.status}</span>
                <span className="ml-auto text-slate-400">{formatPredDate(p.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
