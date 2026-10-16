"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateAdminForm } from "@/components/CreateAdminForm";

export type AdminRow = {
  id: string;
  username: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
};

export function AdminAccountsManager({
  admins,
  primaryId,
}: {
  admins: AdminRow[];
  primaryId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    status: "ACTIVE" as "ACTIVE" | "DISABLED",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function startEdit(a: AdminRow) {
    setEditing(a.id);
    setForm({
      username: a.username,
      phone: a.phone,
      password: "",
      status: (a.status as "ACTIVE" | "DISABLED") || "ACTIVE",
    });
    setMsg("");
  }

  async function save() {
    if (!editing) return;
    setLoading(true);
    setMsg("");
    try {
      const body: Record<string, unknown> = {
        adminId: editing,
        username: form.username,
        phone: form.phone,
        status: form.status,
      };
      if (form.password.trim().length >= 8) {
        body.password = form.password.trim();
      }
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg("Saved");
      setEditing(null);
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="card divide-y divide-slate-100">
        {admins.map((a) => {
          const isPrimary = a.role === "PRIMARY_ADMIN" || a.id === primaryId;
          const isEditing = editing === a.id;
          return (
            <div key={a.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {a.username}
                    {isPrimary && (
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        PRIMARY
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.role} · {a.phone} · {a.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{a.createdAt}</span>
                  {!isPrimary && (
                    <button
                      type="button"
                      className="btn-secondary text-xs py-1 px-2"
                      onClick={() => (isEditing ? setEditing(null) : startEdit(a))}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Username</label>
                      <input
                        className="input"
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input
                        className="input"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">New password (optional)</label>
                      <input
                        className="input"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to keep current"
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select
                        className="input"
                        value={form.status}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            status: e.target.value as "ACTIVE" | "DISABLED",
                          }))
                        }
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      disabled={loading}
                      onClick={save}
                    >
                      {loading ? "Saving…" : "Save changes"}
                    </button>
                    {msg && (
                      <span
                        className={`text-xs ${
                          msg === "Saved" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {msg}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Create secondary admin</h2>
        <CreateAdminForm />
      </section>
    </div>
  );
}
