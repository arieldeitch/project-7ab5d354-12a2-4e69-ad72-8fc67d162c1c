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

/** API-Football 3-letter code → ISO 3166-1 alpha-2 for FlagCDN. */
export const CODE_TO_ISO2: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be",
  BFA: "bf", BHR: "bh", BIH: "ba", BOL: "bo", BRA: "br",
  CAN: "ca", CGO: "cg", CHI: "cl", CHN: "cn", CIV: "ci",
  CMR: "cm", COL: "co", CPV: "cv", CRC: "cr", CRO: "hr",
  CUR: "cw", CZE: "cz", DEN: "dk", ECU: "ec", EGY: "eg",
  ENG: "gb-eng", ESP: "es", FRA: "fr", GER: "de", GHA: "gh",
  GUA: "gt", HAI: "ht", HON: "hn", IRL: "ie", IRN: "ir",
  IRQ: "iq", ISR: "il", ITA: "it", JAM: "jm", JOR: "jo",
  JPN: "jp", KEN: "ke", KOR: "kr", KSA: "sa", KUW: "kw",
  LBN: "lb", MAR: "ma", MEX: "mx", MLI: "ml", NED: "nl",
  NGA: "ng", NOR: "no", NZL: "nz", OMA: "om", PAN: "pa",
  PAR: "py", PER: "pe", PLE: "ps", POL: "pl", POR: "pt",
  QAT: "qa", RSA: "za", SCO: "gb-sct", SEN: "sn", SLV: "sv",
  SRB: "rs", SUI: "ch", SWE: "se", SYR: "sy", THA: "th",
  TUN: "tn", TUR: "tr", UAE: "ae", UGA: "ug", URU: "uy",
  USA: "us", UZB: "uz", VEN: "ve", VIE: "vn", WAL: "gb-wls",
  ZAM: "zm",
};

/** Returns a working FlagCDN URL for an API-Football 3-letter team code, or null. */
export function flagCdnUrl(code?: string | null): string | null {
  if (!code) return null;
  const iso2 = CODE_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;
  return `https://flagcdn.com/w160/${iso2}.png`;
}

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