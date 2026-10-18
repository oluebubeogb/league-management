import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireLeagueRole, slugify, AuthError } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  shortName: z.string().max(5).optional(),
  groupId: z.string().optional().nullable(),
  color1: z.string().optional(),
  color2: z.string().optional(),
  color3: z.string().optional(),
  description: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const teams = await prisma.team.findMany({
    where: { leagueId, status: "ACTIVE" },
    include: { group: true, _count: { select: { players: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ teams });
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

    let base = slugify(data.name) || "team";
    let slug = base;
    let n = 1;
    while (await prisma.team.findUnique({ where: { leagueId_slug: { leagueId, slug } } })) {
      slug = `${base}-${n++}`;
    }

    const team = await prisma.team.create({
      data: {
        leagueId,
        name: data.name.trim(),
        slug,
        shortName: data.shortName?.trim() || null,
        groupId: data.groupId || null,
        color1: data.color1 || "#16a34a",
        color2: data.color2 || "#ffffff",
        color3: data.color3 || "#0f172a",
        description: data.description?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, team }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error("[teams POST]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
