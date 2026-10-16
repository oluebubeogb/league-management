import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role, User } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const SESSION_COOKIE = "league_management_session";
const SESSION_DAYS = 14;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Set it in Coolify environment variables."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function createSession(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  const jwt = await new SignJWT({ sid: raw, uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .setIssuedAt()
    .sign(getSecret());

  return jwt;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    const raw = payload.sid as string;
    const userId = payload.uid as string;
    if (!raw || !userId) return null;

    const tokenHash = createHash("sha256").update(raw).digest("hex");
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }
    if (session.user.status !== "ACTIVE") return null;
    return session.user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "PRIMARY_ADMIN") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requirePrimaryAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "PRIMARY_ADMIN") {
    throw new AuthError("Forbidden — primary admin only", 403);
  }
  return user;
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "PRIMARY_ADMIN";
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function audit(
  actorAdminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.adminAuditLog.create({
    data: {
      actorAdminId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
