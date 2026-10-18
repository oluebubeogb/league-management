"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinCodeClient() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function join() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      router.push(`/l/${data.league.slug}`);
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        className="input max-w-xs"
        placeholder="Invite code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button type="button" className="btn-primary" onClick={join} disabled={loading || !code}>
        Join
      </button>
      {msg && <p className="w-full text-sm text-red-600">{msg}</p>}
    </div>
  );
}
