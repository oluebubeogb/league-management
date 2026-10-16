import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAIEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminAIPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) redirect("/login");

  const analyses = await prisma.aIAnalysis.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });

  return (
    <div className="container-app space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI analysis</h1>
          <p className="text-sm text-slate-500">
            Status: {isAIEnabled() ? "Enabled" : "Disabled (set AI_ENABLED + LLM_* env vars)"}
          </p>
        </div>
        <a href="/admin" className="btn-secondary text-sm">← Dashboard</a>
      </div>

      {analyses.length === 0 ? (
        <p className="card p-6 text-center text-sm text-slate-500">
          No analyses yet. Use the API or future generate buttons once RunPod is configured.
        </p>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{a.analysisType} · {a.status}</span>
                <span>{a.generatedAt?.toISOString().slice(0, 16) || "—"}</span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm text-slate-700">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
