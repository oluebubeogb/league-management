import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  normalizeUsername,
  normalizePhone,
  revokeAllSessions,
} from "@/lib/auth";

const requestSchema = z.object({
  action: z.literal("request"),
  identifier: z.string().min(1),
  birthYear: z.number().int(),
});

const resetSchema = z.object({
  action: z.literal("reset"),
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "request") {
      const parsed = requestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ message: "If the details match, a recovery step is available." });
      }

      const { identifier, birthYear } = parsed.data;
      const normalized = normalizeUsername(identifier);
      const phoneNorm = normalizePhone(identifier);

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ normalizedUsername: normalized }, { normalizedPhone: phoneNorm }],
          role: "FAN",
          status: "ACTIVE",
        },
      });

      // Generic response always
      if (!user || user.birthYear !== birthYear) {
        return NextResponse.json({
          message: "If the details match, a recovery step is available.",
        });
      }

      const raw = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(raw).digest("hex");
      await prisma.recoveryToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      // Without SMS we return the token for the same session flow.
      // Document this limitation; production can replace with SMS OTP.
      return NextResponse.json({
        message: "Verification matched. Set a new password.",
        token: raw,
      });
    }

    if (body.action === "reset") {
      const parsed = resetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
      const record = await prisma.recoveryToken.findUnique({ where: { tokenHash } });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
      }

      const passwordHash = await hashPassword(parsed.data.newPassword);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        }),
        prisma.recoveryToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);
      await revokeAllSessions(record.userId);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("recovery error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
