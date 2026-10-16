"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption {
  id: string;
  name: string;
  group: string;
  playerCount: number;
}

export function CsvImportForm({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    valid: number;
    invalid: number;
    rows: { rowNumber: number; fullName: string; errors: string[] }[];
  } | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function doPreview() {
    if (!teamId || !file) return;
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("teamId", teamId);
    fd.append("file", file);
    fd.append("action", "preview");
    try {
      const res = await fetch("/api/admin/players/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Preview failed");
        return;
      }
      setPreview(data);
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function doCommit() {
    if (!teamId || !file) return;
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("teamId", teamId);
    fd.append("file", file);
    fd.append("action", "commit");
    try {
      const res = await fetch("/api/admin/players/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Import failed");
        return;
      }
      setMsg(`Imported ${data.imported} players (${data.skipped} skipped).`);
      setPreview(null);
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4 p-4">
      <div>
        <label className="label">Team</label>
        <select
          className="input"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">Select team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (Group {t.group}) — {t.playerCount} players
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">CSV file</label>
        <input
          type="file"
          accept=".csv,text/csv"
          className="input"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="mt-1 text-xs text-slate-400">
          Required column: name / player / full_name. Optional: position, age, phone, jersey.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={!teamId || !file || loading}
          onClick={doPreview}
        >
          Preview
        </button>
        <button
          type="button"
          className="btn-primary text-sm"
          disabled={!preview || loading}
          onClick={doCommit}
        >
          Commit valid rows
        </button>
      </div>
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      {preview && (
        <div className="text-sm">
          <p>
            Valid: {preview.valid} · Invalid: {preview.invalid}
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto rounded border border-slate-200">
            {preview.rows.slice(0, 30).map((r) => (
              <div key={r.rowNumber} className="border-b border-slate-100 px-3 py-1.5 text-xs">
                Row {r.rowNumber}: {r.fullName || "(empty)"}
                {r.errors.length > 0 && (
                  <span className="ml-2 text-red-600">{r.errors.join(", ")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
