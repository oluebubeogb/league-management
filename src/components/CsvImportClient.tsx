"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Entity = "TEAMS" | "PLAYERS" | "FIXTURES" | "SCORES" | "GROUPS";

type PreviewRow = {
  rowNumber: number;
  action: string;
  summary: string;
  errors: string[];
  warnings: string[];
};

export function CsvImportClient({ leagueId }: { leagueId: string }) {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity>("TEAMS");
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rows: PreviewRow[];
  } | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function doPreview() {
    if (!file && !csvText) {
      setMsg("Choose a CSV file first");
      return;
    }
    setLoading(true);
    setMsg("");
    setPreview(null);
    try {
      let text = csvText;
      if (file) text = await file.text();
      setCsvText(text);
      const res = await fetch(`/api/leagues/${leagueId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, action: "preview", csv: text, filename: file?.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Preview failed");
        return;
      }
      setPreview(data);
      setMsg(`Preview: ${data.validRows} valid, ${data.invalidRows} invalid of ${data.totalRows}`);
    } catch {
      setMsg("Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function doCommit() {
    if (!csvText) {
      setMsg("Preview first");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/leagues/${leagueId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          action: "commit",
          csv: csvText,
          filename: file?.name || "upload.csv",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Commit failed");
        return;
      }
      setMsg(`Imported: ${data.created} created, ${data.updated} updated`);
      setPreview(null);
      router.refresh();
    } catch {
      setMsg("Commit failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const templates: Record<Entity, string> = {
      TEAMS: "name,shortName,groupCode,color1,color2\nExample FC,EXF,A,#16a34a,#fff\n",
      PLAYERS: "fullName,team,position,age,jerseyNumber\nJohn Doe,Example FC,FW,24,9\n",
      GROUPS: "code,name,displayOrder\nA,Group A,0\n",
      FIXTURES: "matchday,stage,home,away,kickoff,venue,group\n1,GROUP,Example FC,Other FC,2026-11-01T15:00:00Z,Main Pitch,A\n",
      SCORES: "match_id,home,away,ft_home,ft_away,status\n,Example FC,Other FC,2,1,FULL_TIME\n",
    };
    const blob = new Blob([templates[entity]], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${entity.toLowerCase()}-template.csv`;
    a.click();
  }

  function downloadExport() {
    window.open(`/api/leagues/${leagueId}/export?entity=${entity}`, "_blank");
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">CSV Import / Export</h2>
      <div className="flex flex-wrap gap-2">
        {(["TEAMS", "PLAYERS", "GROUPS", "FIXTURES", "SCORES"] as Entity[]).map((e) => (
          <button
            key={e}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              entity === e ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => {
              setEntity(e);
              setPreview(null);
              setMsg("");
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="file"
          accept=".csv,text/csv"
          className="text-sm"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setPreview(null);
          }}
        />
        <button
          type="button"
          disabled={loading}
          onClick={doPreview}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Preview
        </button>
        <button
          type="button"
          disabled={loading || !preview || preview.validRows === 0}
          onClick={doCommit}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Commit valid rows
        </button>
        <button type="button" onClick={downloadTemplate} className="text-sm text-emerald-700 underline">
          Template
        </button>
        <button type="button" onClick={downloadExport} className="text-sm text-emerald-700 underline">
          Export current
        </button>
      </div>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {preview && (
        <div className="max-h-64 overflow-auto rounded border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Action</th>
                <th className="p-2">Summary</th>
                <th className="p-2">Issues</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={r.rowNumber} className="border-t border-slate-100">
                  <td className="p-2">{r.rowNumber}</td>
                  <td className="p-2">
                    <span
                      className={
                        r.action === "error"
                          ? "text-red-600"
                          : r.action === "create"
                            ? "text-emerald-700"
                            : "text-amber-700"
                      }
                    >
                      {r.action}
                    </span>
                  </td>
                  <td className="p-2">{r.summary}</td>
                  <td className="p-2 text-red-600">
                    {[...r.errors, ...r.warnings].join("; ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
