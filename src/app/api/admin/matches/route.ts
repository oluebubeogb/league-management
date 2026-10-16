import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError, audit } from "@/lib/auth";

const schema = z.object({
  matchId: z.string(),
  status: z
    .enum(["SCHEDULED", "LIVE", "HALF_TIME", "FULL_TIME", "POSTPONED", "CANCELLED"])
    .optional(),
  halfTimeHomeScore: z.number().int().min(0).nullable().optional(),
  halfTimeAwayScore: z.number().int().min(0).nullable().optional(),
  fullTimeHomeScore: z.number().int().min(0).nullable().optional(),
  fullTimeAwayScore: z.number().int().min(0).nullable().optional(),
  venue: z.string().optional(),
  notes: z.string().optional(),
  kickoffAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { matchId, ...data } = parsed.data;

    const existing = await prisma.match.findUnique({ where: { id: matchId } });
    if (!existing) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.halfTimeHomeScore !== undefined && {
          halfTimeHomeScore: data.halfTimeHomeScore,
        }),
        ...(data.halfTimeAwayScore !== undefined && {
          halfTimeAwayScore: data.halfTimeAwayScore,
        }),
        ...(data.fullTimeHomeScore !== undefined && {
          fullTimeHomeScore: data.fullTimeHomeScore,
        }),
        ...(data.fullTimeAwayScore !== undefined && {
          fullTimeAwayScore: data.fullTimeAwayScore,
        }),
        ...(data.venue !== undefined && { venue: data.venue }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.kickoffAt !== undefined && {
          kickoffAt: data.kickoffAt ? new Date(data.kickoffAt) : null,
        }),
      },
    });

    // Grade predictions when match becomes FULL_TIME
    if (data.status === "FULL_TIME" && data.fullTimeHomeScore != null && data.fullTimeAwayScore != null) {
      await gradePredictions(matchId, data.fullTimeHomeScore, data.fullTimeAwayScore);
    }

    await audit(admin.id, "MATCH_UPDATE", "Match", matchId, {
      status: data.status,
      scores: {
        ht: [data.halfTimeHomeScore, data.halfTimeAwayScore],
        ft: [data.fullTimeHomeScore, data.fullTimeAwayScore],
      },
    });

    return NextResponse.json({ ok: true, match: { id: updated.id, status: updated.status } });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("admin match update", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function gradePredictions(matchId: string, home: number, away: number) {
  const outcome = home > away ? "HOME" : home < away ? "AWAY" : "DRAW";
  const predictions = await prisma.prediction.findMany({
    where: { matchId, status: { in: ["ACTIVE", "CLOSED"] } },
  });

  for (const p of predictions) {
    let isCorrect = false;
    let points = 0;
    if (p.type === "OUTCOME" && p.selectedOutcome === outcome) {
      isCorrect = true;
      points = 1;
    } else if (
      p.type === "CORRECT_SCORE" &&
      p.homeScore === home &&
      p.awayScore === away
    ) {
      isCorrect = true;
      points = 3;
    }
    await prisma.prediction.update({
      where: { id: p.id },
      data: { status: "GRADED", isCorrect, pointsAwarded: points },
    });
  }
}
