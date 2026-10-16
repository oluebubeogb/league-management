import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  requirePrimaryAdmin,
  AuthError,
  hashPassword,
  normalizeUsername,
  normalizePhone,
  audit,
  revokeAllSessions,
} from "@/lib/auth";

const createSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(128),
});

const updateSchema = z.object({
  adminId: z.string().min(1),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(128).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const primary = await requirePrimaryAdmin();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { username, phone, password } = parsed.data;
    const normalizedUsername = normalizeUsername(username);
    const normalizedPhone = normalizePhone(phone);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ normalizedUsername }, { normalizedPhone }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Username or phone already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const admin = await prisma.user.create({
      data: {
        username: username.trim(),
        normalizedUsername,
        phone: phone.trim(),
        normalizedPhone,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    await audit(primary.id, "ADMIN_CREATE", "User", admin.id, { username: admin.username });

    return NextResponse.json({ ok: true, id: admin.id });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("create admin", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Primary admin can update secondary admin username, phone, password, status. */
export async function PATCH(req: NextRequest) {
  try {
    const primary = await requirePrimaryAdmin();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { adminId, username, phone, password, status } = parsed.data;

    const target = await prisma.user.findUnique({ where: { id: adminId } });
    if (!target) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    if (target.role === "PRIMARY_ADMIN") {
      return NextResponse.json(
        { error: "Cannot edit primary admin here. Use FORCE_PRIMARY_ADMIN_RESET env if needed." },
        { status: 403 }
      );
    }
    if (target.role !== "ADMIN") {
      return NextResponse.json({ error: "Target is not an admin account" }, { status: 400 });
    }
    if (target.id === primary.id) {
      return NextResponse.json({ error: "Cannot edit yourself via this form" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (username !== undefined) {
      const normalizedUsername = normalizeUsername(username);
      const clash = await prisma.user.findFirst({
        where: { normalizedUsername, NOT: { id: adminId } },
      });
      if (clash) {
        return NextResponse.json({ error: "Username already in use" }, { status: 409 });
      }
      data.username = username.trim();
      data.normalizedUsername = normalizedUsername;
    }

    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone.length < 7) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      const clash = await prisma.user.findFirst({
        where: { normalizedPhone, NOT: { id: adminId } },
      });
      if (clash) {
        return NextResponse.json({ error: "Phone already in use" }, { status: 409 });
      }
      data.phone = phone.trim();
      data.normalizedPhone = normalizedPhone;
    }

    if (password !== undefined) {
      data.passwordHash = await hashPassword(password);
    }

    if (status !== undefined) {
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data,
    });

    // Password or disable → revoke sessions so changes take effect immediately
    if (password !== undefined || status === "DISABLED") {
      await revokeAllSessions(adminId);
    }

    await audit(primary.id, "ADMIN_UPDATE", "User", adminId, {
      username: updated.username,
      phone: updated.phone,
      status: updated.status,
      passwordChanged: password !== undefined,
    });

    return NextResponse.json({
      ok: true,
      admin: {
        id: updated.id,
        username: updated.username,
        phone: updated.phone,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("update admin", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
