import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeamEditor } from "@/components/TeamEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Teams" };

export default async function AdminTeamsPage() {
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
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-slate-500">
            Edit names, short codes and 3-stripe flag colours
          </p>
        </div>
        <a href="/admin" className="btn-secondary text-sm">
          ← Dashboard
        </a>
      </div>

      <TeamEditor
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          shortName: t.shortName,
          color1: t.color1 || "#16a34a",
          color2: t.color2 || "#ffffff",
          color3: t.color3 || "#0f172a",
          groupCode: t.group.code,
          playerCount: t._count.players,
        }))}
      />
    </div>
  );
}
