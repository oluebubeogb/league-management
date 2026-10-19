import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { getOrCreateWallet, adjustBalance } from "@/lib/wallet";
import { potentialPayout } from "@/lib/predictions";
import { z } from "zod";

const createSchema = z.object({
  matchId: z.string(),
  type: z.enum(["OUTCOME", "DOUBLE_CHANCE", "CORRECT_SCORE", "TOTAL_GOALS", "BTTS"]),
  selectedOutcome: z.string().optional(),
  homeScore: z.number().int().min(0).max(20).optional(),
  awayScore: z.number().int().min(0).max(20).optional(),
  comment: z.string().max(200).optional(),
  stakeAmount: z.number().int().min(0).max(5000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const matchId = new URL(req.url).searchParams.get("matchId");
    const preds = await prisma.prediction.findMany({
      where: {
        userId: user.id,
        ...(matchId ? { matchId } : {}),
      },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true, league: { select: { slug: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ predictions: preds });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = createSchema.parse(body);

    const match = await prisma.match.findUnique({ where: { id: data.matchId } });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.status === "FULL_TIME" || match.status === "CANCELLED") {
      return NextResponse.json({ error: "Match is closed for predictions" }, { status: 400 });
    }
    if (match.predictionCutoffAt && match.predictionCutoffAt < new Date()) {
      return NextResponse.json({ error: "Prediction cutoff passed" }, { status: 400 });
    }
    if (match.kickoffAt && match.kickoffAt < new Date()) {
      return NextResponse.json({ error: "Match already started" }, { status: 400 });
    }

    const stake = data.stakeAmount || 0;
    if (stake > 0) {
      await getOrCreateWallet(user.id);
      await adjustBalance(user.id, -stake, "PREDICTION_STAKE", {
        referenceId: data.matchId,
        note: `Stake on ${data.type}`,
      });
    }

    const payout = potentialPayout(data.type, stake);

    // Upsert-like: one prediction per user/match/type
    const existing = await prisma.prediction.findFirst({
      where: { userId: user.id, matchId: data.matchId, type: data.type, status: "ACTIVE" },
    });

    let prediction;
    if (existing) {
      // refund old stake if changing
      if (existing.stakeAmount > 0) {
        await adjustBalance(user.id, existing.stakeAmount, "REFUND", {
          referenceId: existing.id,
          note: "Replaced prediction stake refund",
        });
      }
      prediction = await prisma.prediction.update({
        where: { id: existing.id },
        data: {
          selectedOutcome: data.selectedOutcome,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          comment: data.comment,
          stakeAmount: stake,
          potentialPayout: payout || null,
        },
      });
    } else {
      prediction = await prisma.prediction.create({
        data: {
          userId: user.id,
          matchId: data.matchId,
          type: data.type,
          selectedOutcome: data.selectedOutcome,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          comment: data.comment,
          stakeAmount: stake,
          potentialPayout: payout || null,
        },
      });
    }

    return NextResponse.json({ ok: true, prediction }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Insufficient coins") {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }
    console.error("[predictions POST]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
