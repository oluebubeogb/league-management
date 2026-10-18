import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getSessionUser,
  getMembership,
  isPlatformAdmin,
  hasMinRole,
} from "@/lib/auth";
import { LeagueAdminClient } from "@/components/LeagueAdminClient";

export const dynamic = "force-dynamic";

export default async function LeagueAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      groups: { orderBy: { displayOrder: "asc" } },
      teams: { include: { group: true }, orderBy: { name: "asc" } },
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: [{ matchday: "asc" }, { kickoffAt: "asc" }],
        take: 50,
      },
    },
  });
  if (!league) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, league.id);
  const allowed =
    isPlatformAdmin(user) ||
    (membership &&
      membership.status === "ACTIVE" &&
      hasMinRole(membership.role, "ADMIN"));

  if (!allowed) {
    return (
      <div className="container-app py-10 text-center">
        <p className="text-red-600">You need league ADMIN or OWNER role.</p>
        <Link href={`/l/${slug}`} className="mt-4 inline-block text-emerald-700">
          Back to league
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/l/${slug}`} className="text-emerald-700">
          {league.name}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Admin</span>
      </div>
      <h1 className="text-xl font-bold">League admin</h1>
      {league.inviteCode && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Invite code: <strong className="select-all">{league.inviteCode}</strong>
        </p>
      )}
      <LeagueAdminClient
        leagueId={league.id}
        slug={slug}
        groups={league.groups.map((g) => ({ id: g.id, code: g.code, name: g.name }))}
        teams={league.teams.map((t) => ({
          id: t.id,
          name: t.name,
          groupId: t.groupId,
          groupCode: t.group?.code ?? null,
        }))}
        matches={league.matches.map((m) => ({
          id: m.id,
          homeName: m.homeTeam?.name || m.homeSlot || "TBD",
          awayName: m.awayTeam?.name || m.awaySlot || "TBD",
          status: m.status,
          htHome: m.halfTimeHomeScore,
          htAway: m.halfTimeAwayScore,
          ftHome: m.fullTimeHomeScore,
          ftAway: m.fullTimeAwayScore,
          matchday: m.matchday,
        }))}
      />
    </div>
  );
}
