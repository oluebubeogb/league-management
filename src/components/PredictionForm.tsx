"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PredictionForm({
  matchId,
  homeName,
  awayName,
  disabled,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState<"OUTCOME" | "CORRECT_SCORE">("OUTCOME");
  const [outcome, setOutcome] = useState("HOME");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [stake, setStake] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    setMsg("");
    try {
      const body: Record<string, unknown> = {
        matchId,
        type,
        stakeAmount: stake,
      };
      if (type === "OUTCOME") body.selectedOutcome = outcome;
      if (type === "CORRECT_SCORE") {
        body.homeScore = homeScore;
        body.awayScore = awayScore;
      }
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg("Prediction saved");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded px-2 py-1 ${type === "OUTCOME" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}
          onClick={() => setType("OUTCOME")}
        >
          1X2
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${type === "CORRECT_SCORE" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}
          onClick={() => setType("CORRECT_SCORE")}
        >
          Correct score
        </button>
      </div>
      {type === "OUTCOME" && (
        <select
          className="w-full rounded border px-2 py-1"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        >
          <option value="HOME">{homeName} win</option>
          <option value="DRAW">Draw</option>
          <option value="AWAY">{awayName} win</option>
        </select>
      )}
      {type === "CORRECT_SCORE" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            className="w-16 rounded border px-2 py-1"
            value={homeScore}
            onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
          />
          <span>–</span>
          <input
            type="number"
            min={0}
            max={20}
            className="w-16 rounded border px-2 py-1"
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
          />
        </div>
      )}
      <label className="flex items-center gap-2 text-xs text-slate-600">
        Stake (coins, optional)
        <input
          type="number"
          min={0}
          max={5000}
          className="w-24 rounded border px-2 py-1"
          value={stake}
          onChange={(e) => setStake(parseInt(e.target.value, 10) || 0)}
        />
      </label>
      <button
        type="submit"
        disabled={loading || disabled}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        Submit prediction
      </button>
      {msg && <p className="text-xs text-slate-600">{msg}</p>}
    </form>
  );
}
