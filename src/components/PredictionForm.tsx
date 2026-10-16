"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  matchId: string;
  homeName: string;
  awayName: string;
}

export function PredictionForm({ matchId, homeName, awayName }: Props) {
  const router = useRouter();
  const [outcome, setOutcome] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(type: "OUTCOME" | "CORRECT_SCORE") {
    setLoading(true);
    setMsg("");
    try {
      const body: Record<string, unknown> = { matchId, type, comment: comment || undefined };
      if (type === "OUTCOME") {
        if (!outcome) {
          setMsg("Select an outcome");
          setLoading(false);
          return;
        }
        body.selectedOutcome = outcome;
      } else {
        body.homeScore = Number(homeScore);
        body.awayScore = Number(awayScore);
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
      setMsg("Prediction saved!");
      setComment("");
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Your prediction</p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "HOME", label: `${homeName} Win` },
            { key: "DRAW", label: "Draw" },
            { key: "AWAY", label: `${awayName} Win` },
          ] as const
        ).map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setOutcome(o.key)}
            className={`btn text-xs py-1.5 px-3 ${
              outcome === o.key ? "bg-emerald-600 text-white" : "btn-secondary"
            }`}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          className="btn-primary text-xs py-1.5"
          disabled={loading || !outcome}
          onClick={() => submit("OUTCOME")}
        >
          Save outcome
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Exact score:</span>
        <input
          type="number"
          min={0}
          max={20}
          className="input w-16 py-1.5"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          placeholder="H"
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          max={20}
          className="input w-16 py-1.5"
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          placeholder="A"
        />
        <button
          type="button"
          className="btn-primary text-xs py-1.5"
          disabled={loading || homeScore === "" || awayScore === ""}
          onClick={() => submit("CORRECT_SCORE")}
        >
          Save score
        </button>
      </div>

      <input
        className="input text-xs"
        placeholder="Optional comment"
        maxLength={280}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {msg && <p className="text-xs text-emerald-700 font-medium">{msg}</p>}
    </div>
  );
}
