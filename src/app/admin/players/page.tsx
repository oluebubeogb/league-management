import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CsvImportForm } from "@/components/CsvImportForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Players" };

export default async function AdminPlayersPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) redirect("/login");

  const teams = await prisma.team.findMany({
    include: { group: true, _count: { select: { players: true } } },
    orderBy: [{ group: { displayOrder: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Players & CSV import</h1>
          <p className="text-sm text-slate-500">Select a team then upload a roster CSV</p>
        </div>
        <a href="/admin" className="btn-secondary text-sm">
          ← Dashboard
        </a>
      </div>

      <CsvImportForm
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          group: t.group.code,
          playerCount: t._count.players,
        }))}
      />
    </div>
  );
}
