import Link from "next/link";
import { getSessionUser, isAdmin, getUserLeagues, getActiveLeagueId } from "@/lib/auth";
import { FullscreenButton } from "@/components/FullscreenButton";

export async function Header() {
  const user = await getSessionUser();
  let activeLeague: { slug: string; name: string } | null = null;

  if (user) {
    const activeId = await getActiveLeagueId();
    const memberships = await getUserLeagues(user.id);
    if (activeId) {
      const m = memberships.find((x) => x.leagueId === activeId);
      if (m) activeLeague = { slug: m.league.slug, name: m.league.name };
    }
    if (!activeLeague && memberships[0]) {
      activeLeague = { slug: memberships[0].league.slug, name: memberships[0].league.name };
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-12 items-center justify-between gap-2 sm:h-14 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-1.5 font-bold text-slate-900 sm:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[10px] text-white sm:h-8 sm:w-8 sm:text-xs">
            LM
          </span>
          <span className="truncate text-sm sm:text-base">League Management</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Discover
          </Link>
          <Link href="/leaderboard" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Leaderboard
          </Link>
          {activeLeague && (
            <>
              <Link
                href={`/l/${activeLeague.slug}`}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                {activeLeague.name}
              </Link>
              <Link
                href={`/l/${activeLeague.slug}/fixtures`}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Fixtures
              </Link>
              <Link
                href={`/l/${activeLeague.slug}/groups`}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Tables
              </Link>
            </>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <FullscreenButton />
          {user ? (
            <>
              {isAdmin(user.role) && (
                <Link href="/admin" className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700">
                  Admin
                </Link>
              )}
              <Link href="/account" className="max-w-[7rem] truncate text-sm font-medium text-slate-700">
                {user.username}
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-emerald-700">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
