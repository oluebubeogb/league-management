import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser, getUserLeagues } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const publicLeagues = await prisma.league.findMany({
    where: { visibility: "PUBLIC", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { _count: { select: { members: true, teams: true } } },
  });

  let myLeagues: Awaited<ReturnType<typeof getUserLeagues>> = [];
  if (user) {
    myLeagues = await getUserLeagues(user.id);
  }

  return (
    <div className="container-app space-y-8 py-6">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 to-slate-900 px-5 py-8 text-white sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">League Management</h1>
        <p className="mt-2 max-w-xl text-sm text-emerald-100 sm:text-base">
          Create and run local football leagues, tournaments, clubs and players. Fixtures, tables,
          scores and fan predictions — all in one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {user ? (
            <Link href="/leagues/new" className="btn-primary bg-white text-emerald-800 hover:bg-emerald-50">
              Create a league
            </Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary bg-white text-emerald-800 hover:bg-emerald-50">
                Get started
              </Link>
              <Link href="/login" className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
                Log in
              </Link>
            </>
          )}
          <Link href="/leagues" className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            Browse leagues
          </Link>
        </div>
      </section>

      {user && myLeagues.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">My leagues</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myLeagues.map((m) => (
              <Link
                key={m.id}
                href={`/l/${m.league.slug}`}
                className="card block hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="font-semibold text-slate-900">{m.league.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {m.role} · {m.league.visibility.toLowerCase()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Public leagues</h2>
          <Link href="/leagues" className="text-sm font-medium text-emerald-700">
            View all
          </Link>
        </div>
        {publicLeagues.length === 0 ? (
          <p className="text-sm text-slate-500">No public leagues yet. Be the first to create one.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicLeagues.map((l) => (
              <Link
                key={l.id}
                href={`/l/${l.slug}`}
                className="card block hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="font-semibold text-slate-900">{l.name}</div>
                {l.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{l.description}</p>
                )}
                <div className="mt-2 text-xs text-slate-400">
                  {l._count.teams} teams · {l._count.members} members
                  {l.region ? ` · ${l.region}` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
