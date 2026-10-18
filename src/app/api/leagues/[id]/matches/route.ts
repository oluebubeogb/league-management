import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireLeagueRole, AuthError } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  stage: z
    .enum([
      "GROUP",
      "ROUND_OF_16",
      "QUARTER_FINAL",
      "SEMI_FINAL",
      "THIRD_PLACE",
      "FINAL",
      "FRIENDLY",
      "OTHER",
    ])
    .default("GROUP"),
  groupId: z.string().optional().nullable(),
  homeTeamId: z.string().optional().nullable(),
  awayTeamId: z.string().optional().nullable(),
  homeSlot: z.string().optional().nullable(),
  awaySlot: z.string().optional().nullable(),
  kickoffAt: z.string().datetime().optional().nullable(),
  venue: z.string().max(120).optional().nullable(),
  matchday: z.number().int().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const scoreSchema = z.object({
  matchId: z.string(),
  status: z.enum(["SCHEDULED", "LIVE", "HALF_TIME", "FULL_TIME", "POSTPONED", "CANCELLED"]),
  halfTimeHomeScore: z.number().int().min(0).optional().nullable(),
  halfTimeAwayScore: z.number().int().min(0).optional().nullable(),
  fullTimeHomeScore: z.number().int().min(0).optional().nullable(),
  fullTimeAwayScore: z.number().int().min(0).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const matches = await prisma.match.findMany({
    where: {
      leagueId,
      published: true,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      group: true,
    },
    orderBy: [{ matchday: "asc" }, { kickoffAt: "asc" }],
  });
  return NextResponse.json({ matches });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;
    const user = await requireUser();
    await requireLeagueRole(user.id, leagueId, "ADMIN");

    const body = await req.json();

    // Score update path
    if (body.matchId && body.status) {
      const data = scoreSchema.parse(body);
      const existing = await prisma.match.findFirst({
        where: { id: data.matchId, leagueId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      const match = await prisma.match.update({
        where: { id: data.matchId },
        data: {
          status: data.status,
          halfTimeHomeScore: data.halfTimeHomeScore ?? undefined,
          halfTimeAwayScore: data.halfTimeAwayScore ?? undefined,
          fullTimeHomeScore: data.fullTimeHomeScore ?? undefined,
          fullTimeAwayScore: data.fullTimeAwayScore ?? undefined,
        },
        include: { homeTeam: true, awayTeam: true },
      });
      return NextResponse.json({ ok: true, match });
    }

    // Create match
    const data = createSchema.parse(body);
    const match = await prisma.match.create({
      data: {
        leagueId,
        stage: data.stage,
        groupId: data.groupId || null,
        homeTeamId: data.homeTeamId || null,
        awayTeamId: data.awayTeamId || null,
        homeSlot: data.homeSlot || null,
        awaySlot: data.awaySlot || null,
        kickoffAt: data.kickoffAt ? new Date(data.kickoffAt) : null,
        venue: data.venue || null,
        matchday: data.matchday ?? null,
        notes: data.notes || null,
      },
      include: { homeTeam: true, awayTeam: true },
    });

    return NextResponse.json({ ok: true, match }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error("[matches]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
