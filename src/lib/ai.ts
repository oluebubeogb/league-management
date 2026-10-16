import { isAIEnabled } from "./env";
import { prisma } from "./db";

/**
 * RunPod OpenAI-compatible client.
 * Keys never leave the server.
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; model: string } | null> {
  if (!isAIEnabled()) return null;

  const baseUrl = process.env.LLM_BASE_URL!.replace(/\/$/, "");
  const apiKey = process.env.LLM_API_KEY!;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const timeout = Number(process.env.LLM_TIMEOUT_SECONDS || 120) * 1000;
  const maxTokens = Number(process.env.LLM_MAX_OUTPUT_TOKENS || 1500);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty LLM response");
    return { content, model: data.model || model };
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM = `You are a football analyst for League Management (Nigeria).
Rules:
- Only use facts provided in the user message. Never invent goals, scorers, cards, lineups, injuries or statistics.
- If data is missing, say so clearly.
- Separate recorded facts from estimates/opinions.
- Do not claim predictions guarantee results.
- Keep language clear, respectful and suitable for a community league audience.
- Never mention betting, gambling or financial stakes.`;

export async function generateMatchPreview(matchId: string): Promise<string | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      group: true,
    },
  });
  if (!match) return null;

  const homeName = match.homeTeam?.name || match.homeSlot || "TBD";
  const awayName = match.awayTeam?.name || match.awaySlot || "TBD";

  const prompt = `Write a short pre-match preview (max 250 words) for:
Match: ${homeName} vs ${awayName}
Stage: ${match.stage}
Group: ${match.group?.code || "N/A"}
Date: ${match.kickoffAt?.toISOString() || "TBC"}
Status: ${match.status}

Only use the information above. Do not invent form, injuries or head-to-head history.`;

  const result = await callLLM(SYSTEM, prompt);
  return result?.content ?? null;
}

export async function generatePostMatchAnalysis(matchId: string): Promise<string | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      group: true,
      events: {
        include: { player: true, team: true },
        orderBy: { minute: "asc" },
      },
    },
  });
  if (!match || match.status !== "FULL_TIME") return null;

  const homeName = match.homeTeam?.name || "Home";
  const awayName = match.awayTeam?.name || "Away";
  const score = `${match.fullTimeHomeScore ?? 0}-${match.fullTimeAwayScore ?? 0}`;

  const eventLines = match.events.map((e) => {
    const player = e.player?.fullName || "Unknown";
    const team = e.team?.name || "";
    return `${e.minute ?? "?"}': ${e.eventType} — ${player} (${team})${e.ownGoal ? " [OG]" : ""}`;
  });

  const prompt = `Write a post-match analysis (max 300 words) based ONLY on verified data:

${homeName} ${score} ${awayName}
Stage: ${match.stage}
HT: ${match.halfTimeHomeScore ?? "?"}-${match.halfTimeAwayScore ?? "?"}

Events:
${eventLines.length ? eventLines.join("\n") : "No detailed events recorded."}

Do not invent any additional scorers, cards or incidents.`;

  const result = await callLLM(SYSTEM, prompt);
  return result?.content ?? null;
}

export async function enqueueAIJob(type: string, payload: Record<string, unknown>) {
  return prisma.aIJob.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      status: "QUEUED",
    },
  });
}
