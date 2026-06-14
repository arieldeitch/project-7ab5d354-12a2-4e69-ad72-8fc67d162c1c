import type { ReactNode } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { teamLabel } from "@/lib/team-names";
import { liveStatusLabelHe } from "@/lib/event-labels";
import { stadiumHe, cityHe } from "@/lib/venue-names";

type Team = { id: number; name: string; name_he?: string | null; flag_url?: string | null; logo_url?: string | null; code?: string | null };

export type MatchRow = {
  id: number;
  kickoff_at: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  home_score: number | null;
  away_score: number | null;
  stadium?: string | null;
  city?: string | null;
  minute?: number | null;
  live_status?: string | null;
  stage?: string;
  home_team?: Team | null;
  away_team?: Team | null;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(d);
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("he-IL", { weekday: "short", day: "numeric", month: "short" }).format(d);
}

function TeamSide({ team, winner, loser }: { team?: Team | null; winner?: boolean; loser?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0 flex-1">
      <div className={"relative " + (winner ? "drop-shadow-[0_0_8px_var(--gold)]" : "")}>
        <TeamBadge team={team} size={56} />
        {winner && (
          <span className="absolute -top-1 -right-1 text-base leading-none">🏆</span>
        )}
      </div>
      <div
        className={
          "text-sm text-center w-full truncate " +
          (winner ? "font-black text-gold" : loser ? "font-bold text-muted-foreground" : "font-bold")
        }
        title={teamLabel(team)}
      >
        {teamLabel(team)}
      </div>
    </div>
  );
}

export function MatchCard({
  match,
  footer,
  onClick,
  highlight,
}: {
  match: MatchRow;
  footer?: ReactNode;
  onClick?: () => void;
  highlight?: boolean;
}) {
  const isLive = match.status === "live";
  const liveLabel = liveStatusLabelHe(match.live_status);
  const isHT = (match.live_status ?? "").toUpperCase() === "HT";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  const hs = match.home_score ?? 0;
  const as_ = match.away_score ?? 0;
  const homeWon = isFinished && hs > as_;
  const awayWon = isFinished && as_ > hs;
  const isDraw = isFinished && hs === as_;

  // Venue labels — prefer Hebrew translation, fall back to API string
  const stadiumLabel = stadiumHe(match.stadium) ?? match.stadium;
  const cityLabel = cityHe(match.city) ?? match.city;

  return (
    <div
      onClick={onClick}
      className={
        "card-stadium p-4 transition-all " +
        (onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98] " : "") +
        (highlight ? "ring-2 ring-secondary animate-shimmer-gold " : "") +
        (isLive ? "border-accent ring-1 ring-accent/60 " : "") +
        (isFinished ? "bg-card/60 " : "")
      }
    >
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-muted-foreground">{fmtDate(match.kickoff_at)}</span>
        {isLive ? (
          isHT ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold text-gold-foreground font-bold">
              ⏱️ מחצית
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-bold">
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              חי {match.minute ? `${match.minute}'` : ""}
              {liveLabel && !isHT ? ` · ${liveLabel}` : ""}
            </span>
          )
        ) : isFinished ? (
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">הסתיים</span>
        ) : (
          <span className="text-gold font-bold">{fmtTime(match.kickoff_at)}</span>
        )}
      </div>

      {/*
       * RTL layout note: the parent <html dir="rtl"> reverses flex order.
       * DOM order [home, score, away] renders visually as [away | score | home].
       * Score must show away_score on the left to match the left team.
       * Display: {as_} - {hs} → reads "away_score - home_score" left to right.
       */}
      <div className="flex items-center gap-2">
        <TeamSide team={match.home_team} winner={homeWon} loser={awayWon} />
        <div className="flex flex-col items-center min-w-[72px]">
          {isScheduled ? (
            <span className="text-3xl font-extrabold text-muted-foreground">VS</span>
          ) : (
            <>
              <div
                dir="ltr"
                className="text-3xl font-black tabular-nums tracking-tighter text-gold whitespace-nowrap"
              >
                <span>{as_}</span>
                <span className="text-muted-foreground mx-1">-</span>
                <span>{hs}</span>
              </div>
              {isDraw && <span className="text-[10px] font-bold text-muted-foreground mt-0.5">תיקו</span>}
            </>
          )}
        </div>
        <TeamSide team={match.away_team} winner={awayWon} loser={homeWon} />
      </div>

      {stadiumLabel && (
        <div className="mt-3 text-center text-xs text-muted-foreground truncate">
          🏟️ {stadiumLabel}
          {cityLabel ? ` · ${cityLabel}` : ""}
        </div>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

export function CountdownBadge({ kickoff }: { kickoff: string }) {
  const ms = new Date(kickoff).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold">
      ⏱ {h > 0 ? `${h}ש ${m}ד` : `${m}ד`} לשריקת הפתיחה
    </span>
  );
}
