import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createSession,
  setSessionCookie,
  normalizeUsername,
  normalizePhone,
} from "@/lib/auth";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscore only"),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(128),
  birthYear: z.number().int().min(1940).max(2015),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { username, phone, password, birthYear } = parsed.data;
    const normalizedUsername = normalizeUsername(username);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 7) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ normalizedUsername }, { normalizedPhone }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username or phone number already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        normalizedUsername,
        phone: phone.trim(),
        normalizedPhone,
        passwordHash,
        birthYear,
        role: "FAN",
      },
    });

    try {
      const token = await createSession(user.id);
      await setSessionCookie(token);
    } catch (sessionErr) {
      const msg = sessionErr instanceof Error ? sessionErr.message : "";
      console.error("signup session error", sessionErr);
      if (msg.includes("SESSION_SECRET")) {
        return NextResponse.json(
          {
            error:
              "Account created but login session failed. Set SESSION_SECRET (32+ characters) in Coolify, then log in.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Account created. Please log in." },
        { status: 201 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("signup error", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("SESSION_SECRET")) {
      return NextResponse.json(
        { error: "Server misconfigured: SESSION_SECRET must be set (32+ characters) in Coolify." },
        { status: 500 }
      );
    }
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Username or phone number already registered" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
