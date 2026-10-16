import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "DB unreachable";
  }

  const ready = dbOk;
  const body = {
    status: ready ? "ok" : "degraded",
    ready,
    db: dbOk ? "connected" : "error",
    uptime: process.uptime(),
    latencyMs: Date.now() - started,
    timestamp: new Date().toISOString(),
    ...(dbError && process.env.NODE_ENV !== "production" ? { dbError } : {}),
  };

  return NextResponse.json(body, { status: ready ? 200 : 503 });
}
