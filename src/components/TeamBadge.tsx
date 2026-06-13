import { useState } from "react";
import { teamInitials, teamLabel } from "@/lib/team-names";

type Team = {
  id?: number;
  name?: string | null;
  name_he?: string | null;
  code?: string | null;
  flag_url?: string | null;
  logo_url?: string | null;
} | null | undefined;

/**
 * Circular team badge with flag + automatic Hebrew-initials fallback.
 * Keeps a stable footprint to prevent layout shift.
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
  const [errored, setErrored] = useState(false);
  const src = !errored ? (team?.flag_url ?? team?.logo_url ?? "") : "";

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
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="text-gold">{teamInitials(team)}</span>
      )}
    </div>
  );
}