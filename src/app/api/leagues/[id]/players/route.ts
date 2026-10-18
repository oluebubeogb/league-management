import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireLeagueRole, AuthError } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  teamId: z.string(),
  fullName: z.string().min(1).max(100),
  position: z.string().max(30).optional(),
  age: z.number().int().min(10).max(60).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  phone: z.string().max(20).optional(),
  nationality: z.string().max(40).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const teamId = new URL(req.url).searchParams.get("teamId");

  const players = await prisma.player.findMany({
    where: {
      team: { leagueId },
      status: "ACTIVE",
      ...(teamId ? { teamId } : {}),
    },
    include: { team: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ team: { name: "asc" } }, { fullName: "asc" }],
  });
  return NextResponse.json({ players });
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
    const data = createSchema.parse(body);

    const team = await prisma.team.findFirst({
      where: { id: data.teamId, leagueId },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found in this league" }, { status: 404 });
    }

    const normalizedName = data.fullName.trim().toLowerCase().replace(/\s+/g, " ");

    const player = await prisma.player.create({
      data: {
        teamId: data.teamId,
        fullName: data.fullName.trim(),
        normalizedName,
        position: data.position || null,
        age: data.age ?? null,
        jerseyNumber: data.jerseyNumber ?? null,
        phone: data.phone || null,
        nationality: data.nationality || null,
      },
    });

    return NextResponse.json({ ok: true, player }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error("[players POST]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
