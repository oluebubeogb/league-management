import { parse } from "csv-parse/sync";

// ── Shared helpers ──────────────────────────────────────────────────

function findCol(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

function parseCsvRecords(buffer: Buffer | string): { records: string[][]; hasHeader: boolean; headers: string[] } {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  const cleaned = text.replace(/^\uFEFF/, "");
  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (records.length === 0) return { records: [], hasHeader: false, headers: [] };
  return { records, hasHeader: false, headers: [] }; // header detection per entity
}

export function normalizePlayerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ── Players ─────────────────────────────────────────────────────────

export interface ParsedPlayerRow {
  rowNumber: number;
  fullName: string;
  teamSlug?: string;
  teamName?: string;
  position?: string;
  age?: number;
  phone?: string;
  jerseyNumber?: number;
  nationality?: string;
  errors: string[];
  warnings: string[];
}

const NAME_HEADERS = ["name", "player", "full_name", "player_name", "fullname"];
const POS_HEADERS = ["position", "pos"];
const AGE_HEADERS = ["age"];
const PHONE_HEADERS = ["phone", "phone_number", "mobile"];
const JERSEY_HEADERS = ["jersey", "jersey_number", "number", "shirt"];
const TEAM_HEADERS = ["team", "team_name", "teamname", "club"];
const TEAM_SLUG_HEADERS = ["team_slug", "teamslug", "slug"];
const NAT_HEADERS = ["nationality", "nation", "country"];

export function parsePlayerCSV(buffer: Buffer | string): {
  rows: ParsedPlayerRow[];
  hasHeader: boolean;
  headers: string[];
} {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  const cleaned = text.replace(/^\uFEFF/, "");
  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (records.length === 0) return { rows: [], hasHeader: false, headers: [] };

  const first = records[0].map((c) => c.trim().toLowerCase());
  const hasHeader =
    NAME_HEADERS.some((h) => first.includes(h)) ||
    first.includes("name") ||
    first.includes("player");
  const headers = hasHeader ? records[0] : [];
  const dataRows = hasHeader ? records.slice(1) : records;

  const nameIdx = hasHeader ? findCol(headers, NAME_HEADERS) : 0;
  const posIdx = hasHeader ? findCol(headers, POS_HEADERS) : -1;
  const ageIdx = hasHeader ? findCol(headers, AGE_HEADERS) : -1;
  const phoneIdx = hasHeader ? findCol(headers, PHONE_HEADERS) : -1;
  const jerseyIdx = hasHeader ? findCol(headers, JERSEY_HEADERS) : -1;
  const teamIdx = hasHeader ? findCol(headers, TEAM_HEADERS) : -1;
  const teamSlugIdx = hasHeader ? findCol(headers, TEAM_SLUG_HEADERS) : -1;
  const natIdx = hasHeader ? findCol(headers, NAT_HEADERS) : -1;

  const rows: ParsedPlayerRow[] = dataRows.map((cols, i) => {
    const rowNumber = hasHeader ? i + 2 : i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];
    const fullName = (nameIdx >= 0 ? cols[nameIdx] : cols[0] || "").trim();
    if (!fullName) errors.push("Missing player name");

    let age: number | undefined;
    if (ageIdx >= 0 && cols[ageIdx]) {
      const a = parseInt(cols[ageIdx], 10);
      if (isNaN(a) || a < 10 || a > 60) warnings.push(`Invalid age: ${cols[ageIdx]}`);
      else age = a;
    }
    let jerseyNumber: number | undefined;
    if (jerseyIdx >= 0 && cols[jerseyIdx]) {
      const j = parseInt(cols[jerseyIdx], 10);
      if (isNaN(j) || j < 1 || j > 99) warnings.push(`Invalid jersey: ${cols[jerseyIdx]}`);
      else jerseyNumber = j;
    }

    return {
      rowNumber,
      fullName,
      position: posIdx >= 0 ? (cols[posIdx] || "").trim() || undefined : undefined,
      age,
      phone: phoneIdx >= 0 ? (cols[phoneIdx] || "").trim() || undefined : undefined,
      jerseyNumber,
      teamName: teamIdx >= 0 ? (cols[teamIdx] || "").trim() || undefined : undefined,
      teamSlug: teamSlugIdx >= 0 ? (cols[teamSlugIdx] || "").trim() || undefined : undefined,
      nationality: natIdx >= 0 ? (cols[natIdx] || "").trim() || undefined : undefined,
      errors,
      warnings,
    };
  });
  return { rows, hasHeader, headers };
}

// ── Teams ───────────────────────────────────────────────────────────

export interface ParsedTeamRow {
  rowNumber: number;
  name: string;
  shortName?: string;
  groupCode?: string;
  color1?: string;
  color2?: string;
  color3?: string;
  description?: string;
  errors: string[];
  warnings: string[];
}

export function parseTeamCSV(buffer: Buffer | string): {
  rows: ParsedTeamRow[];
  hasHeader: boolean;
  headers: string[];
} {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  const cleaned = text.replace(/^\uFEFF/, "");
  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (records.length === 0) return { rows: [], hasHeader: false, headers: [] };

  const first = records[0].map((c) => c.trim().toLowerCase());
  const hasHeader = ["name", "team", "team_name"].some((h) => first.includes(h));
  const headers = hasHeader ? records[0] : [];
  const dataRows = hasHeader ? records.slice(1) : records;

  const nameIdx = hasHeader ? findCol(headers, ["name", "team", "team_name"]) : 0;
  const shortIdx = hasHeader ? findCol(headers, ["shortname", "short_name", "abbr", "code"]) : -1;
  const groupIdx = hasHeader ? findCol(headers, ["group", "group_code", "groupcode"]) : -1;
  const c1 = hasHeader ? findCol(headers, ["color1", "primary_color", "color"]) : -1;
  const c2 = hasHeader ? findCol(headers, ["color2", "secondary_color"]) : -1;
  const c3 = hasHeader ? findCol(headers, ["color3", "accent_color"]) : -1;
  const descIdx = hasHeader ? findCol(headers, ["description", "desc"]) : -1;

  const rows: ParsedTeamRow[] = dataRows.map((cols, i) => {
    const rowNumber = hasHeader ? i + 2 : i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];
    const name = (nameIdx >= 0 ? cols[nameIdx] : cols[0] || "").trim();
    if (!name) errors.push("Missing team name");
    return {
      rowNumber,
      name,
      shortName: shortIdx >= 0 ? (cols[shortIdx] || "").trim() || undefined : undefined,
      groupCode: groupIdx >= 0 ? (cols[groupIdx] || "").trim().toUpperCase() || undefined : undefined,
      color1: c1 >= 0 ? (cols[c1] || "").trim() || undefined : undefined,
      color2: c2 >= 0 ? (cols[c2] || "").trim() || undefined : undefined,
      color3: c3 >= 0 ? (cols[c3] || "").trim() || undefined : undefined,
      description: descIdx >= 0 ? (cols[descIdx] || "").trim() || undefined : undefined,
      errors,
      warnings,
    };
  });
  return { rows, hasHeader, headers };
}

// ── Groups ──────────────────────────────────────────────────────────

export interface ParsedGroupRow {
  rowNumber: number;
  code: string;
  name: string;
  displayOrder?: number;
  errors: string[];
  warnings: string[];
}

export function parseGroupCSV(buffer: Buffer | string): {
  rows: ParsedGroupRow[];
  hasHeader: boolean;
  headers: string[];
} {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  const cleaned = text.replace(/^\uFEFF/, "");
  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (records.length === 0) return { rows: [], hasHeader: false, headers: [] };

  const first = records[0].map((c) => c.trim().toLowerCase());
  const hasHeader = ["code", "name", "group"].some((h) => first.includes(h));
  const headers = hasHeader ? records[0] : [];
  const dataRows = hasHeader ? records.slice(1) : records;

  const codeIdx = hasHeader ? findCol(headers, ["code", "group_code", "groupcode", "group"]) : 0;
  const nameIdx = hasHeader ? findCol(headers, ["name", "group_name"]) : 1;
  const orderIdx = hasHeader ? findCol(headers, ["order", "display_order", "displayorder"]) : -1;

  const rows: ParsedGroupRow[] = dataRows.map((cols, i) => {
    const rowNumber = hasHeader ? i + 2 : i + 1;
    const errors: string[] = [];
    const code = (codeIdx >= 0 ? cols[codeIdx] : cols[0] || "").trim().toUpperCase();
    const name = (nameIdx >= 0 ? cols[nameIdx] : cols[1] || code || "").trim();
    if (!code) errors.push("Missing group code");
    let displayOrder: number | undefined;
    if (orderIdx >= 0 && cols[orderIdx]) {
      const o = parseInt(cols[orderIdx], 10);
      if (!isNaN(o)) displayOrder = o;
    }
    return { rowNumber, code, name: name || code, displayOrder, errors, warnings: [] };
  });
  return { rows, hasHeader, headers };
}

// ── Fixtures ────────────────────────────────────────────────────────

export interface ParsedFixtureRow {
  rowNumber: number;
  matchday?: number;
  stage?: string;
  homeTeam?: string;
  awayTeam?: string;
  kickoffAt?: string;
  venue?: string;
  groupCode?: string;
  errors: string[];
  warnings: string[];
}

export function parseFixtureCSV(buffer: Buffer | string): {
  rows: ParsedFixtureRow[];
  hasHeader: boolean;
  headers: string[];
} {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  const cleaned = text.replace(/^\uFEFF/, "");
  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (records.length === 0) return { rows: [], hasHeader: false, headers: [] };

  const first = records[0].map((c) => c.trim().toLowerCase());
  const hasHeader = ["home", "home_team", "away", "away_team", "matchday"].some((h) =>
    first.includes(h)
  );
  const headers = hasHeader ? records[0] : [];
  const dataRows = hasHeader ? records.slice(1) : records;

  const mdIdx = hasHeader ? findCol(headers, ["matchday", "round", "md"]) : -1;
  const stageIdx = hasHeader ? findCol(headers, ["stage"]) : -1;
  const homeIdx = hasHeader ? findCol(headers, ["home", "home_team", "hometeam"]) : 0;
  const awayIdx = hasHeader ? findCol(headers, ["away", "away_team", "awayteam"]) : 1;
  const kickIdx = hasHeader ? findCol(headers, ["kickoff", "kickoff_at", "date", "datetime"]) : -1;
  const venueIdx = hasHeader ? findCol(headers, ["venue", "stadium", "ground"]) : -1;
  const groupIdx = hasHeader ? findCol(headers, ["group", "group_code"]) : -1;

  const rows: ParsedFixtureRow[] = dataRows.map((cols, i) => {
    const rowNumber = hasHeader ? i + 2 : i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];
    const homeTeam = (homeIdx >= 0 ? cols[homeIdx] : "").trim();
    const awayTeam = (awayIdx >= 0 ? cols[awayIdx] : "").trim();
    if (!homeTeam) errors.push("Missing home team");
    if (!awayTeam) errors.push("Missing away team");
    let matchday: number | undefined;
    if (mdIdx >= 0 && cols[mdIdx]) {
      const m = parseInt(cols[mdIdx], 10);
      if (!isNaN(m)) matchday = m;
    }
    return {
      rowNumber,
      matchday,
      stage: stageIdx >= 0 ? (cols[stageIdx] || "").trim() || undefined : undefined,
      homeTeam: homeTeam || undefined,
      awayTeam: awayTeam || undefined,
      kickoffAt: kickIdx >= 0 ? (cols[kickIdx] || "").trim() || undefined : undefined,
      venue: venueIdx >= 0 ? (cols[venueIdx] || "").trim() || undefined : undefined,
      groupCode: groupIdx >= 0 ? (cols[groupIdx] || "").trim().toUpperCase() || undefined : undefined,
      errors,
      warnings,
    };
  });
  return { rows, hasHeader, headers };
}

// ── Scores ──────────────────────────────────────────────────────────

export interface ParsedScoreRow {
  rowNumber: number;
  matchId?: string;
  homeTeam?: string;
  awayTeam?: string;
  matchday?: number;
  htHome?: number;
  htAway?: number;
  ftHome?: number;
  ftAway?: number;
  status?: string;
  errors: string[];
  warnings: string[];
}

export function parseScoreCSV(buffer: Buffer | string): {
  rows: ParsedScoreRow[];
  hasHeader: boolean;
  headers: string[];
} {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  const cleaned = text.replace(/^\uFEFF/, "");
  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (records.length === 0) return { rows: [], hasHeader: false, headers: [] };

  const first = records[0].map((c) => c.trim().toLowerCase());
  const hasHeader = ["match_id", "home", "ft_home", "ft_home_score", "score"].some((h) =>
    first.includes(h)
  );
  const headers = hasHeader ? records[0] : [];
  const dataRows = hasHeader ? records.slice(1) : records;

  const idIdx = hasHeader ? findCol(headers, ["match_id", "matchid", "id"]) : -1;
  const homeIdx = hasHeader ? findCol(headers, ["home", "home_team"]) : -1;
  const awayIdx = hasHeader ? findCol(headers, ["away", "away_team"]) : -1;
  const mdIdx = hasHeader ? findCol(headers, ["matchday", "round"]) : -1;
  const htH = hasHeader ? findCol(headers, ["ht_home", "ht_home_score", "half_home"]) : -1;
  const htA = hasHeader ? findCol(headers, ["ht_away", "ht_away_score", "half_away"]) : -1;
  const ftH = hasHeader ? findCol(headers, ["ft_home", "ft_home_score", "home_score", "score_home"]) : -1;
  const ftA = hasHeader ? findCol(headers, ["ft_away", "ft_away_score", "away_score", "score_away"]) : -1;
  const stIdx = hasHeader ? findCol(headers, ["status"]) : -1;

  const rows: ParsedScoreRow[] = dataRows.map((cols, i) => {
    const rowNumber = hasHeader ? i + 2 : i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];
    const matchId = idIdx >= 0 ? (cols[idIdx] || "").trim() || undefined : undefined;
    const homeTeam = homeIdx >= 0 ? (cols[homeIdx] || "").trim() || undefined : undefined;
    const awayTeam = awayIdx >= 0 ? (cols[awayIdx] || "").trim() || undefined : undefined;
    if (!matchId && !(homeTeam && awayTeam)) {
      errors.push("Need match_id or home+away team names");
    }
    const num = (idx: number) => {
      if (idx < 0 || !cols[idx]) return undefined;
      const n = parseInt(cols[idx], 10);
      return isNaN(n) ? undefined : n;
    };
    let matchday: number | undefined;
    if (mdIdx >= 0 && cols[mdIdx]) {
      const m = parseInt(cols[mdIdx], 10);
      if (!isNaN(m)) matchday = m;
    }
    return {
      rowNumber,
      matchId,
      homeTeam,
      awayTeam,
      matchday,
      htHome: num(htH),
      htAway: num(htA),
      ftHome: num(ftH),
      ftAway: num(ftA),
      status: stIdx >= 0 ? (cols[stIdx] || "").trim().toUpperCase() || undefined : undefined,
      errors,
      warnings,
    };
  });
  return { rows, hasHeader, headers };
}

// ── Export helpers (build CSV string) ───────────────────────────────

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(esc).join(",")];
  for (const row of rows) {
    lines.push(row.map(esc).join(","));
  }
  return lines.join("\n") + "\n";
}
