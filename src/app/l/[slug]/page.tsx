import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, getMembership, setActiveLeagueCookie } from "@/lib/auth";
import { JoinLeagueButton } from "@/components/JoinLeagueButton";

export const dynamic = "force-dynamic";

export default async function LeagueHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      _count: { select: { teams: true, members: true, matches: true } },
      groups: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!league || league.status === "SUSPENDED") notFound();

  const user = await getSessionUser();
  let membership = null;
  if (user) {
    membership = await getMembership(user.id, league.id);
    if (membership?.status === "ACTIVE") {
      await setActiveLeagueCookie(league.id);
    }
  }

  const canAdmin =
    membership &&
    (membership.role === "OWNER" || membership.role === "ADMIN") &&
    membership.status === "ACTIVE";

  const upcoming = await prisma.match.findMany({
    where: {
      leagueId: league.id,
      published: true,
      status: { in: ["SCHEDULED", "LIVE", "HALF_TIME"] },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffAt: "asc" },
    take: 5,
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{league.name}</h1>
          {league.description && (
            <p className="mt-1 text-sm text-slate-600">{league.description}</p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            {league._count.teams} teams · {league._count.members} members · {league._count.matches}{" "}
            matches
            {league.region ? ` · ${league.region}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAdmin && (
            <Link href={`/l/${slug}/admin`} className="btn-primary text-sm">
              League admin
            </Link>
          )}
          {user && !membership && (league.visibility === "PUBLIC" || league.visibility === "INVITE_ONLY") && (
            <JoinLeagueButton leagueId={league.id} slug={slug} />
          )}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href={`/l/${slug}/fixtures`} className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium">
          Fixtures
        </Link>
        <Link href={`/l/${slug}/groups`} className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium">
          Tables
        </Link>
        <Link href={`/l/${slug}/results`} className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium">
          Results
        </Link>
        <Link href={`/l/${slug}/teams`} className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium">
          Teams
        </Link>
      </nav>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming fixtures.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => (
              <li key={m.id} className="card flex items-center justify-between text-sm">
                <span>
                  {m.homeTeam?.name || m.homeSlot || "TBD"} vs{" "}
                  {m.awayTeam?.name || m.awaySlot || "TBD"}
                </span>
                <span className="text-xs text-slate-400">
                  {m.status === "LIVE"
                    ? "LIVE"
                    : m.kickoffAt
                      ? new Date(m.kickoffAt).toLocaleString()
                      : "TBC"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {league.inviteCode && canAdmin && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Invite code: <strong>{league.inviteCode}</strong>
        </p>
      )}
    </div>
  );
}
