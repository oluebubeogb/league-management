"use client";

import { useEffect, useState } from "react";

type Tx = {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  createdAt: string;
};

export function WalletClient() {
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/wallet");
    if (!res.ok) return;
    const data = await res.json();
    setBalance(data.balance);
    setTxs(data.transactions || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function topUp() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mock_topup", amount: 500 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setBalance(data.balance);
      setMsg("+500 coins (mock)");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Virtual wallet</h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
          {balance == null ? "…" : `${balance.toLocaleString()} coins`}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Entertainment only — no real money. Starter bonus on first visit. Mock top-up for testing.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={topUp}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Mock top-up (+500)
      </button>
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {txs.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
          {txs.map((t) => (
            <li key={t.id} className="flex justify-between gap-2 border-b border-slate-50 py-1">
              <span>
                {t.type}
                {t.note ? ` — ${t.note}` : ""}
              </span>
              <span className={t.amount >= 0 ? "text-emerald-700" : "text-red-600"}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
