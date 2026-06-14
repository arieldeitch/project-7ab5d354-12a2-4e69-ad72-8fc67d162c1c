/**
 * Translate API-Football event types into Hebrew, child-friendly labels.
 */

export type RawEvent = {
  event_type: string;
  detail?: string | null;
  player_name?: string | null;
  minute?: number | null;
  extra_time?: number | null;
};

export function eventIcon(e: { event_type: string; detail?: string | null }): string {
  const t = (e.event_type ?? "").toLowerCase();
  const d = (e.detail ?? "").toLowerCase();
  if (t === "goal") {
    if (d.includes("own")) return "🥅";
    if (d.includes("missed") || d.includes("missed penalty")) return "❌";
    if (d.includes("penalty")) return "🎯";
    return "⚽";
  }
  if (t === "card") {
    if (d.includes("red")) return "🟥";
    return "🟨";
  }
  if (t === "subst") return "🔄";
  if (t === "var") return "🎥";
  return "•";
}

export function eventLabelHe(e: { event_type: string; detail?: string | null }): string {
  const t = (e.event_type ?? "").toLowerCase();
  const d = (e.detail ?? "").toLowerCase();
  if (t === "goal") {
    if (d.includes("own")) return "שער עצמי";
    if (d.includes("missed")) return "פנדל שהוחמץ";
    if (d.includes("penalty")) return "שער מפנדל";
    return "שער";
  }
  if (t === "card") return d.includes("red") ? "כרטיס אדום" : "כרטיס צהוב";
  if (t === "subst") return "חילוף";
  if (t === "var") return "ביקורת וידאו";
  return "אירוע לא ידוע";
}

export function parsePlayerName(playerName: string | null | undefined): { scorer: string | null; assist: string | null } {
  if (!playerName) return { scorer: null, assist: null };
  const sep = playerName.indexOf("::");
  if (sep === -1) return { scorer: playerName, assist: null };
  return { scorer: playerName.slice(0, sep) || null, assist: playerName.slice(sep + 2) || null };
}

export function formatMinute(minute: number | null | undefined, extra: number | null | undefined): string {
  if (minute == null) return "";
  if (extra && extra > 0) return `${minute}+${extra}'`;
  return `${minute}'`;
}

/** Hebrew label for API-Football short status codes. */
export function liveStatusLabelHe(short?: string | null): string | null {
  switch ((short ?? "").toUpperCase()) {
    case "1H":
      return "מחצית ראשונה";
    case "HT":
      return "מחצית";
    case "2H":
      return "מחצית שניה";
    case "ET":
      return "הארכה";
    case "BT":
      return "הפסקת הארכה";
    case "P":
      return "פנדלים";
    case "LIVE":
      return "בשידור חי";
    default:
      return null;
  }
}