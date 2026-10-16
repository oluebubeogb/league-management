import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  matchId: z.string().min(1),
  type: z.enum(["OUTCOME", "CORRECT_SCORE", "DOUBLE_CHANCE"]),
  selectedOutcome: z.string().optional(),
  homeScore: z.number().int().min(0).max(20).optional(),
  awayScore: z.number().int().min(0).max(20).optional(),
  comment: z.string().max(280).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { matchId, type, selectedOutcome, homeScore, awayScore, comment } = parsed.data;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || !match.published) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "LIVE" || match.status === "HALF_TIME" || match.status === "FULL_TIME") {
      return NextResponse.json({ error: "Predictions are closed for this match" }, { status: 403 });
    }
    if (match.predictionCutoffAt && match.predictionCutoffAt < new Date()) {
      return NextResponse.json({ error: "Prediction cutoff has passed" }, { status: 403 });
    }

    if (type === "OUTCOME" && !selectedOutcome) {
      return NextResponse.json({ error: "Outcome required" }, { status: 400 });
    }
    if (type === "CORRECT_SCORE" && (homeScore == null || awayScore == null)) {
      return NextResponse.json({ error: "Score required" }, { status: 400 });
    }

    // Always create a new prediction (history kept; no replace)
    const prediction = await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId,
        type,
        selectedOutcome: selectedOutcome ?? null,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
        comment: comment ?? null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ ok: true, id: prediction.id, createdAt: prediction.createdAt });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("prediction error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
