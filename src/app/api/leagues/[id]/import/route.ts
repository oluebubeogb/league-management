import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireLeagueRole, AuthError, audit } from "@/lib/auth";
import { previewCsv, commitCsv } from "@/lib/csv-import";
import type { CsvEntity } from "@prisma/client";
import { z } from "zod";

const ENTITIES: CsvEntity[] = ["TEAMS", "PLAYERS", "FIXTURES", "SCORES", "GROUPS"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;
    const user = await requireUser();
    await requireLeagueRole(user.id, leagueId, "ADMIN");

    const contentType = req.headers.get("content-type") || "";

    // JSON body: commit with pre-validated rows
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const schema = z.object({
        entity: z.enum(["TEAMS", "PLAYERS", "FIXTURES", "SCORES", "GROUPS"]),
        action: z.enum(["preview", "commit"]),
        filename: z.string().optional(),
        csv: z.string().optional(),
        rows: z.array(z.unknown()).optional(),
      });
      const data = schema.parse(body);

      if (data.action === "preview") {
        if (!data.csv) {
          return NextResponse.json({ error: "csv text required for preview" }, { status: 400 });
        }
        const result = await previewCsv(leagueId, data.entity, data.csv);
        // Don't send rawValid to client in production size concerns — send summary rows + store isn't needed for simple flow
        return NextResponse.json({
          entity: result.entity,
          totalRows: result.totalRows,
          validRows: result.validRows,
          invalidRows: result.invalidRows,
          rows: result.rows,
          // client re-sends csv on commit for simplicity
        });
      }

      // commit: re-preview then commit valid rows (stateless)
      if (!data.csv) {
        return NextResponse.json({ error: "csv text required for commit" }, { status: 400 });
      }
      const preview = await previewCsv(leagueId, data.entity, data.csv);
      if (preview.validRows === 0) {
        return NextResponse.json({ error: "No valid rows to commit", preview }, { status: 400 });
      }
      const result = await commitCsv(
        leagueId,
        data.entity,
        preview.rawValid,
        user.id,
        data.filename || "upload.csv"
      );
      await audit(user.id, `CSV_IMPORT_${data.entity}`, "League", leagueId, result);
      return NextResponse.json({ ok: true, ...result });
    }

    // multipart form
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const entity = String(form.get("entity") || "").toUpperCase() as CsvEntity;
    const action = String(form.get("action") || "preview");

    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
    if (!ENTITIES.includes(entity)) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const text = await file.text();
    if (action === "commit") {
      const preview = await previewCsv(leagueId, entity, text);
      if (preview.validRows === 0) {
        return NextResponse.json({ error: "No valid rows", preview }, { status: 400 });
      }
      const result = await commitCsv(leagueId, entity, preview.rawValid, user.id, file.name);
      await audit(user.id, `CSV_IMPORT_${entity}`, "League", leagueId, result);
      return NextResponse.json({ ok: true, ...result });
    }

    const result = await previewCsv(leagueId, entity, text);
    return NextResponse.json({
      entity: result.entity,
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      rows: result.rows,
      csv: text, // echo back for commit
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error("[import POST]", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
