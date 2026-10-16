"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamFlag } from "@/components/TeamFlag";

interface TeamRow {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  color1: string;
  color2: string;
  color3: string;
  groupCode: string;
  playerCount: number;
}

export function TeamEditor({ teams }: { teams: TeamRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    color1: "#16a34a",
    color2: "#ffffff",
    color3: "#0f172a",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function startEdit(t: TeamRow) {
    setEditing(t.id);
    setForm({
      name: t.name,
      shortName: t.shortName || "",
      color1: t.color1 || "#16a34a",
      color2: t.color2 || "#ffffff",
      color3: t.color3 || "#0f172a",
    });
    setMsg("");
  }

  async function save() {
    if (!editing) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: editing,
          name: form.name,
          shortName: form.shortName || null,
          color1: form.color1,
          color2: form.color2,
          color3: form.color3,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg("Saved");
      setEditing(null);
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {teams.map((t) => (
        <div key={t.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TeamFlag color1={t.color1} color2={t.color2} color3={t.color3} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">
                  Group {t.groupCode}
                  {t.shortName ? ` · ${t.shortName}` : ""} · {t.playerCount} players
                </p>
              </div>
            </div>
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => startEdit(t)}>
              Edit
            </button>
          </div>

          {editing === t.id && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Team name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Short code (max 5 chars)</label>
                  <input
                    className="input"
                    maxLength={5}
                    value={form.shortName}
                    onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                    placeholder="e.g. AMU"
                  />
                </div>
              </div>
              <div>
                <label className="label">Flag colours (top / middle / bottom)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={form.color1}
                    onChange={(e) => setForm((f) => ({ ...f, color1: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                  />
                  <input
                    type="color"
                    value={form.color2}
                    onChange={(e) => setForm((f) => ({ ...f, color2: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                  />
                  <input
                    type="color"
                    value={form.color3}
                    onChange={(e) => setForm((f) => ({ ...f, color3: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                  />
                  <TeamFlag
                    color1={form.color1}
                    color2={form.color2}
                    color3={form.color3}
                    size="lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-primary text-sm" disabled={loading} onClick={save}>
                  {loading ? "Saving…" : "Save team"}
                </button>
                <button type="button" className="btn-ghost text-sm" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                {msg && <span className="text-xs text-emerald-600">{msg}</span>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
