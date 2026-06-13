import { eventIcon, eventLabelHe, formatMinute } from "@/lib/event-labels";
import { teamLabel } from "@/lib/team-names";

type Ev = {
  id: number;
  event_type: string;
  detail?: string | null;
  minute?: number | null;
  extra_time?: number | null;
  player_name?: string | null;
  team?: { name?: string | null; name_he?: string | null; code?: string | null } | null;
};

export function MatchTimeline({ events }: { events: Ev[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-3">
        אין עדיין אירועים במשחק
      </div>
    );
  }
  return (
    <ol className="relative border-r-2 border-border pr-4 space-y-2.5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -right-[1.4rem] top-0.5 text-base leading-none">
            {eventIcon(e)}
          </span>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="text-gold font-black tabular-nums text-xs w-12 shrink-0">
              {formatMinute(e.minute, e.extra_time)}
            </span>
            <span className="font-bold truncate">
              {e.player_name ?? eventLabelHe(e)}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground mr-14">
            {eventLabelHe(e)}
            {e.team ? ` · ${teamLabel(e.team)}` : ""}
          </div>
        </li>
      ))}
    </ol>
  );
}