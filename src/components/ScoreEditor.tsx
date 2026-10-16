"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  matchId: string;
  homeName: string;
  awayName: string;
  status: string;
  htHome?: number | null;
  htAway?: number | null;
  ftHome?: number | null;
  ftAway?: number | null;
}

const STATUSES = ["SCHEDULED", "LIVE", "HALF_TIME", "FULL_TIME", "POSTPONED", "CANCELLED"];

export function ScoreEditor({
  matchId,
  homeName,
  awayName,
  status: initialStatus,
  htHome,
  htAway,
  ftHome,
  ftAway,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [htH, setHtH] = useState(htHome?.toString() ?? "");
  const [htA, setHtA] = useState(htAway?.toString() ?? "");
  const [ftH, setFtH] = useState(ftHome?.toString() ?? "");
  const [ftA, setFtA] = useState(ftAway?.toString() ?? "");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          status,
          halfTimeHomeScore: htH === "" ? null : Number(htH),
          halfTimeAwayScore: htA === "" ? null : Number(htA),
          fullTimeHomeScore: ftH === "" ? null : Number(ftH),
          fullTimeAwayScore: ftA === "" ? null : Number(ftA),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg("Saved");
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500">Status</label>
        <select
          className="input w-auto py-1.5"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="label text-xs">HT {homeName}</label>
          <input
            type="number"
            min={0}
            className="input py-1.5"
            value={htH}
            onChange={(e) => setHtH(e.target.value)}
          />
        </div>
        <div>
          <label className="label text-xs">HT {awayName}</label>
          <input
            type="number"
            min={0}
            className="input py-1.5"
            value={htA}
            onChange={(e) => setHtA(e.target.value)}
          />
        </div>
        <div>
          <label className="label text-xs">FT {homeName}</label>
          <input
            type="number"
            min={0}
            className="input py-1.5"
            value={ftH}
            onChange={(e) => setFtH(e.target.value)}
          />
        </div>
        <div>
          <label className="label text-xs">FT {awayName}</label>
          <input
            type="number"
            min={0}
            className="input py-1.5"
            value={ftA}
            onChange={(e) => setFtA(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn-primary text-xs py-1.5" disabled={loading} onClick={save}>
          {loading ? "Saving…" : "Save score & status"}
        </button>
        {msg && <span className="text-xs text-emerald-600">{msg}</span>}
      </div>
    </div>
  );
}
