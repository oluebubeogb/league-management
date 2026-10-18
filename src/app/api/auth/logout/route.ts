import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { jwtVerify } from "jose";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user) {
      const cookieStore = await cookies();
      const token = cookieStore.get("league_management_session")?.value;
      if (token) {
        try {
          const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
          const { payload } = await jwtVerify(token, secret);
          const raw = payload.sid as string;
          if (raw) {
            const tokenHash = createHash("sha256").update(raw).digest("hex");
            await prisma.session.updateMany({
              where: { tokenHash, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
