import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, getUserLeagues } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberships = await getUserLeagues(user.id);

  return (
    <div className="container-app space-y-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900">Account</h1>
      <div className="card space-y-2">
        <p>
          <span className="text-sm text-slate-500">Username</span>
          <br />
          <span className="font-medium">{user.username}</span>
        </p>
        <p>
          <span className="text-sm text-slate-500">Role</span>
          <br />
          <span className="font-medium">{user.role}</span>
        </p>
        <LogoutButton />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My leagues</h2>
          <Link href="/leagues/new" className="text-sm font-medium text-emerald-700">
            + Create
          </Link>
        </div>
        {memberships.length === 0 ? (
          <p className="text-sm text-slate-500">You have not joined any leagues yet.</p>
        ) : (
          <ul className="space-y-2">
            {memberships.map((m) => (
              <li key={m.id}>
                <Link href={`/l/${m.league.slug}`} className="card block hover:border-emerald-300">
                  <span className="font-medium">{m.league.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{m.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
