"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewLeaguePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    country: "",
    region: "",
    visibility: "PUBLIC",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        if (res.status === 401) {
          router.push("/login");
        }
        return;
      }
      router.push(`/l/${data.league.slug}/admin`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app max-w-lg space-y-6 py-6">
      <div>
        <Link href="/leagues" className="text-sm text-emerald-700">
          ← Leagues
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Create a league</h1>
        <p className="text-sm text-slate-500">You will be the owner and can invite others.</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block">
          <span className="text-sm font-medium">League name *</span>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="input mt-1"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Country</span>
            <input
              className="input mt-1"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Region / city</span>
            <input
              className="input mt-1"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Visibility</span>
          <select
            className="input mt-1"
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          >
            <option value="PUBLIC">Public — anyone can find & join</option>
            <option value="INVITE_ONLY">Invite only — needs code</option>
            <option value="PRIVATE">Private — invite code required</option>
          </select>
        </label>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Create league"}
        </button>
      </form>
    </div>
  );
}
