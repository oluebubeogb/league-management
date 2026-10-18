import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, isPlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const user = await getSessionUser();
  if (!user || !isPlatformAdmin(user)) redirect("/login");

  const [userCount, leagueCount, matchCount] = await Promise.all([
    prisma.user.count(),
    prisma.league.count(),
    prisma.match.count(),
  ]);

  const leagues = await prisma.league.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { _count: { select: { members: true, teams: true } } },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <h1 className="text-2xl font-bold">Platform admin</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold">{userCount}</div>
          <div className="text-xs text-slate-500">Users</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">{leagueCount}</div>
          <div className="text-xs text-slate-500">Leagues</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">{matchCount}</div>
          <div className="text-xs text-slate-500">Matches</div>
        </div>
      </div>
      <section>
        <h2 className="mb-2 font-semibold">Recent leagues</h2>
        <ul className="space-y-2">
          {leagues.map((l) => (
            <li key={l.id} className="card flex justify-between text-sm">
              <Link href={`/l/${l.slug}`} className="font-medium text-emerald-700">
                {l.name}
              </Link>
              <span className="text-slate-400">
                {l.status} · {l._count.teams} teams · {l._count.members} members
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
