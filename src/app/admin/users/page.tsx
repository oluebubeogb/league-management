import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) redirect("/login");

  const fans = await prisma.user.findMany({
    where: { role: "FAN" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      username: true,
      phone: true,
      status: true,
      createdAt: true,
      _count: { select: { predictions: true } },
    },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fan accounts</h1>
          <p className="text-sm text-slate-500">{fans.length} shown</p>
        </div>
        <a href="/admin" className="btn-secondary text-sm">
          ← Dashboard
        </a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Predictions</th>
              <th className="px-3 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {fans.map((f) => (
              <tr key={f.id} className="border-b border-slate-100">
                <td className="px-3 py-2.5 font-medium">{f.username}</td>
                <td className="px-3 py-2.5 text-slate-600">{f.phone}</td>
                <td className="px-3 py-2.5">{f.status}</td>
                <td className="px-3 py-2.5 tabular-nums">{f._count.predictions}</td>
                <td className="px-3 py-2.5 text-slate-500">{f.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {fans.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">No fan accounts yet.</p>
        )}
      </div>
    </div>
  );
}
