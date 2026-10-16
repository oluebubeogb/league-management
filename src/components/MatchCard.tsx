import Link from "next/link";
import { formatMatchDate, formatMatchTime, statusLabel, statusColor } from "@/lib/utils";
import { TeamFlag } from "@/components/TeamFlag";

interface MatchCardProps {
  id: string;
  homeName: string;
  awayName: string;
  homeShort?: string | null;
  awayShort?: string | null;
  homeColor1?: string | null;
  homeColor2?: string | null;
  homeColor3?: string | null;
  awayColor1?: string | null;
  awayColor2?: string | null;
  awayColor3?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  htHome?: number | null;
  htAway?: number | null;
  status: string;
  kickoffAt?: Date | string | null;
  groupCode?: string | null;
  stage?: string;
  slotHome?: string | null;
  slotAway?: string | null;
}

export function MatchCard({
  id,
  homeName,
  awayName,
  homeColor1,
  homeColor2,
  homeColor3,
  awayColor1,
  awayColor2,
  awayColor3,
  homeScore,
  awayScore,
  htHome,
  htAway,
  status,
  kickoffAt,
  groupCode,
  stage,
  slotHome,
  slotAway,
}: MatchCardProps) {
  const displayHome = homeName || slotHome || "TBD";
  const displayAway = awayName || slotAway || "TBD";
  const isFinished = status === "FULL_TIME";
  const showScore = isFinished || status === "LIVE" || status === "HALF_TIME";

  return (
    <Link
      href={`/matches/${id}`}
      className="card block max-w-full overflow-hidden p-3 transition hover:border-emerald-300 hover:shadow-md sm:p-4"
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2 text-[11px] text-slate-500 sm:mb-3 sm:text-xs">
        <span className="min-w-0 truncate">
          {groupCode ? `Group ${groupCode}` : stage?.replace(/_/g, " ")}
          {kickoffAt && ` · ${formatMatchDate(kickoffAt)}`}
        </span>
        <span className={`badge shrink-0 ${statusColor(status)}`}>{statusLabel(status)}</span>
      </div>

      {/* Mobile-safe grid: home | score | away */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-right text-xs font-semibold text-slate-900 sm:text-sm">
            {displayHome}
          </span>
          <TeamFlag
            color1={homeColor1}
            color2={homeColor2}
            color3={homeColor3}
            size="sm"
            title={displayHome}
          />
        </div>

        <div className="flex w-12 shrink-0 flex-col items-center sm:w-16">
          {showScore ? (
            <>
              <span className="text-base font-bold tabular-nums text-slate-900 sm:text-xl">
                {homeScore ?? 0}–{awayScore ?? 0}
              </span>
              {(htHome != null || htAway != null) && (
                <span className="text-[9px] text-slate-400 sm:text-[10px]">
                  HT {htHome ?? 0}–{htAway ?? 0}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 sm:text-xs">
              {formatMatchTime(kickoffAt)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <TeamFlag
            color1={awayColor1}
            color2={awayColor2}
            color3={awayColor3}
            size="sm"
            title={displayAway}
          />
          <span className="truncate text-xs font-semibold text-slate-900 sm:text-sm">{displayAway}</span>
        </div>
      </div>
    </Link>
  );
}
