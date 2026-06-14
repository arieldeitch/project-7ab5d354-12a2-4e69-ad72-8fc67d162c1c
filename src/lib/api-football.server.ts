/**
 * API-Football (api-sports.io) integration — server-only.
 * Uses x-apisports-key header. Works with both direct and RapidAPI keys.
 */

import { flagCdnUrl } from "./team-names";

const BASE = "https://v3.football.api-sports.io";
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

function getKey(): string {
  const k = process.env.API_FOOTBALL_KEY;
  if (!k) throw new Error("API_FOOTBALL_KEY is not configured");
  return k;
}

async function af<T = unknown>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": getKey() },
  });
  if (!res.ok) {
    throw new Error(`API-Football ${path} failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as { response: T; errors?: unknown };
  if (json.errors && typeof json.errors === "object" && Object.keys(json.errors as object).length > 0) {
    console.warn("API-Football errors", json.errors);
  }
  return json.response;
}

export type AfTeam = {
  team: { id: number; name: string; code?: string; logo?: string };
  venue?: { name?: string; city?: string };
};

export type AfFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed: number | null };
    venue?: { name?: string; city?: string };
  };
  league: { round?: string };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  goals: { home: number | null; away: number | null };
  score?: { halftime?: { home: number | null; away: number | null } };
};

export type AfStanding = {
  league: {
    standings: Array<
      Array<{
        rank: number;
        team: { id: number; name: string; logo?: string };
        points: number;
        goalsDiff: number;
        all: {
          played: number;
          win: number;
          draw: number;
          lose: number;
          goals: { for: number; against: number };
        };
        group: string;
      }>
    >;
  };
};

export type AfTopScorer = {
  player: { id: number; name: string; photo?: string; nationality?: string };
  statistics: Array<{ team: { id: number; name: string }; games?: { position?: string }; goals?: { total?: number } }>;
};

export type AfEvent = {
  time: { elapsed: number | null };
  team: { id: number };
  player: { id: number | null; name: string | null };
  type: string;
  detail: string;
};

export const apiFootball = {
  teams: () => af<AfTeam[]>("/teams", { league: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON }),
  fixtures: () => af<AfFixture[]>("/fixtures", { league: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON }),
  liveFixtures: () =>
    af<AfFixture[]>("/fixtures", { league: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON, live: "all" }),
  fixtureById: (id: number) => af<AfFixture[]>("/fixtures", { id }),
  standings: () => af<AfStanding[]>("/standings", { league: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON }),
  topScorers: () => af<AfTopScorer[]>("/players/topscorers", { league: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON }),
  events: (fixtureId: number) => af<AfEvent[]>("/fixtures/events", { fixture: fixtureId }),
};

/**
 * Convert API-Football round string into our tournament_stage enum.
 * Examples: "Group Stage - 1", "Round of 16", "Quarter-finals", "Semi-finals",
 * "3rd Place Final", "Final"
 */
export function stageFromRound(round?: string): string {
  if (!round) return "group";
  const r = round.toLowerCase();
  if (r.includes("group")) return "group";
  if (r.includes("32")) return "round_of_32";
  if (r.includes("16")) return "round_of_16";
  if (r.includes("quarter")) return "quarter_final";
  if (r.includes("semi")) return "semi_final";
  if (r.includes("3rd") || r.includes("third")) return "third_place";
  if (r.includes("final")) return "final";
  return "group";
}

export function statusFromApi(short: string): string {
  switch (short) {
    case "NS":
    case "TBD":
      return "scheduled";
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "LIVE":
      return "live";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled";
    default:
      return "scheduled";
  }
}

export function flagUrl(code?: string): string | null {
  if (!code) return null;
  return flagCdnUrl(code) ?? `https://media.api-sports.io/flags/${code.toLowerCase()}.svg`;
}