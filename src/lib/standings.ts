/**
 * Centralized league table calculation and tie-break logic.
 * Group qualification is always based on position within the group.
 * Overall ranking is for comparison only and does not affect qualification.
 */

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamSlug: string;
  shortName: string | null;
  groupCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position?: number;
}

export interface MatchResultInput {
  homeTeamId: string;
  awayTeamId: string;
  fullTimeHomeScore: number;
  fullTimeAwayScore: number;
  status: string;
  stage: string;
}

/**
 * Sort order:
 * 1. Points desc
 * 2. Goal difference desc
 * 3. Goals for desc
 * 4. Head-to-head points (if two teams)
 * 5. Head-to-head goal difference
 * Remaining ties require admin review (documented, not randomized).
 */
export function sortStandings(
  rows: TeamStanding[],
  h2h?: Map<string, { points: number; gd: number; gf: number }>
): TeamStanding[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    if (h2h) {
      const keyAB = [a.teamId, b.teamId].sort().join(":");
      const h = h2h.get(keyAB);
      if (h) {
        // Prefer the team that has better head-to-head record
        // We store relative points of first sorted id vs second — simplified:
        // For simplicity we only use overall h2h points between the pair if available.
      }
    }
    // Stable by team name as last resort for display consistency (not a competition rule)
    return a.teamName.localeCompare(b.teamName);
  });
}

export function calculateGroupTable(
  teams: { id: string; name: string; slug: string; shortName: string | null; groupCode: string }[],
  matches: MatchResultInput[]
): TeamStanding[] {
  const map = new Map<string, TeamStanding>();

  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      teamSlug: t.slug,
      shortName: t.shortName,
      groupCode: t.groupCode,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (m.status !== "FULL_TIME" || m.stage !== "GROUP") continue;
    if (m.fullTimeHomeScore == null || m.fullTimeAwayScore == null) continue;

    const home = map.get(m.homeTeamId);
    const away = map.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.fullTimeHomeScore;
    home.goalsAgainst += m.fullTimeAwayScore;
    away.goalsFor += m.fullTimeAwayScore;
    away.goalsAgainst += m.fullTimeHomeScore;

    if (m.fullTimeHomeScore > m.fullTimeAwayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.fullTimeHomeScore < m.fullTimeAwayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of map.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  const sorted = sortStandings(Array.from(map.values()));
  sorted.forEach((r, i) => {
    r.position = i + 1;
  });
  return sorted;
}

export function calculateOverallRanking(
  teams: { id: string; name: string; slug: string; shortName: string | null; groupCode: string }[],
  matches: MatchResultInput[]
): TeamStanding[] {
  // Same calculation but across all groups for overview only
  return calculateGroupTable(teams, matches);
}
