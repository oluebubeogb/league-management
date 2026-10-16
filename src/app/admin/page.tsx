import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) {
    redirect("/login");
  }

  const [scheduled, live, completed, pendingAI, recentMatches] = await Promise.all([
    prisma.match.count({ where: { status: "SCHEDULED" } }),
    prisma.match.count({ where: { status: { in: ["LIVE", "HALF_TIME"] } } }),
    prisma.match.count({ where: { status: "FULL_TIME" } }),
    prisma.aIAnalysis.count({ where: { status: { in: ["DRAFT", "PENDING_REVIEW"] } } }),
    prisma.match.findMany({
      where: { status: { in: ["SCHEDULED", "LIVE", "HALF_TIME", "FULL_TIME"] } },
      include: { homeTeam: true, awayTeam: true, group: true },
      orderBy: { kickoffAt: "asc" },
      take: 8,
    }),
  ]);

  const links = [
    { href: "/admin/matches", label: "Matches & scores", desc: "Edit fixtures, scores, events" },
    { href: "/admin/teams", label: "Teams", desc: "Names, short codes, flag colours" },
    { href: "/admin/players", label: "Players & CSV", desc: "Roster management and import" },
    { href: "/admin/ai", label: "AI analysis", desc: "Generate, review, publish" },
    { href: "/admin/predictions", label: "Predictions", desc: "Fan predictions overview" },
    { href: "/admin/users", label: "Users", desc: "Fan accounts" },
  ];

  if (user.role === "PRIMARY_ADMIN") {
    links.push({ href: "/admin/admins", label: "Admins", desc: "Create and manage admins" });
  }

  return (
    <div className="container-app space-y-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {user.username} ({user.role})
          </p>
        </div>
        <LogoutButton className="btn-secondary text-sm text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Scheduled", value: scheduled },
          { label: "Live", value: live },
          { label: "Completed", value: completed },
          { label: "AI drafts", value: pendingAI },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="card p-4 transition hover:border-emerald-300">
            <p className="font-semibold text-slate-900">{l.label}</p>
            <p className="mt-1 text-xs text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Quick match list</h2>
        <div className="card divide-y divide-slate-100">
          {recentMatches.map((m) => (
            <Link
              key={m.id}
              href="/admin/matches"
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
            >
              <span>
                {m.homeTeam?.name || m.homeSlot || "TBD"} vs {m.awayTeam?.name || m.awaySlot || "TBD"}
              </span>
              <span className="text-xs text-slate-400">{m.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
