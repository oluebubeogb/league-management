"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [form, setForm] = useState({ username: "", phone: "", birthYear: "", token: "", password: "" });
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");

  async function requestToken(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/auth/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        phone: form.phone,
        birthYear: Number(form.birthYear),
      }),
    });
    const data = await res.json();
    setMsg(data.message || data.error || "Done");
    if (data.recoveryToken) {
      setToken(data.recoveryToken);
      setStep("reset");
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/auth/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: form.token || token, password: form.password }),
    });
    const data = await res.json();
    if (res.ok) setMsg("Password updated. You can log in.");
    else setMsg(data.error || "Failed");
  }

  return (
    <div className="container-app max-w-md space-y-6 py-10">
      <h1 className="text-2xl font-bold">Password recovery</h1>
      <p className="text-sm text-slate-500">
        Fan accounts only. No SMS yet — in development a token may be returned for testing.
      </p>
      {msg && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm">{msg}</p>}
      {step === "request" ? (
        <form onSubmit={requestToken} className="card space-y-3">
          <input className="input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className="input" type="number" placeholder="Birth year" value={form.birthYear} onChange={(e) => setForm({ ...form, birthYear: e.target.value })} required />
          <button type="submit" className="btn-primary w-full">Request recovery</button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="card space-y-3">
          <input className="input" placeholder="Recovery token" value={form.token || token} onChange={(e) => setForm({ ...form, token: e.target.value })} required />
          <input className="input" type="password" placeholder="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
          <button type="submit" className="btn-primary w-full">Set new password</button>
        </form>
      )}
      <Link href="/login" className="text-sm text-emerald-700">Back to login</Link>
    </div>
  );
}
