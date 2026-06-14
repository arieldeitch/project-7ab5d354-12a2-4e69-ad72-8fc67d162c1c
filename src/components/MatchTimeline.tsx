import { eventIcon, eventLabelHe, formatMinute, parsePlayerName } from "@/lib/event-labels";
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

type Item =
  | { kind: "event"; ev: Ev }
  | { kind: "divider"; label: string; key: string };

export function MatchTimeline({ events, isFinished }: { events: Ev[]; isFinished?: boolean }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-3">
        אין עדיין אירועים במשחק
      </div>
    );
  }

  const items: Item[] = [];
  let htInserted = false;

  for (const ev of events) {
    if (!htInserted && (ev.minute ?? 0) > 45) {
      htInserted = true;
      items.push({ kind: "divider", label: "— מחצית —", key: "ht" });
    }
    items.push({ kind: "event", ev });
  }

  if (isFinished) {
    items.push({ kind: "divider", label: "— סיום —", key: "ft" });
  }

  return (
    <ol className="relative border-r-2 border-border pr-4 space-y-2.5">
      {items.map((item) => {
        if (item.kind === "divider") {
          return (
            <li key={item.key} className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-black text-muted-foreground shrink-0">{item.label}</span>
              <div className="flex-1 h-px bg-border" />
            </li>
          );
        }
        const e = item.ev;
        const { scorer, assist } = parsePlayerName(e.player_name);
        return (
          <li key={e.id} className="relative">
            <span className="absolute -right-[1.4rem] top-0.5 text-base leading-none">
              {eventIcon(e)}
            </span>
            <div className="flex items-baseline gap-2 text-sm">
              <span className="text-gold font-black tabular-nums text-xs w-12 shrink-0">
                {formatMinute(e.minute, e.extra_time)}
              </span>
              <span className="font-bold truncate">
                {scorer ?? eventLabelHe(e)}
              </span>
            </div>
            {assist && (
              <div className="text-[11px] text-muted-foreground mr-14">
                מסייע: {assist}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground mr-14">
              {eventLabelHe(e)}
              {e.team ? ` · ${teamLabel(e.team)}` : ""}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
