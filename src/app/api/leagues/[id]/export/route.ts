import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireLeagueRole, AuthError } from "@/lib/auth";
import { exportCsv } from "@/lib/csv-import";
import type { CsvEntity } from "@prisma/client";

const ENTITIES: CsvEntity[] = ["TEAMS", "PLAYERS", "FIXTURES", "SCORES", "GROUPS"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;
    const user = await requireUser();
    await requireLeagueRole(user.id, leagueId, "ADMIN");

    const entity = (new URL(req.url).searchParams.get("entity") || "").toUpperCase() as CsvEntity;
    if (!ENTITIES.includes(entity)) {
      return NextResponse.json({ error: "entity query required: TEAMS|PLAYERS|FIXTURES|SCORES|GROUPS" }, { status: 400 });
    }

    const csv = await exportCsv(leagueId, entity);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${entity.toLowerCase()}-${leagueId.slice(0, 8)}.csv"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[export GET]", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
