import { prisma } from "./db";
import {
  parseTeamCSV,
  parsePlayerCSV,
  parseGroupCSV,
  parseFixtureCSV,
  parseScoreCSV,
  normalizePlayerName,
  slugify,
  toCsv,
} from "./csv";
import type { CsvEntity, MatchStage } from "@prisma/client";
import { gradeMatchPredictions } from "./predictions";

export type PreviewRow = {
  rowNumber: number;
  action: "create" | "update" | "skip" | "error";
  summary: string;
  errors: string[];
  warnings: string[];
};

export type PreviewResult = {
  entity: CsvEntity;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: PreviewRow[];
  rawValid: unknown[]; // rows ready for commit
};

const STAGES: MatchStage[] = [
  "GROUP",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
  "FRIENDLY",
  "OTHER",
];

function parseStage(s?: string): MatchStage {
  if (!s) return "GROUP";
  const u = s.toUpperCase().replace(/[\s-]+/g, "_");
  return (STAGES.includes(u as MatchStage) ? u : "OTHER") as MatchStage;
}

// ── Preview ─────────────────────────────────────────────────────────

export async function previewCsv(
  leagueId: string,
  entity: CsvEntity,
  buffer: Buffer | string
): Promise<PreviewResult> {
  switch (entity) {
    case "TEAMS":
      return previewTeams(leagueId, buffer);
    case "PLAYERS":
      return previewPlayers(leagueId, buffer);
    case "GROUPS":
      return previewGroups(leagueId, buffer);
    case "FIXTURES":
      return previewFixtures(leagueId, buffer);
    case "SCORES":
      return previewScores(leagueId, buffer);
    default:
      throw new Error(`Unsupported entity: ${entity}`);
  }
}

async function previewTeams(leagueId: string, buffer: Buffer | string): Promise<PreviewResult> {
  const { rows } = parseTeamCSV(buffer);
  const existing = await prisma.team.findMany({ where: { leagueId } });
  const bySlug = new Map(existing.map((t) => [t.slug, t]));
  const groups = await prisma.group.findMany({ where: { leagueId } });
  const groupByCode = new Map(groups.map((g) => [g.code.toUpperCase(), g]));

  const out: PreviewRow[] = [];
  const rawValid: unknown[] = [];

  for (const r of rows) {
    if (r.errors.length) {
      out.push({
        rowNumber: r.rowNumber,
        action: "error",
        summary: r.name || "(empty)",
        errors: r.errors,
        warnings: r.warnings,
      });
      continue;
    }
    const slug = slugify(r.name);
    const existingTeam = bySlug.get(slug);
    if (r.groupCode && !groupByCode.has(r.groupCode)) {
      r.warnings.push(`Group ${r.groupCode} not found — team will have no group`);
    }
    const action = existingTeam ? "update" : "create";
    out.push({
      rowNumber: r.rowNumber,
      action,
      summary: `${r.name} (${slug})`,
      errors: [],
      warnings: r.warnings,
    });
    rawValid.push({ ...r, slug, groupId: r.groupCode ? groupByCode.get(r.groupCode)?.id ?? null : null });
  }

  return {
    entity: "TEAMS",
    totalRows: rows.length,
    validRows: rawValid.length,
    invalidRows: rows.length - rawValid.length,
    rows: out,
    rawValid,
  };
}

async function previewPlayers(leagueId: string, buffer: Buffer | string): Promise<PreviewResult> {
  const { rows } = parsePlayerCSV(buffer);
  const teams = await prisma.team.findMany({
    where: { leagueId },
    include: { players: true },
  });
  const teamBySlug = new Map(teams.map((t) => [t.slug, t]));
  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));

  const out: PreviewRow[] = [];
  const rawValid: unknown[] = [];

  for (const r of rows) {
    const errors = [...r.errors];
    let team = r.teamSlug ? teamBySlug.get(r.teamSlug) : undefined;
    if (!team && r.teamName) team = teamByName.get(r.teamName.toLowerCase());
    if (!team) errors.push("Team not found (need team or team_slug column matching a league team)");

    if (errors.length) {
      out.push({
        rowNumber: r.rowNumber,
        action: "error",
        summary: r.fullName || "(empty)",
        errors,
        warnings: r.warnings,
      });
      continue;
    }

    const norm = normalizePlayerName(r.fullName);
    const existing = team!.players.find((p) => p.normalizedName === norm);
    const action = existing ? "update" : "create";
    out.push({
      rowNumber: r.rowNumber,
      action,
      summary: `${r.fullName} → ${team!.name}`,
      errors: [],
      warnings: r.warnings,
    });
    rawValid.push({ ...r, teamId: team!.id, normalizedName: norm, existingId: existing?.id });
  }

  return {
    entity: "PLAYERS",
    totalRows: rows.length,
    validRows: rawValid.length,
    invalidRows: rows.length - rawValid.length,
    rows: out,
    rawValid,
  };
}

async function previewGroups(leagueId: string, buffer: Buffer | string): Promise<PreviewResult> {
  const { rows } = parseGroupCSV(buffer);
  const existing = await prisma.group.findMany({ where: { leagueId } });
  const byCode = new Map(existing.map((g) => [g.code.toUpperCase(), g]));

  const out: PreviewRow[] = [];
  const rawValid: unknown[] = [];

  for (const r of rows) {
    if (r.errors.length) {
      out.push({
        rowNumber: r.rowNumber,
        action: "error",
        summary: r.code || "(empty)",
        errors: r.errors,
        warnings: r.warnings,
      });
      continue;
    }
    const ex = byCode.get(r.code);
    out.push({
      rowNumber: r.rowNumber,
      action: ex ? "update" : "create",
      summary: `${r.code} — ${r.name}`,
      errors: [],
      warnings: r.warnings,
    });
    rawValid.push({ ...r, existingId: ex?.id });
  }

  return {
    entity: "GROUPS",
    totalRows: rows.length,
    validRows: rawValid.length,
    invalidRows: rows.length - rawValid.length,
    rows: out,
    rawValid,
  };
}

async function previewFixtures(leagueId: string, buffer: Buffer | string): Promise<PreviewResult> {
  const { rows } = parseFixtureCSV(buffer);
  const teams = await prisma.team.findMany({ where: { leagueId } });
  const byName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));
  const bySlug = new Map(teams.map((t) => [t.slug, t]));
  const groups = await prisma.group.findMany({ where: { leagueId } });
  const groupByCode = new Map(groups.map((g) => [g.code.toUpperCase(), g]));

  const resolveTeam = (name?: string) => {
    if (!name) return undefined;
    return byName.get(name.toLowerCase()) || bySlug.get(slugify(name));
  };

  const out: PreviewRow[] = [];
  const rawValid: unknown[] = [];

  for (const r of rows) {
    const errors = [...r.errors];
    const home = resolveTeam(r.homeTeam);
    const away = resolveTeam(r.awayTeam);
    if (r.homeTeam && !home) errors.push(`Home team not found: ${r.homeTeam}`);
    if (r.awayTeam && !away) errors.push(`Away team not found: ${r.awayTeam}`);

    if (errors.length) {
      out.push({
        rowNumber: r.rowNumber,
        action: "error",
        summary: `${r.homeTeam || "?"} vs ${r.awayTeam || "?"}`,
        errors,
        warnings: r.warnings,
      });
      continue;
    }

    let kickoffAt: Date | null = null;
    if (r.kickoffAt) {
      const d = new Date(r.kickoffAt);
      if (isNaN(d.getTime())) r.warnings.push(`Invalid kickoff: ${r.kickoffAt}`);
      else kickoffAt = d;
    }

    out.push({
      rowNumber: r.rowNumber,
      action: "create",
      summary: `${home!.name} vs ${away!.name}${r.matchday != null ? ` (MD${r.matchday})` : ""}`,
      errors: [],
      warnings: r.warnings,
    });
    rawValid.push({
      ...r,
      homeTeamId: home!.id,
      awayTeamId: away!.id,
      groupId: r.groupCode ? groupByCode.get(r.groupCode)?.id ?? null : null,
      stage: parseStage(r.stage),
      kickoffAt,
    });
  }

  return {
    entity: "FIXTURES",
    totalRows: rows.length,
    validRows: rawValid.length,
    invalidRows: rows.length - rawValid.length,
    rows: out,
    rawValid,
  };
}

async function previewScores(leagueId: string, buffer: Buffer | string): Promise<PreviewResult> {
  const { rows } = parseScoreCSV(buffer);
  const matches = await prisma.match.findMany({
    where: { leagueId },
    include: { homeTeam: true, awayTeam: true },
  });
  const byId = new Map(matches.map((m) => [m.id, m]));

  const out: PreviewRow[] = [];
  const rawValid: unknown[] = [];

  for (const r of rows) {
    const errors = [...r.errors];
    let match = r.matchId ? byId.get(r.matchId) : undefined;
    if (!match && r.homeTeam && r.awayTeam) {
      const candidates = matches.filter(
        (m) =>
          m.homeTeam?.name.toLowerCase() === r.homeTeam!.toLowerCase() &&
          m.awayTeam?.name.toLowerCase() === r.awayTeam!.toLowerCase() &&
          (r.matchday == null || m.matchday === r.matchday)
      );
      if (candidates.length === 1) match = candidates[0];
      else if (candidates.length > 1) errors.push("Multiple matches match home/away/matchday");
      else errors.push("Match not found for home/away");
    }
    if (!match && !errors.length) errors.push("Match not found");

    if (errors.length || !match) {
      out.push({
        rowNumber: r.rowNumber,
        action: "error",
        summary: r.matchId || `${r.homeTeam} vs ${r.awayTeam}`,
        errors,
        warnings: r.warnings,
      });
      continue;
    }

    out.push({
      rowNumber: r.rowNumber,
      action: "update",
      summary: `${match.homeTeam?.name} ${r.ftHome ?? "?"}–${r.ftAway ?? "?"} ${match.awayTeam?.name}`,
      errors: [],
      warnings: r.warnings,
    });
    rawValid.push({
      matchId: match.id,
      htHome: r.htHome,
      htAway: r.htAway,
      ftHome: r.ftHome,
      ftAway: r.ftAway,
      status: r.status || (r.ftHome != null ? "FULL_TIME" : undefined),
    });
  }

  return {
    entity: "SCORES",
    totalRows: rows.length,
    validRows: rawValid.length,
    invalidRows: rows.length - rawValid.length,
    rows: out,
    rawValid,
  };
}

// ── Commit ──────────────────────────────────────────────────────────

export async function commitCsv(
  leagueId: string,
  entity: CsvEntity,
  rawValid: unknown[],
  uploadedByAdminId: string,
  filename: string
) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  switch (entity) {
    case "TEAMS": {
      for (const row of rawValid as Array<{
        name: string;
        slug: string;
        shortName?: string;
        groupId: string | null;
        color1?: string;
        color2?: string;
        color3?: string;
        description?: string;
      }>) {
        const existing = await prisma.team.findUnique({
          where: { leagueId_slug: { leagueId, slug: row.slug } },
        });
        if (existing) {
          await prisma.team.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              shortName: row.shortName ?? existing.shortName,
              groupId: row.groupId ?? existing.groupId,
              color1: row.color1 ?? existing.color1,
              color2: row.color2 ?? existing.color2,
              color3: row.color3 ?? existing.color3,
              description: row.description ?? existing.description,
            },
          });
          updated++;
        } else {
          await prisma.team.create({
            data: {
              leagueId,
              name: row.name,
              slug: row.slug,
              shortName: row.shortName,
              groupId: row.groupId,
              color1: row.color1 || "#16a34a",
              color2: row.color2 || "#ffffff",
              color3: row.color3 || "#0f172a",
              description: row.description,
            },
          });
          created++;
        }
      }
      break;
    }
    case "PLAYERS": {
      for (const row of rawValid as Array<{
        fullName: string;
        normalizedName: string;
        teamId: string;
        existingId?: string;
        position?: string;
        age?: number;
        phone?: string;
        jerseyNumber?: number;
        nationality?: string;
      }>) {
        if (row.existingId) {
          await prisma.player.update({
            where: { id: row.existingId },
            data: {
              fullName: row.fullName,
              position: row.position,
              age: row.age,
              phone: row.phone,
              jerseyNumber: row.jerseyNumber,
              nationality: row.nationality,
            },
          });
          updated++;
        } else {
          await prisma.player.create({
            data: {
              teamId: row.teamId,
              fullName: row.fullName,
              normalizedName: row.normalizedName,
              position: row.position,
              age: row.age,
              phone: row.phone,
              jerseyNumber: row.jerseyNumber,
              nationality: row.nationality,
            },
          });
          created++;
        }
      }
      break;
    }
    case "GROUPS": {
      for (const row of rawValid as Array<{
        code: string;
        name: string;
        displayOrder?: number;
        existingId?: string;
      }>) {
        if (row.existingId) {
          await prisma.group.update({
            where: { id: row.existingId },
            data: {
              name: row.name,
              displayOrder: row.displayOrder ?? undefined,
            },
          });
          updated++;
        } else {
          await prisma.group.create({
            data: {
              leagueId,
              code: row.code,
              name: row.name,
              displayOrder: row.displayOrder ?? 0,
            },
          });
          created++;
        }
      }
      break;
    }
    case "FIXTURES": {
      for (const row of rawValid as Array<{
        homeTeamId: string;
        awayTeamId: string;
        groupId: string | null;
        stage: MatchStage;
        matchday?: number;
        kickoffAt: Date | null;
        venue?: string;
      }>) {
        await prisma.match.create({
          data: {
            leagueId,
            homeTeamId: row.homeTeamId,
            awayTeamId: row.awayTeamId,
            groupId: row.groupId,
            stage: row.stage,
            matchday: row.matchday,
            kickoffAt: row.kickoffAt,
            venue: row.venue,
            status: "SCHEDULED",
          },
        });
        created++;
      }
      break;
    }
    case "SCORES": {
      for (const row of rawValid as Array<{
        matchId: string;
        htHome?: number;
        htAway?: number;
        ftHome?: number;
        ftAway?: number;
        status?: string;
      }>) {
        const status = (row.status as "FULL_TIME" | "SCHEDULED" | "LIVE" | "HALF_TIME") || "FULL_TIME";
        await prisma.match.update({
          where: { id: row.matchId },
          data: {
            halfTimeHomeScore: row.htHome ?? undefined,
            halfTimeAwayScore: row.htAway ?? undefined,
            fullTimeHomeScore: row.ftHome ?? undefined,
            fullTimeAwayScore: row.ftAway ?? undefined,
            status,
          },
        });
        updated++;
        if (status === "FULL_TIME" && row.ftHome != null && row.ftAway != null) {
          try {
            await gradeMatchPredictions(row.matchId);
          } catch {
            /* non-fatal */
          }
        }
      }
      break;
    }
  }

  const record = await prisma.csvImport.create({
    data: {
      leagueId,
      entity,
      uploadedByAdminId,
      filename,
      totalRows: rawValid.length,
      validRows: rawValid.length,
      invalidRows: 0,
      createdRows: created,
      updatedRows: updated,
      skippedRows: skipped,
      status: "COMMITTED",
      reportJson: JSON.stringify({ created, updated, skipped }),
    },
  });

  return { created, updated, skipped, importId: record.id };
}

// ── Export ──────────────────────────────────────────────────────────

export async function exportCsv(leagueId: string, entity: CsvEntity): Promise<string> {
  switch (entity) {
    case "TEAMS": {
      const teams = await prisma.team.findMany({
        where: { leagueId },
        include: { group: true },
        orderBy: { name: "asc" },
      });
      return toCsv(
        ["name", "shortName", "groupCode", "color1", "color2", "color3", "description", "slug"],
        teams.map((t) => [
          t.name,
          t.shortName,
          t.group?.code,
          t.color1,
          t.color2,
          t.color3,
          t.description,
          t.slug,
        ])
      );
    }
    case "PLAYERS": {
      const players = await prisma.player.findMany({
        where: { team: { leagueId }, status: "ACTIVE" },
        include: { team: true },
        orderBy: [{ team: { name: "asc" } }, { fullName: "asc" }],
      });
      return toCsv(
        ["fullName", "team", "team_slug", "position", "age", "jerseyNumber", "phone", "nationality"],
        players.map((p) => [
          p.fullName,
          p.team.name,
          p.team.slug,
          p.position,
          p.age,
          p.jerseyNumber,
          p.phone,
          p.nationality,
        ])
      );
    }
    case "GROUPS": {
      const groups = await prisma.group.findMany({
        where: { leagueId },
        orderBy: { displayOrder: "asc" },
      });
      return toCsv(
        ["code", "name", "displayOrder"],
        groups.map((g) => [g.code, g.name, g.displayOrder])
      );
    }
    case "FIXTURES": {
      const matches = await prisma.match.findMany({
        where: { leagueId },
        include: { homeTeam: true, awayTeam: true, group: true },
        orderBy: [{ matchday: "asc" }, { kickoffAt: "asc" }],
      });
      return toCsv(
        ["match_id", "matchday", "stage", "home", "away", "kickoff", "venue", "group", "status"],
        matches.map((m) => [
          m.id,
          m.matchday,
          m.stage,
          m.homeTeam?.name,
          m.awayTeam?.name,
          m.kickoffAt?.toISOString(),
          m.venue,
          m.group?.code,
          m.status,
        ])
      );
    }
    case "SCORES": {
      const matches = await prisma.match.findMany({
        where: { leagueId },
        include: { homeTeam: true, awayTeam: true },
        orderBy: [{ matchday: "asc" }, { kickoffAt: "asc" }],
      });
      return toCsv(
        ["match_id", "home", "away", "matchday", "ht_home", "ht_away", "ft_home", "ft_away", "status"],
        matches.map((m) => [
          m.id,
          m.homeTeam?.name,
          m.awayTeam?.name,
          m.matchday,
          m.halfTimeHomeScore,
          m.halfTimeAwayScore,
          m.fullTimeHomeScore,
          m.fullTimeAwayScore,
          m.status,
        ])
      );
    }
    default:
      throw new Error(`Unsupported export: ${entity}`);
  }
}
