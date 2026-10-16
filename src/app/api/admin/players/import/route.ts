import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError, audit } from "@/lib/auth";
import { parsePlayerCSV, normalizePlayerName } from "@/lib/csv";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const form = await req.formData();
    const teamId = form.get("teamId") as string;
    const action = form.get("action") as string;
    const file = form.get("file") as File | null;

    if (!teamId || !file || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const { rows } = parsePlayerCSV(buffer);
    const valid = rows.filter((r) => r.errors.length === 0 && r.fullName);
    const invalid = rows.filter((r) => r.errors.length > 0 || !r.fullName);

    if (action === "preview") {
      return NextResponse.json({
        valid: valid.length,
        invalid: invalid.length,
        rows: rows.map((r) => ({
          rowNumber: r.rowNumber,
          fullName: r.fullName,
          errors: r.errors,
          warnings: r.warnings,
        })),
      });
    }

    if (action === "commit") {
      let imported = 0;
      let skipped = 0;

      for (const r of valid) {
        const normalizedName = normalizePlayerName(r.fullName);
        const existing = await prisma.player.findUnique({
          where: { teamId_normalizedName: { teamId, normalizedName } },
        });

        if (existing) {
          // Merge: only fill empty fields
          await prisma.player.update({
            where: { id: existing.id },
            data: {
              position: existing.position || r.position || undefined,
              age: existing.age ?? r.age ?? undefined,
              phone: existing.phone || r.phone || undefined,
              jerseyNumber: existing.jerseyNumber ?? r.jerseyNumber ?? undefined,
            },
          });
          skipped += 1;
        } else {
          await prisma.player.create({
            data: {
              teamId,
              fullName: r.fullName.trim(),
              normalizedName,
              position: r.position,
              age: r.age,
              phone: r.phone,
              jerseyNumber: r.jerseyNumber,
            },
          });
          imported += 1;
        }
      }

      await prisma.playerImport.create({
        data: {
          teamId,
          uploadedByAdminId: admin.id,
          filename: file.name,
          totalRows: rows.length,
          validRows: valid.length,
          invalidRows: invalid.length,
          status: "COMMITTED",
          reportJson: JSON.stringify({
            invalid: invalid.map((r) => ({
              row: r.rowNumber,
              name: r.fullName,
              errors: r.errors,
            })),
          }),
        },
      });

      await audit(admin.id, "PLAYER_CSV_IMPORT", "Team", teamId, {
        imported,
        skipped,
        invalid: invalid.length,
        filename: file.name,
      });

      return NextResponse.json({ ok: true, imported, skipped });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("csv import", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
