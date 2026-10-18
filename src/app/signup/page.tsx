"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    birthYear: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          phone: form.phone,
          password: form.password,
          birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }
      router.push("/leagues/new");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app flex max-w-md flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Already have one?{" "}
          <Link href="/login" className="font-medium text-emerald-700">
            Log in
          </Link>
        </p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Username</span>
          <input
            className="input mt-1"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            minLength={3}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input
            className="input mt-1"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            className="input mt-1"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Birth year (optional, for recovery)</span>
          <input
            type="number"
            className="input mt-1"
            value={form.birthYear}
            onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
            min={1940}
            max={2015}
          />
        </label>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
