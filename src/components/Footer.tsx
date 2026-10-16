import { SPONSOR } from "@/lib/utils";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 pb-20 md:pb-8">
      <div className="container-app py-8">
        <div className="relative mb-4 overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-lime-50/80 to-amber-50 px-4 py-4 text-center">
          <div className="pointer-events-none absolute -left-2 top-1 text-3xl opacity-20">⚽</div>
          <div className="pointer-events-none absolute -right-1 bottom-0 text-3xl opacity-20">🏆</div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Official Sponsor</p>
          <p className="mt-1.5 text-sm font-semibold text-emerald-950">{SPONSOR}</p>
        </div>

        <div className="flex flex-col items-center gap-4 text-center text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>© 2026 League Management. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-800">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-800">
              Terms
            </Link>
            <Link href="/knockout" className="hover:text-slate-800">
              Knockout
            </Link>
            <Link href="/standings" className="hover:text-slate-800">
              Standings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
