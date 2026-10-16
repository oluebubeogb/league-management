import { parse } from "csv-parse/sync";

export interface ParsedPlayerRow {
  rowNumber: number;
  fullName: string;
  position?: string;
  age?: number;
  phone?: string;
  jerseyNumber?: number;
  errors: string[];
  warnings: string[];
}

const NAME_HEADERS = ["name", "player", "full_name", "player_name", "fullname"];
const POS_HEADERS = ["position", "pos"];
const AGE_HEADERS = ["age"];
const PHONE_HEADERS = ["phone", "phone_number", "mobile"];
const JERSEY_HEADERS = ["jersey", "jersey_number", "number", "shirt"];

function findCol(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

export function parsePlayerCSV(buffer: Buffer | string): {
  rows: ParsedPlayerRow[];
  hasHeader: boolean;
  headers: string[];
} {
  const text = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
  // Strip BOM
  const cleaned = text.replace(/^\uFEFF/, "");

  const records: string[][] = parse(cleaned, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    return { rows: [], hasHeader: false, headers: [] };
  }

  // Detect header
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

  const rows: ParsedPlayerRow[] = dataRows.map((cols, i) => {
    const rowNumber = hasHeader ? i + 2 : i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    const fullName = (nameIdx >= 0 ? cols[nameIdx] : cols[0] || "").trim();
    if (!fullName) {
      errors.push("Missing player name");
    }

    let age: number | undefined;
    if (ageIdx >= 0 && cols[ageIdx]) {
      const a = parseInt(cols[ageIdx], 10);
      if (isNaN(a) || a < 10 || a > 60) {
        warnings.push(`Invalid age: ${cols[ageIdx]}`);
      } else {
        age = a;
      }
    }

    let jerseyNumber: number | undefined;
    if (jerseyIdx >= 0 && cols[jerseyIdx]) {
      const j = parseInt(cols[jerseyIdx], 10);
      if (isNaN(j) || j < 1 || j > 99) {
        warnings.push(`Invalid jersey: ${cols[jerseyIdx]}`);
      } else {
        jerseyNumber = j;
      }
    }

    const position = posIdx >= 0 ? (cols[posIdx] || "").trim() || undefined : undefined;
    const phone = phoneIdx >= 0 ? (cols[phoneIdx] || "").trim() || undefined : undefined;

    return {
      rowNumber,
      fullName,
      position,
      age,
      phone,
      jerseyNumber,
      errors,
      warnings,
    };
  });

  return { rows, hasHeader, headers };
}

export function normalizePlayerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
