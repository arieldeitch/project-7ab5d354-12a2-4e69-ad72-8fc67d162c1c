import type { ReactNode } from "react";

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

function TeamSide({ team }: { team?: Team | null }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0 flex-1">
      <div className="h-14 w-14 rounded-full bg-card border-2 border-border overflow-hidden flex items-center justify-center text-2xl">
        {team?.flag_url || team?.logo_url ? (
          <img src={team.flag_url ?? team.logo_url ?? ""} alt={team?.name ?? ""} className="h-full w-full object-cover" />
        ) : (
          <span>🏳️</span>
        )}
      </div>
      <div className="text-sm font-bold text-center truncate w-full" title={team?.name}>
        {team?.name_he ?? team?.name ?? "—"}
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
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  return (
    <div
      onClick={onClick}
      className={
        "card-stadium p-4 transition-all " +
        (onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98] " : "") +
        (highlight ? "ring-2 ring-secondary animate-shimmer-gold " : "") +
        (isLive ? "border-accent " : "")
      }
    >
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-muted-foreground">{fmtDate(match.kickoff_at)}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-bold">
            <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
            LIVE {match.minute ? `${match.minute}'` : ""}
          </span>
        ) : isFinished ? (
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">הסתיים</span>
        ) : (
          <span className="text-gold font-bold">{fmtTime(match.kickoff_at)}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TeamSide team={match.home_team} />
        <div className="flex flex-col items-center min-w-[64px]">
          {isScheduled ? (
            <span className="text-3xl font-extrabold text-muted-foreground">VS</span>
          ) : (
            <div className="text-3xl font-black tabular-nums tracking-tighter text-gold">
              {match.home_score ?? 0}
              <span className="text-muted-foreground mx-1">-</span>
              {match.away_score ?? 0}
            </div>
          )}
        </div>
        <TeamSide team={match.away_team} />
      </div>

      {match.stadium && (
        <div className="mt-3 text-center text-xs text-muted-foreground truncate">
          🏟️ {match.stadium}
          {match.city ? ` · ${match.city}` : ""}
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