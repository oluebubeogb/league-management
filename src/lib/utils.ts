import { clsx, type ClassValue } from "clsx";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const LAGOS_TZ = "Africa/Lagos";

export function formatMatchDate(date: Date | string | null | undefined): string {
  if (!date) return "Date TBC";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, LAGOS_TZ, "EEE d MMM yyyy");
}

export function formatMatchTime(date: Date | string | null | undefined): string {
  if (!date) return "Time TBC";
  // We seed noon UTC as placeholder; if time is exactly 11:00 or 12:00 UTC treat as TBC
  const d = typeof date === "string" ? new Date(date) : date;
  const hours = d.getUTCHours();
  const mins = d.getUTCMinutes();
  // Legacy placeholder from early seed (11:00 UTC only)
  if (hours === 11 && mins === 0) return "Time TBC";
  return formatInTimeZone(d, LAGOS_TZ, "HH:mm");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "TBC";
  const d = typeof date === "string" ? new Date(date) : date;
  const time = formatMatchTime(d);
  if (time === "Time TBC") return formatMatchDate(d);
  return `${formatMatchDate(d)} · ${time}`;
}

export function teamInitials(name: string, shortName?: string | null): string {
  if (shortName) return shortName.slice(0, 3).toUpperCase();
  const parts = name.replace(/FC$/i, "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Scheduled",
    LIVE: "Live",
    HALF_TIME: "Half-time",
    FULL_TIME: "Full-time",
    POSTPONED: "Postponed",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "bg-slate-100 text-slate-700",
    LIVE: "bg-red-100 text-red-700",
    HALF_TIME: "bg-amber-100 text-amber-800",
    FULL_TIME: "bg-emerald-100 text-emerald-800",
    POSTPONED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-slate-200 text-slate-500",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export const SPONSOR =
  "High Chief Dickson Oguguo Nzenwa. Aku Bara-Oha 1 Of Ibeku Ancient Kingdom";

export const PREDICTION_DISCLAIMER =
  "Predictions are for entertainment only. No money or prizes are staked or paid through this platform.";
