import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireUser,
  slugify,
  setActiveLeagueCookie,
  AuthError,
} from "@/lib/auth";
import { z } from "zod";
import { randomBytes } from "crypto";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  country: z.string().max(60).optional(),
  region: z.string().max(60).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]).default("PUBLIC"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "1";

  try {
    if (mine) {
      const user = await requireUser();
      const memberships = await prisma.leagueMember.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        include: {
          league: {
            include: { _count: { select: { teams: true, members: true } } },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      return NextResponse.json({
        leagues: memberships.map((m) => ({
          ...m.league,
          role: m.role,
        })),
      });
    }

    const leagues = await prisma.league.findMany({
      where: { visibility: "PUBLIC", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { teams: true, members: true } } },
    });
    return NextResponse.json({ leagues });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[leagues GET]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = createSchema.parse(body);

    let base = slugify(data.name) || "league";
    let slug = base;
    let n = 1;
    while (await prisma.league.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const inviteCode = randomBytes(4).toString("hex").toUpperCase();

    const league = await prisma.league.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        country: data.country?.trim() || null,
        region: data.region?.trim() || null,
        visibility: data.visibility,
        inviteCode,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: "OWNER", status: "ACTIVE" },
        },
      },
    });

    await setActiveLeagueCookie(league.id);

    return NextResponse.json({ ok: true, league }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message || "Invalid" }, { status: 400 });
    }
    console.error("[leagues POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
