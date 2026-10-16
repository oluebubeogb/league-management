import Link from "next/link";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { FullscreenButton } from "@/components/FullscreenButton";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/groups", label: "Groups" },
  { href: "/predictions", label: "Predictions" },
  { href: "/teams", label: "Teams" },
];

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-12 items-center justify-between gap-2 sm:h-14 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-1.5 font-bold text-slate-900 sm:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[10px] text-white sm:h-8 sm:w-8 sm:text-xs">
            LM
          </span>
          <span className="hidden truncate sm:inline">League Management</span>
          <span className="truncate text-sm sm:hidden">League Management</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <FullscreenButton />
          {user ? (
            <>
              {isAdmin(user.role) && (
                <Link href="/admin" className="btn-secondary hidden text-xs py-1.5 px-2.5 sm:inline-flex">
                  Admin
                </Link>
              )}
              {isAdmin(user.role) && (
                <Link href="/admin" className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 sm:hidden">
                  Admin
                </Link>
              )}
              <Link href="/account" className="max-w-[7rem] truncate text-sm font-medium text-slate-700 sm:max-w-none">
                {user.username}
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-emerald-700 sm:btn-ghost sm:py-1.5">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
