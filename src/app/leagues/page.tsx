import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { JoinCodeClient } from "@/components/JoinCodeClient";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const user = await getSessionUser();
  const leagues = await prisma.league.findMany({
    where: { visibility: "PUBLIC", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, members: true } } },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Public leagues</h1>
        {user && (
          <Link href="/leagues/new" className="btn-primary text-sm">
            Create league
          </Link>
        )}
      </div>

      {user && (
        <div className="card">
          <p className="mb-2 text-sm font-medium text-slate-700">Join with invite code</p>
          <JoinCodeClient />
        </div>
      )}

      {leagues.length === 0 ? (
        <p className="text-sm text-slate-500">No public leagues yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((l) => (
            <Link key={l.id} href={`/l/${l.slug}`} className="card block hover:border-emerald-300">
              <div className="font-semibold">{l.name}</div>
              {l.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{l.description}</p>}
              <div className="mt-2 text-xs text-slate-400">
                {l._count.teams} teams · {l._count.members} members
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
