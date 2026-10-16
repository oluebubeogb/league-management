import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError, audit } from "@/lib/auth";

const schema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  shortName: z.string().max(5).optional().nullable(),
  color1: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  color2: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  color3: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { teamId, ...data } = parsed.data;
    const existing = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existing) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const shortName =
      data.shortName === undefined
        ? undefined
        : data.shortName
          ? data.shortName.trim().toUpperCase().slice(0, 5)
          : null;

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(shortName !== undefined && { shortName }),
        ...(data.color1 !== undefined && { color1: data.color1 }),
        ...(data.color2 !== undefined && { color2: data.color2 }),
        ...(data.color3 !== undefined && { color3: data.color3 }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    await audit(admin.id, "TEAM_UPDATE", "Team", teamId, {
      name: updated.name,
      shortName: updated.shortName,
      colors: [updated.color1, updated.color2, updated.color3],
    });

    return NextResponse.json({
      ok: true,
      team: {
        id: updated.id,
        name: updated.name,
        shortName: updated.shortName,
        color1: updated.color1,
        color2: updated.color2,
        color3: updated.color3,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("admin team update", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
