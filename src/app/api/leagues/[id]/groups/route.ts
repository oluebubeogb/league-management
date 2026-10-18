import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireLeagueRole, AuthError } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1).max(8),
  name: z.string().min(1).max(40),
  displayOrder: z.number().int().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const groups = await prisma.group.findMany({
    where: { leagueId },
    include: { teams: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ groups });
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

    const group = await prisma.group.create({
      data: {
        leagueId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        displayOrder: data.displayOrder ?? 0,
      },
    });

    return NextResponse.json({ ok: true, group }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error("[groups POST]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
