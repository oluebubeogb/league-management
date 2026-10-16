"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"identify" | "reset">("identify");
  const [identifier, setIdentifier] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          identifier,
          birthYear: Number(birthYear),
        }),
      });
      const data = await res.json();
      // Always show generic message
      setMsg(data.message || "If the details match, a recovery step is available.");
      if (data.token) {
        // Dev/demo: token returned only when recovery is available without SMS
        setToken(data.token);
        setStep("reset");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      setMsg("Password updated. You can log in.");
      setStep("identify");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-bold">Account recovery</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fan accounts only. No SMS provider is configured; recovery uses username/phone + year of
          birth with rate limiting. An SMS/OTP provider can be added later.
        </p>

        {step === "identify" ? (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <div>
              <label className="label">Username or phone</label>
              <input
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Year of birth</label>
              <input
                type="number"
                className="input"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                required
                min={1940}
                max={2015}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={doReset} className="mt-6 space-y-4">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              Set new password
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-emerald-600 underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
