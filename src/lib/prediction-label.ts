/** Human-readable prediction label e.g. "HOME — Ndume Okpu FC Win" */
export function formatPredictionLabel(opts: {
  type: string;
  selectedOutcome?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeName?: string | null;
  awayName?: string | null;
}): string {
  const home = opts.homeName || "Home";
  const away = opts.awayName || "Away";

  if (opts.type === "CORRECT_SCORE") {
    return `${opts.homeScore ?? "?"}–${opts.awayScore ?? "?"}`;
  }

  const o = (opts.selectedOutcome || "").toUpperCase();
  if (o === "HOME") return `HOME — ${home} Win`;
  if (o === "AWAY") return `AWAY — ${away} Win`;
  if (o === "DRAW") return `DRAW — Draw`;
  if (o === "HOME_DRAW" || o === "HOME_OR_DRAW") return `HOME/DRAW — ${home} or Draw`;
  if (o === "AWAY_DRAW" || o === "DRAW_OR_AWAY") return `DRAW/AWAY — Draw or ${away}`;
  if (o === "HOME_AWAY" || o === "HOME_OR_AWAY") return `HOME/AWAY — ${home} or ${away}`;
  return opts.selectedOutcome || opts.type;
}

export function formatPredDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  // Africa/Lagos display
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .replace(",", "");
  } catch {
    return date.toISOString().slice(0, 16);
  }
}
