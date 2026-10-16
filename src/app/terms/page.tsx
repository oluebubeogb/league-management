import { PREDICTION_DISCLAIMER } from "@/lib/utils";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-app max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-slate-900">Terms of use</h1>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <p>
          This platform is the official information and engagement site for League Management. By
          using it you agree to use accounts responsibly and not to abuse prediction or comment
          features.
        </p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          {PREDICTION_DISCLAIMER}
        </p>
        <p>
          Match results published by authorised administrators are authoritative for standings and
          prediction grading. The organisers may correct scores; grades are recalculated
          accordingly.
        </p>
        <p>
          Sponsored by High Chief Dickson Oguguo Nzenwa. Aku Bara-Oha 1 Of Ibeku Ancient Kingdom.
          The sponsor does not administer the technical platform unless explicitly configured as
          an administrator account.
        </p>
      </div>
    </div>
  );
}
