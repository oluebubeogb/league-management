import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, setActiveLeagueCookie, AuthError } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  inviteCode: z.string().min(4).max(32).optional(),
  leagueId: z.string().optional(),
  leagueSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = schema.parse(body);

    let league = null;
    if (data.inviteCode) {
      league = await prisma.league.findUnique({
        where: { inviteCode: data.inviteCode.trim().toUpperCase() },
      });
    } else if (data.leagueId) {
      league = await prisma.league.findUnique({ where: { id: data.leagueId } });
    } else if (data.leagueSlug) {
      league = await prisma.league.findUnique({ where: { slug: data.leagueSlug } });
    }

    if (!league || league.status !== "ACTIVE") {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (league.visibility === "PRIVATE" && !data.inviteCode) {
      return NextResponse.json({ error: "Invite code required" }, { status: 403 });
    }

    const existing = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        await setActiveLeagueCookie(league.id);
        return NextResponse.json({ ok: true, league, alreadyMember: true });
      }
      await prisma.leagueMember.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", role: "FAN" },
      });
    } else {
      await prisma.leagueMember.create({
        data: { leagueId: league.id, userId: user.id, role: "FAN", status: "ACTIVE" },
      });
    }

    await setActiveLeagueCookie(league.id);
    return NextResponse.json({ ok: true, league });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("[join]", e);
    return NextResponse.json({ error: "Join failed" }, { status: 500 });
  }
}
