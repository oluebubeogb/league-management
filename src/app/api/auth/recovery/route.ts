import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeUsername, normalizePhone, hashPassword } from "@/lib/auth";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

const requestSchema = z.object({
  username: z.string().min(1),
  phone: z.string().min(1),
  birthYear: z.number().int(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.token && body.password) {
      const data = resetSchema.parse(body);
      const tokenHash = createHash("sha256").update(data.token).digest("hex");
      const rec = await prisma.recoveryToken.findUnique({ where: { tokenHash } });
      if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
      }
      const passwordHash = await hashPassword(data.password);
      await prisma.$transaction([
        prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } }),
        prisma.recoveryToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    const data = requestSchema.parse(body);
    const user = await prisma.user.findFirst({
      where: {
        normalizedUsername: normalizeUsername(data.username),
        normalizedPhone: normalizePhone(data.phone),
        birthYear: data.birthYear,
        role: "FAN",
        status: "ACTIVE",
      },
    });

    // Always generic response
    if (user) {
      const raw = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(raw).digest("hex");
      await prisma.recoveryToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      // No SMS provider — return token for manual/dev use (documented limitation)
      return NextResponse.json({
        ok: true,
        message: "If the details match, a recovery token was issued.",
        // Dev convenience only; remove in production when SMS is wired
        recoveryToken: process.env.NODE_ENV !== "production" ? raw : undefined,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "If the details match, a recovery token was issued.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("[recovery]", e);
    return NextResponse.json({ error: "Recovery failed" }, { status: 500 });
  }
}
