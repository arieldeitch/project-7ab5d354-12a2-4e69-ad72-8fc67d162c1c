/**
 * Centralized Hebrew translation layer for teams.
 * Keys are API-Football 3-letter country codes (uppercase).
 * Use teamLabel(team) anywhere a team name is displayed.
 */

export const TEAM_HE_BY_CODE: Record<string, string> = {
  ALG: "אלג'יריה",
  ARG: "ארגנטינה",
  AUS: "אוסטרליה",
  AUT: "אוסטריה",
  BEL: "בלגיה",
  BIH: "בוסניה והרצגובינה",
  BRA: "ברזיל",
  CAN: "קנדה",
  CPV: "כף ורדה",
  COL: "קולומביה",
  CGO: "קונגו",
  CRO: "קרואטיה",
  CUR: "קוראסאו",
  CZE: "צ'כיה",
  ECU: "אקוודור",
  EGY: "מצרים",
  ENG: "אנגליה",
  FRA: "צרפת",
  GER: "גרמניה",
  GHA: "גאנה",
  HAI: "האיטי",
  IRN: "איראן",
  IRQ: "עיראק",
  CIV: "חוף השנהב",
  JPN: "יפן",
  JOR: "ירדן",
  MEX: "מקסיקו",
  MAR: "מרוקו",
  NED: "הולנד",
  NZL: "ניו זילנד",
  NOR: "נורווגיה",
  PAN: "פנמה",
  PAR: "פרגוואי",
  POR: "פורטוגל",
  QAT: "קטאר",
  KSA: "ערב הסעודית",
  SCO: "סקוטלנד",
  SEN: "סנגל",
  RSA: "דרום אפריקה",
  KOR: "דרום קוריאה",
  ESP: "ספרד",
  SWE: "שוודיה",
  SUI: "שווייץ",
  TUN: "תוניסיה",
  TUR: "טורקיה",
  URU: "אורוגוואי",
  USA: "ארצות הברית",
  UZB: "אוזבקיסטן",
  // Additional likely qualifiers
  ITA: "איטליה",
  WAL: "ויילס",
  IRL: "אירלנד",
  POL: "פולין",
  DEN: "דנמרק",
  SRB: "סרביה",
  CHI: "צ'ילה",
  PER: "פרו",
  VEN: "ונצואלה",
  BOL: "בוליביה",
  CRC: "קוסטה ריקה",
  JAM: "ג'מייקה",
  HON: "הונדורס",
  NGA: "ניגריה",
  CMR: "קמרון",
  KEN: "קניה",
  UGA: "אוגנדה",
  ANG: "אנגולה",
  ZAM: "זמביה",
  MLI: "מאלי",
  BFA: "בורקינה פאסו",
  CHN: "סין",
  THA: "תאילנד",
  VIE: "וייטנאם",
  PLE: "פלסטין",
  LBN: "לבנון",
  SYR: "סוריה",
  OMA: "עומאן",
  UAE: "איחוד האמירויות",
  BHR: "בחריין",
  KUW: "כווית",
  ISR: "ישראל",
};

type AnyTeam = {
  name?: string | null;
  name_he?: string | null;
  code?: string | null;
} | null | undefined;

/** Best-available Hebrew label for a team. */
export function teamLabel(team: AnyTeam, fallback = "—"): string {
  if (!team) return fallback;
  if (team.name_he && team.name_he.trim().length > 0) return team.name_he;
  if (team.code && TEAM_HE_BY_CODE[team.code.toUpperCase()]) {
    return TEAM_HE_BY_CODE[team.code.toUpperCase()];
  }
  return team.name ?? fallback;
}

/** Hebrew initials (1-2 chars) for fallback circular badge. */
export function teamInitials(team: AnyTeam): string {
  const label = teamLabel(team, "");
  if (!label) return "⚽";
  // First meaningful character + optional second word's first
  const parts = label.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  return label.slice(0, 2);
}