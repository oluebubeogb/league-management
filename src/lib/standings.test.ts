import { describe, it, expect } from "vitest";
import { calculateGroupTable, sortStandings } from "./standings";

describe("calculateGroupTable", () => {
  const teams = [
    { id: "1", name: "Alpha", slug: "alpha", shortName: "ALP", groupCode: "A" },
    { id: "2", name: "Beta", slug: "beta", shortName: "BET", groupCode: "A" },
    { id: "3", name: "Gamma", slug: "gamma", shortName: "GAM", groupCode: "A" },
    { id: "4", name: "Delta", slug: "delta", shortName: "DEL", groupCode: "A" },
  ];

  it("starts at zero", () => {
    const table = calculateGroupTable(teams, []);
    expect(table).toHaveLength(4);
    expect(table.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it("awards 3 points for a win and 1 for a draw", () => {
    const matches = [
      {
        homeTeamId: "1",
        awayTeamId: "2",
        fullTimeHomeScore: 2,
        fullTimeAwayScore: 0,
        status: "FULL_TIME",
        stage: "GROUP",
      },
      {
        homeTeamId: "3",
        awayTeamId: "4",
        fullTimeHomeScore: 1,
        fullTimeAwayScore: 1,
        status: "FULL_TIME",
        stage: "GROUP",
      },
    ];
    const table = calculateGroupTable(teams, matches);
    const alpha = table.find((r) => r.teamId === "1")!;
    const beta = table.find((r) => r.teamId === "2")!;
    const gamma = table.find((r) => r.teamId === "3")!;
    const delta = table.find((r) => r.teamId === "4")!;

    expect(alpha.points).toBe(3);
    expect(alpha.won).toBe(1);
    expect(alpha.goalsFor).toBe(2);
    expect(beta.points).toBe(0);
    expect(beta.lost).toBe(1);
    expect(gamma.points).toBe(1);
    expect(delta.points).toBe(1);
    expect(gamma.drawn).toBe(1);
  });

  it("ignores non-FULL_TIME and non-GROUP matches", () => {
    const matches = [
      {
        homeTeamId: "1",
        awayTeamId: "2",
        fullTimeHomeScore: 5,
        fullTimeAwayScore: 0,
        status: "LIVE",
        stage: "GROUP",
      },
      {
        homeTeamId: "1",
        awayTeamId: "2",
        fullTimeHomeScore: 3,
        fullTimeAwayScore: 0,
        status: "FULL_TIME",
        stage: "QUARTER_FINAL",
      },
    ];
    const table = calculateGroupTable(teams, matches);
    expect(table.every((r) => r.played === 0)).toBe(true);
  });

  it("sorts by points then GD then GF", () => {
    const rows = [
      { teamId: "a", teamName: "A", teamSlug: "a", shortName: null, groupCode: "A", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, goalDifference: 1, points: 3 },
      { teamId: "b", teamName: "B", teamSlug: "b", shortName: null, groupCode: "A", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, goalDifference: 3, points: 3 },
      { teamId: "c", teamName: "C", teamSlug: "c", shortName: null, groupCode: "A", played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference: 0, points: 1 },
    ];
    const sorted = sortStandings(rows);
    expect(sorted[0].teamId).toBe("b"); // better GD
    expect(sorted[1].teamId).toBe("a");
    expect(sorted[2].teamId).toBe("c");
  });
});
