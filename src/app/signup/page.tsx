"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Join the fan community</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Letters, numbers and underscore only"
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              className="input"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
              type="tel"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="label" htmlFor="birthYear">
              Year of birth
            </label>
            <input
              id="birthYear"
              type="number"
              className="input"
              value={form.birthYear}
              onChange={(e) => update("birthYear", e.target.value)}
              required
              min={1940}
              max={2015}
            />
            <p className="mt-1 text-xs text-slate-400">
              Used only for account recovery. Not shown publicly.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
