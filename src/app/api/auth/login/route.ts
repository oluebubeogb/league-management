import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  normalizeUsername,
  normalizePhone,
  isAdmin,
} from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { identifier, password } = parsed.data;
    const normalized = normalizeUsername(identifier);
    const phoneNorm = normalizePhone(identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { normalizedUsername: normalized },
          { normalizedPhone: phoneNorm },
        ],
        status: "ACTIVE",
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    const redirect = isAdmin(user.role) ? "/admin" : "/";
    return NextResponse.json({ ok: true, redirect, role: user.role });
  } catch (e) {
    console.error("login error", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("SESSION_SECRET")) {
      return NextResponse.json(
        { error: "Server misconfigured: SESSION_SECRET must be 32+ characters in Coolify." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
