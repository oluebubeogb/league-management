import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
      <div className="container-app space-y-1">
        <p>League Management — multi-league football platform</p>
        <p className="flex justify-center gap-3">
          <Link href="/privacy" className="hover:text-slate-700">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-700">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
