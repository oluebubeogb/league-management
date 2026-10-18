import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role, User, LeagueRole, LeagueMember, League } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const SESSION_COOKIE = "league_management_session";
const ACTIVE_LEAGUE_COOKIE = "active_league_id";
const SESSION_DAYS = 14;

const ROLE_RANK: Record<LeagueRole, number> = {
  FAN: 0,
  REFEREE: 1,
  COACH: 2,
  ADMIN: 3,
  OWNER: 4,
};

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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
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
  cookieStore.delete(ACTIVE_LEAGUE_COOKIE);
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

export function isPlatformAdmin(user: User): boolean {
  return isAdmin(user.role);
}

// ── League membership helpers ───────────────────────────────────────

export async function getUserLeagues(userId: string) {
  return prisma.leagueMember.findMany({
    where: { userId, status: "ACTIVE" },
    include: { league: true },
    orderBy: { joinedAt: "desc" },
  });
}

export async function getMembership(
  userId: string,
  leagueId: string
): Promise<(LeagueMember & { league: League }) | null> {
  return prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
    include: { league: true },
  });
}

export function hasMinRole(memberRole: LeagueRole, minRole: LeagueRole): boolean {
  return ROLE_RANK[memberRole] >= ROLE_RANK[minRole];
}

/** Platform admins bypass league role checks. */
export async function requireLeagueRole(
  userId: string,
  leagueId: string,
  minRole: LeagueRole = "FAN"
): Promise<{ user: User; membership: LeagueMember | null; league: League }> {
  const user = await requireUser();
  if (user.id !== userId) throw new AuthError("Forbidden", 403);

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league || league.status === "SUSPENDED") {
    throw new AuthError("League not found", 404);
  }

  if (isPlatformAdmin(user)) {
    return { user, membership: null, league };
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    throw new AuthError("Not a member of this league", 403);
  }
  if (!hasMinRole(membership.role, minRole)) {
    throw new AuthError("Insufficient league role", 403);
  }

  return { user, membership, league };
}

export async function getLeagueBySlug(slug: string) {
  return prisma.league.findUnique({ where: { slug } });
}

export async function setActiveLeagueCookie(leagueId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_LEAGUE_COOKIE, leagueId, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getActiveLeagueId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_LEAGUE_COOKIE)?.value ?? null;
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
