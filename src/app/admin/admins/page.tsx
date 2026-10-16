import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminAccountsManager } from "@/components/AdminAccountsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Admins" };

export default async function AdminAdminsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRIMARY_ADMIN") redirect("/admin");

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PRIMARY_ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin accounts</h1>
          <p className="text-sm text-slate-500">
            Primary admin only — edit secondary admins below
          </p>
        </div>
        <a href="/admin" className="btn-secondary text-sm">
          ← Dashboard
        </a>
      </div>

      <AdminAccountsManager
        primaryId={user.id}
        admins={admins.map((a) => ({
          id: a.id,
          username: a.username,
          phone: a.phone,
          role: a.role,
          status: a.status,
          createdAt: a.createdAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
