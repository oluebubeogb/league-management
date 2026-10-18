/** Lightweight env helpers — secrets validated at use-time in auth. */

export function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}
