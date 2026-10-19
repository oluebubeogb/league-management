import { prisma } from "./db";
import { adjustBalance } from "./wallet";
import type { Match, Prediction } from "@prisma/client";

/** Points: correct score 5, outcome 3, else 0. Coins payout = stake * multiplier. */
export function gradePrediction(
  pred: Pick<Prediction, "type" | "selectedOutcome" | "homeScore" | "awayScore" | "stakeAmount">,
  match: Pick<Match, "fullTimeHomeScore" | "fullTimeAwayScore">
): { isCorrect: boolean; points: number; coins: number; multiplier: number } {
  const ht = match.fullTimeHomeScore;
  const at = match.fullTimeAwayScore;
  if (ht == null || at == null) {
    return { isCorrect: false, points: 0, coins: 0, multiplier: 0 };
  }

  let isCorrect = false;
  let points = 0;
  let multiplier = 0;

  const outcome = ht > at ? "HOME" : ht < at ? "AWAY" : "DRAW";
  const total = ht + at;
  const btts = ht > 0 && at > 0;

  switch (pred.type) {
    case "CORRECT_SCORE":
      isCorrect = pred.homeScore === ht && pred.awayScore === at;
      points = isCorrect ? 5 : 0;
      multiplier = isCorrect ? 4 : 0;
      break;
    case "OUTCOME":
      isCorrect = (pred.selectedOutcome || "").toUpperCase() === outcome;
      points = isCorrect ? 3 : 0;
      multiplier = isCorrect ? 2 : 0;
      break;
    case "DOUBLE_CHANCE": {
      const s = (pred.selectedOutcome || "").toUpperCase();
      isCorrect =
        (s === "HOME_DRAW" || s === "HOME_OR_DRAW") && (outcome === "HOME" || outcome === "DRAW") ||
        (s === "AWAY_DRAW" || s === "DRAW_OR_AWAY") && (outcome === "AWAY" || outcome === "DRAW") ||
        (s === "HOME_AWAY" || s === "HOME_OR_AWAY") && (outcome === "HOME" || outcome === "AWAY");
      points = isCorrect ? 2 : 0;
      multiplier = isCorrect ? 1.5 : 0;
      break;
    }
    case "TOTAL_GOALS": {
      const sel = (pred.selectedOutcome || "").toUpperCase();
      // e.g. OVER_2_5 / UNDER_2_5
      if (sel.startsWith("OVER_")) {
        const line = parseFloat(sel.replace("OVER_", "").replace("_", "."));
        isCorrect = !isNaN(line) && total > line;
      } else if (sel.startsWith("UNDER_")) {
        const line = parseFloat(sel.replace("UNDER_", "").replace("_", "."));
        isCorrect = !isNaN(line) && total < line;
      }
      points = isCorrect ? 2 : 0;
      multiplier = isCorrect ? 1.8 : 0;
      break;
    }
    case "BTTS": {
      const sel = (pred.selectedOutcome || "").toUpperCase();
      isCorrect = (sel === "YES" && btts) || (sel === "NO" && !btts);
      points = isCorrect ? 2 : 0;
      multiplier = isCorrect ? 1.8 : 0;
      break;
    }
    default:
      break;
  }

  const stake = pred.stakeAmount || 0;
  const coins = isCorrect && stake > 0 ? Math.floor(stake * multiplier) : 0;
  return { isCorrect, points, coins, multiplier };
}

export function potentialPayout(
  type: string,
  stake: number
): number {
  if (stake <= 0) return 0;
  const mult: Record<string, number> = {
    CORRECT_SCORE: 4,
    OUTCOME: 2,
    DOUBLE_CHANCE: 1.5,
    TOTAL_GOALS: 1.8,
    BTTS: 1.8,
  };
  return Math.floor(stake * (mult[type] || 2));
}

/** Grade all ACTIVE predictions for a FULL_TIME match; award points + coins. */
export async function gradeMatchPredictions(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== "FULL_TIME") {
    throw new Error("Match not found or not FULL_TIME");
  }
  if (match.fullTimeHomeScore == null || match.fullTimeAwayScore == null) {
    throw new Error("Scores missing");
  }

  const preds = await prisma.prediction.findMany({
    where: { matchId, status: "ACTIVE" },
  });

  let graded = 0;
  for (const pred of preds) {
    const result = gradePrediction(pred, match);
    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        status: "GRADED",
        isCorrect: result.isCorrect,
        pointsAwarded: result.points,
        coinsAwarded: result.coins,
      },
    });
    if (result.coins > 0) {
      await adjustBalance(pred.userId, result.coins, "PREDICTION_WIN", {
        referenceId: pred.id,
        note: `Win on match ${matchId}`,
      });
    }
    graded++;
  }
  return { graded };
}
