import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser, revokeAllSessions } from "@/lib/auth";

export async function POST() {
  const user = await getSessionUser();
  if (user) {
    await revokeAllSessions(user.id);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
