"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinLeagueButton({ leagueId, slug }: { leagueId: string; slug: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function join() {
    setLoading(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId }),
      });
      if (res.ok) {
        router.push(`/l/${slug}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn-secondary text-sm" onClick={join} disabled={loading}>
      {loading ? "Joining…" : "Join league"}
    </button>
  );
}
