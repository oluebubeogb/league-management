"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; code: string; name: string };
type Team = { id: string; name: string; groupId: string | null; groupCode: string | null };
type MatchRow = {
  id: string;
  homeName: string;
  awayName: string;
  status: string;
  htHome: number | null;
  htAway: number | null;
  ftHome: number | null;
  ftAway: number | null;
  matchday: number | null;
};

export function LeagueAdminClient({
  leagueId,
  slug,
  groups,
  teams,
  matches,
}: {
  leagueId: string;
  slug: string;
  groups: Group[];
  teams: Team[];
  matches: MatchRow[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"groups" | "teams" | "matches" | "scores">("groups");

  async function post(path: string, body: unknown) {
    setMsg("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return null;
    }
    setMsg("Saved");
    router.refresh();
    return data;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["groups", "teams", "matches", "scores"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      {tab === "groups" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Groups</h2>
          <ul className="text-sm">
            {groups.map((g) => (
              <li key={g.id}>
                {g.code} — {g.name}
              </li>
            ))}
          </ul>
          <GroupForm
            onSubmit={async (code, name) => {
              await post(`/api/leagues/${leagueId}/groups`, { code, name, displayOrder: groups.length });
            }}
          />
        </div>
      )}

      {tab === "teams" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Teams</h2>
          <ul className="text-sm">
            {teams.map((t) => (
              <li key={t.id}>
                {t.name} {t.groupCode ? `(${t.groupCode})` : ""}
              </li>
            ))}
          </ul>
          <TeamForm
            groups={groups}
            onSubmit={async (name, shortName, groupId) => {
              await post(`/api/leagues/${leagueId}/teams`, { name, shortName, groupId: groupId || null });
            }}
          />
        </div>
      )}

      {tab === "matches" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Add fixture</h2>
          <MatchForm
            teams={teams}
            groups={groups}
            onSubmit={async (payload) => {
              await post(`/api/leagues/${leagueId}/matches`, payload);
            }}
          />
          <h3 className="pt-2 text-sm font-medium text-slate-500">Recent</h3>
          <ul className="text-sm">
            {matches.slice(0, 15).map((m) => (
              <li key={m.id}>
                {m.homeName} vs {m.awayName} · {m.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "scores" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Enter scores</h2>
          {matches.map((m) => (
            <ScoreRow
              key={m.id}
              match={m}
              onSave={async (payload) => {
                await post(`/api/leagues/${leagueId}/matches`, { matchId: m.id, ...payload });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupForm({ onSubmit }: { onSubmit: (code: string, name: string) => Promise<void> }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <input className="input w-20" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
      <input className="input flex-1" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" className="btn-primary" onClick={() => onSubmit(code, name)}>
        Add group
      </button>
    </div>
  );
}

function TeamForm({
  groups,
  onSubmit,
}: {
  groups: Group[];
  onSubmit: (name: string, shortName: string, groupId: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [shortName, setShort] = useState("");
  const [groupId, setGroupId] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <input className="input flex-1" placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input w-20" placeholder="Abbr" value={shortName} onChange={(e) => setShort(e.target.value)} />
      <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
        <option value="">No group</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.code}
          </option>
        ))}
      </select>
      <button type="button" className="btn-primary" onClick={() => onSubmit(name, shortName, groupId)}>
        Add team
      </button>
    </div>
  );
}

function MatchForm({
  teams,
  groups,
  onSubmit,
}: {
  teams: Team[];
  groups: Group[];
  onSubmit: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [homeTeamId, setHome] = useState("");
  const [awayTeamId, setAway] = useState("");
  const [groupId, setGroup] = useState("");
  const [matchday, setMd] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <select className="input" value={homeTeamId} onChange={(e) => setHome(e.target.value)}>
        <option value="">Home</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select className="input" value={awayTeamId} onChange={(e) => setAway(e.target.value)}>
        <option value="">Away</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select className="input" value={groupId} onChange={(e) => setGroup(e.target.value)}>
        <option value="">Group</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.code}
          </option>
        ))}
      </select>
      <input className="input w-20" placeholder="MD" value={matchday} onChange={(e) => setMd(e.target.value)} />
      <button
        type="button"
        className="btn-primary"
        onClick={() =>
          onSubmit({
            homeTeamId: homeTeamId || null,
            awayTeamId: awayTeamId || null,
            groupId: groupId || null,
            matchday: matchday ? Number(matchday) : null,
            stage: "GROUP",
          })
        }
      >
        Add match
      </button>
    </div>
  );
}

function ScoreRow({
  match,
  onSave,
}: {
  match: MatchRow;
  onSave: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [ftHome, setFtH] = useState(String(match.ftHome ?? ""));
  const [ftAway, setFtA] = useState(String(match.ftAway ?? ""));
  const [status, setStatus] = useState(match.status);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2 text-sm">
      <span className="min-w-[10rem] font-medium">
        {match.homeName} vs {match.awayName}
      </span>
      <input className="input w-14" value={ftHome} onChange={(e) => setFtH(e.target.value)} placeholder="H" />
      <span>–</span>
      <input className="input w-14" value={ftAway} onChange={(e) => setFtA(e.target.value)} placeholder="A" />
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        {["SCHEDULED", "LIVE", "HALF_TIME", "FULL_TIME", "POSTPONED", "CANCELLED"].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() =>
          onSave({
            status,
            fullTimeHomeScore: ftHome === "" ? null : Number(ftHome),
            fullTimeAwayScore: ftAway === "" ? null : Number(ftAway),
          })
        }
      >
        Save
      </button>
    </div>
  );
}
