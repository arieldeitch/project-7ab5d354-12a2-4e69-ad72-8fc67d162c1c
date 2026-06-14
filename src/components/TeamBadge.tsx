import { useState, useEffect } from "react";
import { teamInitials, teamLabel, flagCdnUrl } from "@/lib/team-names";

type Team = {
  id?: number;
  name?: string | null;
  name_he?: string | null;
  code?: string | null;
  flag_url?: string | null;
  logo_url?: string | null;
} | null | undefined;

/**
 * Circular team badge with 3-source flag fallback:
 *   stored flag_url → stored logo_url → FlagCDN (computed from code) → Hebrew initials
 */
export function TeamBadge({
  team,
  size = 56,
  className = "",
}: {
  team: Team;
  size?: number;
  className?: string;
}) {
  const [srcIndex, setSrcIndex] = useState(0);

  // Rebuild source list when team changes and reset index
  const sources = [
    team?.flag_url,
    team?.logo_url,
    flagCdnUrl(team?.code),
  ].filter((s): s is string => Boolean(s));

  useEffect(() => {
    setSrcIndex(0);
  }, [team?.id, team?.code]);

  const src = srcIndex < sources.length ? sources[srcIndex] : null;

  return (
    <div
      className={
        "shrink-0 rounded-full overflow-hidden bg-card border-2 border-border grid place-items-center font-black text-foreground " +
        className
      }
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-label={teamLabel(team)}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setSrcIndex((i) => i + 1)}
        />
      ) : (
        <span className="text-gold">{teamInitials(team)}</span>
      )}
    </div>
  );
}
