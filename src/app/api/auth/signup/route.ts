import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  normalizeUsername,
  normalizePhone,
  createSession,
  setSessionCookie,
} from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(32),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(128),
  birthYear: z.number().int().min(1940).max(2015).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const normalizedUsername = normalizeUsername(data.username);
    const normalizedPhone = normalizePhone(data.phone);

    const clash = await prisma.user.findFirst({
      where: {
        OR: [{ normalizedUsername }, { normalizedPhone }],
      },
    });
    if (clash) {
      return NextResponse.json(
        { error: "Username or phone already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        username: data.username.trim(),
        normalizedUsername,
        phone: data.phone.trim(),
        normalizedPhone,
        passwordHash,
        birthYear: data.birthYear ?? null,
        role: "FAN",
      },
    });

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[signup]", e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
