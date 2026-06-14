import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* =========================================================
 * World Cup Challenge — Server Functions
 * All Supabase admin access is loaded inside .handler() to
 * keep server-only modules out of the client bundle.
 * =======================================================*/

/* ---------- Players ---------- */

export const getPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("players")
    .select("*")
    .order("age", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const ensureMyProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; age: number; displayName: string; avatarEmoji: string }) =>
    z
      .object({
        name: z.string(),
        age: z.number(),
        displayName: z.string(),
        avatarEmoji: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("name", data.name)
      .maybeSingle();
    if (!existing) {
      const { error } = await (supabaseAdmin.from("players") as any).insert({
        name: data.name,
        age: data.age,
        display_name: data.displayName,
        avatar_emoji: data.avatarEmoji,
        total_points: 0,
      });
      // Ignore unique-violation races (two tabs opening simultaneously)
      if (error && !String(error.message).includes("duplicate")) throw error;
    }
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { name: string }) => z.object({ name: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: player } = await supabaseAdmin
      .from("players")
      .select("*")
      .eq("name", data.name)
      .maybeSingle();
    if (!player) return null;

    const [{ data: medals }, { data: achs }, { data: bracket }, { data: scoresAgg }] = await Promise.all([
      supabaseAdmin.from("medals").select("kind").eq("player_id", player.id),
      supabaseAdmin.from("achievements").select("*").eq("player_id", player.id),
      supabaseAdmin.from("bracket_predictions").select("*").eq("player_id", player.id).maybeSingle(),
      supabaseAdmin
        .from("prediction_scores")
        .select("total_points,winner_points,score_points")
        .eq("player_id", player.id),
    ]);

    const goldCount = medals?.filter((m) => m.kind === "gold").length ?? 0;
    const silverCount = medals?.filter((m) => m.kind === "silver").length ?? 0;
    const bronzeCount = medals?.filter((m) => m.kind === "bronze").length ?? 0;

    return {
      player,
      stats: {
        totalPoints: player.total_points ?? 0,
        medals: { gold: goldCount, silver: silverCount, bronze: bronzeCount },
        achievementsCount: achs?.length ?? 0,
        bracketPoints: bracket?.total_bracket_points ?? 0,
        predictionsMade: scoresAgg?.length ?? 0,
        winnerHits: scoresAgg?.filter((s) => (s.winner_points ?? 0) > 0).length ?? 0,
        exactScores: scoresAgg?.filter((s) => (s.score_points ?? 0) >= 25).length ?? 0,
      },
      achievements: achs ?? [],
      bracket: bracket ?? null,
    };
  });

export const updatePlayerProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; favorite_team_id?: number | null; favorite_player_id?: number | null }) =>
    z
      .object({
        name: z.string(),
        favorite_team_id: z.number().nullable().optional(),
        favorite_player_id: z.number().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, number | null> = {};
    if (data.favorite_team_id !== undefined) patch.favorite_team_id = data.favorite_team_id;
    if (data.favorite_player_id !== undefined) patch.favorite_player_id = data.favorite_player_id;
    const sb = supabaseAdmin as unknown as { from: (t: string) => any };
    const { error } = await sb.from("players").update(patch).eq("name", data.name);
    if (error) throw error;
    return { ok: true };
  });

/* ---------- Teams / Players directories ---------- */

export const getTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("teams").select("*").order("name");
  return data ?? [];
});

export const searchFootballPlayers = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; teamId?: number | null }) =>
    z.object({ q: z.string().optional(), teamId: z.number().nullable().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("football_players").select("*").limit(50);
    if (data.q && data.q.length > 0) q = q.ilike("name", `%${data.q}%`);
    if (data.teamId) q = q.eq("team_id", data.teamId);
    const { data: rows } = await q;
    return rows ?? [];
  });

/* ---------- Matches ---------- */

export const getTodayMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const { data } = await supabaseAdmin
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
    .gte("kickoff_at", start.toISOString())
    .lt("kickoff_at", end.toISOString())
    .order("kickoff_at");
  return data ?? [];
});

export const getUpcomingMatches = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number }) => z.object({ limit: z.number().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .gte("kickoff_at", new Date().toISOString())
      .eq("status", "scheduled")
      .order("kickoff_at")
      .limit(data.limit ?? 20);
    return rows ?? [];
  });

export const getMatchesByStage = createServerFn({ method: "GET" })
  .inputValidator((d: { stage: string }) => z.object({ stage: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await (supabaseAdmin as any)
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .eq("stage", data.stage)
      .order("kickoff_at");
    return rows ?? [];
  });

export const getFinishedMatches = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number }) => z.object({ limit: z.number().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .eq("status", "finished")
      .order("kickoff_at", { ascending: false })
      .limit(data.limit ?? 20);
    return rows ?? [];
  });

/* ---------- Events ---------- */

export const getMatchEvents = createServerFn({ method: "GET" })
  .inputValidator((d: { matchId: number }) => z.object({ matchId: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("match_events")
      .select("*, team:teams(*)")
      .eq("match_id", data.matchId)
      .order("minute", { ascending: true })
      .order("extra_time", { ascending: true })
      .order("id", { ascending: true });
    return rows ?? [];
  });

export const getLiveMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
    .eq("status", "live")
    .order("kickoff_at");
  return data ?? [];
});

export const getRecentEvents = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number }) => z.object({ limit: z.number().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("match_events")
      .select(
        "*, team:teams(*), match:matches(id,status,minute,live_status,home_score,away_score,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*))",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 30);
    return rows ?? [];
  });

/**
 * Live-mode sync: fast path called every ~minute while matches are live.
 * Refreshes only currently-live (or just-finished) WC fixtures and pulls
 * their events. Recalculates scores when anything finishes.
 */
export async function syncLiveMatchesInternal(): Promise<{
  matches: number;
  events: number;
  finished: number;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { apiFootball, statusFromApi, stageFromRound } = await import("./api-football.server");

  // 1. Pull currently live WC fixtures
  const liveFx = await apiFootball.liveFixtures();

  // 2. Also re-pull any match that DB still thinks is live but API may have finished
  const { data: dbLive } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("status", "live");
  const liveIds = new Set<number>([
    ...liveFx.map((f) => f.fixture.id),
    ...(dbLive ?? []).map((m) => m.id),
  ]);

  // 3. Fetch per-fixture detail for accuracy on the ones DB had as live but API didn't return
  const extra: any[] = [];
  for (const id of liveIds) {
    if (liveFx.find((f) => f.fixture.id === id)) continue;
    try {
      const arr = await apiFootball.fixtureById(id);
      if (arr[0]) extra.push(arr[0]);
    } catch (e) {
      console.warn("fixtureById failed", id, e);
    }
  }
  const allFx = [...liveFx, ...extra];

  let finished = 0;
  if (allFx.length > 0) {
    const rows = allFx.map((f: any) => {
      const status = statusFromApi(f.fixture.status.short);
      if (status === "finished") finished++;
      return {
        id: f.fixture.id,
        external_id: String(f.fixture.id),
        stage: stageFromRound(f.league.round),
        home_team_id: f.teams.home.id,
        away_team_id: f.teams.away.id,
        kickoff_at: f.fixture.date,
        stadium: f.fixture.venue?.name ?? null,
        city: f.fixture.venue?.city ?? null,
        status,
        live_status: f.fixture.status.short ?? null,
        home_score: f.goals.home,
        away_score: f.goals.away,
        home_score_ht: f.score?.halftime?.home ?? null,
        away_score_ht: f.score?.halftime?.away ?? null,
        minute: f.fixture.status.elapsed,
      };
    });
    await (supabaseAdmin.from("matches") as any).upsert(rows, { onConflict: "id" });
  }

  // 4. Pull events for every live/just-finished match and upsert with dedup
  let eventCount = 0;
  for (const id of liveIds) {
    try {
      const events = await apiFootball.events(id);
      if (!events?.length) continue;
      const rows = events.map((e: any) => ({
        match_id: id,
        team_id: e.team?.id ?? null,
        player_id: e.player?.id ?? null,
        player_name: e.player?.name ?? null,
        minute: e.time?.elapsed ?? null,
        extra_time: e.time?.extra ?? null,
        event_type: e.type ?? "Unknown",
        detail: e.detail ?? null,
      }));
      // Dedup index makes upsert idempotent
      const { error } = await (supabaseAdmin.from("match_events") as any).upsert(rows, {
        onConflict:
          "match_id,event_type,team_id,player_id,minute,extra_time,detail",
        ignoreDuplicates: true,
      });
      if (error) {
        // Fallback: ignore unique violation
        if (!String(error.message).includes("duplicate")) console.warn("events upsert", error);
      }
      eventCount += rows.length;
    } catch (e) {
      console.warn("events fetch failed", id, e);
    }
  }

  // 5. If anything just finished, recalc scoring (cheap: only finished matches)
  if (finished > 0) {
    await recalcAllScoresInternal();
  }

  return { matches: allFx.length, events: eventCount, finished };
}

export const refreshLiveMatches = createServerFn({ method: "POST" }).handler(async () => {
  const result = await syncLiveMatchesInternal();
  return result;
});

export const getStandings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("standings")
    .select("*, team:teams(*)")
    .order("group_code")
    .order("rank");
  return data ?? [];
});

export const getMatchesByGroup = createServerFn({ method: "GET" })
  .inputValidator((d: { group: string }) => z.object({ group: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await (supabaseAdmin as any)
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .eq("group_code", data.group)
      .order("kickoff_at");
    return rows ?? [];
  });

/* ---------- Predictions ---------- */

export const getMyPredictions = createServerFn({ method: "GET" })
  .inputValidator((d: { playerName: string }) => z.object({ playerName: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: player } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("name", data.playerName)
      .maybeSingle();
    if (!player) return [];
    const { data: rows } = await supabaseAdmin
      .from("predictions")
      .select("*, score:prediction_scores(*), match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*))")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false });
    return rows ?? [];
  });

export const savePrediction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        playerName: z.string(),
        matchId: z.number(),
        winner: z.enum(["home", "draw", "away"]).nullable().optional(),
        home_score: z.number().min(0).max(20).nullable().optional(),
        away_score: z.number().min(0).max(20).nullable().optional(),
        first_scorer_id: z.number().nullable().optional(),
        anytime_scorer_id: z.number().nullable().optional(),
        over_2_5: z.boolean().nullable().optional(),
        both_teams_score: z.boolean().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: player } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("name", data.playerName)
      .maybeSingle();
    if (!player) throw new Error("Player not found");

    // Verify kickoff hasn't happened
    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("kickoff_at,status")
      .eq("id", data.matchId)
      .maybeSingle();
    if (!match) throw new Error("Match not found");
    const locked = new Date(match.kickoff_at).getTime() <= Date.now() || match.status !== "scheduled";
    if (locked) throw new Error("התחזיות ננעלו - המשחק החל");

    const payload = {
      player_id: player.id,
      match_id: data.matchId,
      winner: data.winner ?? null,
      home_score: data.home_score ?? null,
      away_score: data.away_score ?? null,
      first_scorer_id: data.first_scorer_id ?? null,
      anytime_scorer_id: data.anytime_scorer_id ?? null,
      over_2_5: data.over_2_5 ?? null,
      both_teams_score: data.both_teams_score ?? null,
      is_locked: false,
    };
    const { error } = await (supabaseAdmin.from("predictions") as any).upsert(payload, { onConflict: "player_id,match_id" });
    if (error) throw error;
    return { ok: true };
  });

/* ---------- Bracket ---------- */

export const getBracket = createServerFn({ method: "GET" })
  .inputValidator((d: { playerName: string }) => z.object({ playerName: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: player } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("name", data.playerName)
      .maybeSingle();
    if (!player) return null;
    const { data: row } = await supabaseAdmin
      .from("bracket_predictions")
      .select("*")
      .eq("player_id", player.id)
      .maybeSingle();
    return row;
  });

export const saveBracket = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        playerName: z.string(),
        champion_team_id: z.number().nullable().optional(),
        runner_up_team_id: z.number().nullable().optional(),
        third_place_team_id: z.number().nullable().optional(),
        golden_boot_player_id: z.number().nullable().optional(),
        mvp_player_id: z.number().nullable().optional(),
        group_winners: z.record(z.string(), z.number().nullable()).optional(),
        group_runners_up: z.record(z.string(), z.number().nullable()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: player } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("name", data.playerName)
      .maybeSingle();
    if (!player) throw new Error("Player not found");
    const payload: Record<string, unknown> = { player_id: player.id };
    if (data.champion_team_id !== undefined) payload.champion_team_id = data.champion_team_id;
    if (data.runner_up_team_id !== undefined) payload.runner_up_team_id = data.runner_up_team_id;
    if (data.third_place_team_id !== undefined) payload.third_place_team_id = data.third_place_team_id;
    if (data.golden_boot_player_id !== undefined) payload.golden_boot_player_id = data.golden_boot_player_id;
    if (data.mvp_player_id !== undefined) payload.mvp_player_id = data.mvp_player_id;
    if (data.group_winners) payload.group_winners = data.group_winners;
    if (data.group_runners_up) payload.group_runners_up = data.group_runners_up;
    const { error } = await (supabaseAdmin.from("bracket_predictions") as any).upsert(payload, { onConflict: "player_id" });
    if (error) throw error;
    return { ok: true };
  });

/* ---------- Leaderboard ---------- */

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: players } = await supabaseAdmin.from("players").select("*");
  if (!players) return [];
  const out: Array<{
    player: (typeof players)[number];
    medals: { gold: number; silver: number; bronze: number };
    predictions: number;
    exactScores: number;
    winnerHits: number;
    bracketPoints: number;
    achievements: number;
  }> = [];
  for (const p of players) {
    const [{ data: medals }, { data: scores }, { data: bracket }, { data: achs }] = await Promise.all([
      supabaseAdmin.from("medals").select("kind").eq("player_id", p.id),
      supabaseAdmin
        .from("prediction_scores")
        .select("winner_points,score_points")
        .eq("player_id", p.id),
      supabaseAdmin.from("bracket_predictions").select("total_bracket_points").eq("player_id", p.id).maybeSingle(),
      supabaseAdmin.from("achievements").select("id").eq("player_id", p.id),
    ]);
    out.push({
      player: p,
      medals: {
        gold: medals?.filter((m) => m.kind === "gold").length ?? 0,
        silver: medals?.filter((m) => m.kind === "silver").length ?? 0,
        bronze: medals?.filter((m) => m.kind === "bronze").length ?? 0,
      },
      predictions: scores?.length ?? 0,
      exactScores: scores?.filter((s) => (s.score_points ?? 0) >= 25).length ?? 0,
      winnerHits: scores?.filter((s) => (s.winner_points ?? 0) > 0).length ?? 0,
      bracketPoints: bracket?.total_bracket_points ?? 0,
      achievements: achs?.length ?? 0,
    });
  }
  return out.sort((a, b) => (b.player.total_points ?? 0) - (a.player.total_points ?? 0));
});

/* ---------- Refresh + scoring orchestration ---------- */

export const refreshWorldCupData = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { apiFootball, stageFromRound, statusFromApi, flagUrl } = await import("./api-football.server");
  const startedAt = new Date().toISOString();
  let teamsCount = 0;
  let fixturesCount = 0;
  let standingsCount = 0;
  let scorersCount = 0;
  try {
    /* Teams */
    const teams = await apiFootball.teams();
    if (teams.length > 0) {
      const rows = teams.map((t) => ({
        id: t.team.id,
        name: t.team.name,
        code: t.team.code ?? null,
        flag_url: t.team.code ? flagUrl(t.team.code) : (t.team.logo ?? null),
        logo_url: t.team.logo ?? null,
      }));
      const { error } = await (supabaseAdmin.from("teams") as any).upsert(rows, { onConflict: "id" });
      if (error) throw error;
      teamsCount = rows.length;
    }

    /* Fixtures */
    const fixtures = await apiFootball.fixtures();
    if (fixtures.length > 0) {
      const rows = fixtures.map((f) => ({
        id: f.fixture.id,
        external_id: String(f.fixture.id),
        stage: stageFromRound(f.league.round),
        home_team_id: f.teams.home.id,
        away_team_id: f.teams.away.id,
        kickoff_at: f.fixture.date,
        stadium: f.fixture.venue?.name ?? null,
        city: f.fixture.venue?.city ?? null,
        status: statusFromApi(f.fixture.status.short),
        live_status: f.fixture.status.short ?? null,
        home_score: f.goals.home,
        away_score: f.goals.away,
        home_score_ht: f.score?.halftime?.home ?? null,
        away_score_ht: f.score?.halftime?.away ?? null,
        minute: f.fixture.status.elapsed,
      }));
      const { error } = await (supabaseAdmin.from("matches") as any).upsert(rows, { onConflict: "id" });
      if (error) throw error;
      fixturesCount = rows.length;
    }

    /* Standings */
    const standings = await apiFootball.standings();
    if (standings.length > 0 && standings[0]?.league?.standings) {
      const rows: Array<Record<string, unknown>> = [];
      const groupCodes = new Set<string>();
      for (const group of standings[0].league.standings) {
        for (const t of group) {
          const groupLetterMatch = (t.group ?? "").match(/\bGroup\s+([A-L])\b/i);
          if (!groupLetterMatch) continue;
          const groupCode = groupLetterMatch[1].toUpperCase();
          groupCodes.add(groupCode);
          rows.push({
            group_code: groupCode,
            team_id: t.team.id,
            rank: t.rank,
            played: t.all.played,
            wins: t.all.win,
            draws: t.all.draw,
            losses: t.all.lose,
            goals_for: t.all.goals.for,
            goals_against: t.all.goals.against,
            goal_difference: t.goalsDiff,
            points: t.points,
          });
          // Tag team with group too
          await (supabaseAdmin.from("teams") as any).update({ group_code: groupCode }).eq("id", t.team.id);
        }
      }
      if (rows.length > 0) {
        await supabaseAdmin.from("standings").delete().in("group_code", Array.from(groupCodes));
        const { error } = await (supabaseAdmin.from("standings") as any).insert(rows);
        if (error) throw error;
        standingsCount = rows.length;
      }
    }

    /* Top scorers — also feeds the football_players table for pickers */
    try {
      const scorers = await apiFootball.topScorers();
      const rows = scorers.map((s) => ({
        id: s.player.id,
        name: s.player.name,
        team_id: s.statistics?.[0]?.team?.id ?? null,
        position: s.statistics?.[0]?.games?.position ?? null,
        photo_url: s.player.photo ?? null,
        nationality: s.player.nationality ?? null,
      }));
      if (rows.length > 0) {
        await (supabaseAdmin.from("football_players") as any).upsert(rows, { onConflict: "id" });
        scorersCount = rows.length;
      }
    } catch (e) {
      console.warn("topScorers failed (non-fatal)", e);
    }

    /* Recalculate scores */
    await recalcAllScoresInternal();

    await (supabaseAdmin.from("refresh_logs") as any).insert({
      kind: "full",
      status: "ok",
      detail: `teams:${teamsCount} fixtures:${fixturesCount} standings:${standingsCount} scorers:${scorersCount}`,
      items_count: teamsCount + fixturesCount + standingsCount,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    return { ok: true, teams: teamsCount, fixtures: fixturesCount, standings: standingsCount, scorers: scorersCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await (supabaseAdmin.from("refresh_logs") as any).insert({
      kind: "full",
      status: "error",
      detail: msg.slice(0, 500),
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    throw e;
  }
});

async function recalcAllScoresInternal() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { calculateScore } = await import("./scoring");
  const { data: cfg } = await supabaseAdmin.from("scoring_config").select("*").eq("id", 1).maybeSingle();
  if (!cfg) return;

  // Finished matches with their events for first-scorer detection
  const { data: matches } = await supabaseAdmin
    .from("matches")
    .select("id, home_score, away_score, home_team_id, away_team_id, status")
    .eq("status", "finished");
  if (!matches || matches.length === 0) return;

  for (const m of matches) {
    if (m.home_score == null || m.away_score == null) continue;
    const { data: events } = await supabaseAdmin
      .from("match_events")
      .select("player_id, team_id, minute, event_type")
      .eq("match_id", m.id)
      .eq("event_type", "Goal")
      .order("minute");
    const scorerIds = (events ?? []).filter((e) => e.player_id != null).map((e) => e.player_id as number);
    const firstGoal = events?.[0];

    const { data: preds } = await supabaseAdmin
      .from("predictions")
      .select("*")
      .eq("match_id", m.id);
    if (!preds) continue;
    for (const p of preds) {
      const breakdown = calculateScore(
        {
          winner: p.winner,
          home_score: p.home_score,
          away_score: p.away_score,
          first_scorer_id: p.first_scorer_id,
          anytime_scorer_id: p.anytime_scorer_id,
          over_2_5: p.over_2_5,
          both_teams_score: p.both_teams_score,
        },
        {
          home_score: m.home_score,
          away_score: m.away_score,
          first_scorer_id: firstGoal?.player_id ?? null,
          first_scorer_team_id: firstGoal?.team_id ?? null,
          scorer_ids: scorerIds,
          home_team_id: m.home_team_id ?? undefined,
          away_team_id: m.away_team_id ?? undefined,
        },
        cfg,
      );
      await (supabaseAdmin.from("prediction_scores") as any).upsert(
        {
          prediction_id: p.id,
          player_id: p.player_id,
          match_id: m.id,
          ...breakdown,
        },
        { onConflict: "prediction_id" },
      );
      await (supabaseAdmin.from("predictions") as any).update({ is_locked: true }).eq("id", p.id);
    }
  }

  // Update player totals
  const { data: players } = await supabaseAdmin.from("players").select("id");
  for (const pl of players ?? []) {
    const { data: rows } = await supabaseAdmin
      .from("prediction_scores")
      .select("total_points")
      .eq("player_id", pl.id);
    const total = (rows ?? []).reduce((s, r) => s + (r.total_points ?? 0), 0);
    await (supabaseAdmin.from("players") as any).update({ total_points: total }).eq("id", pl.id);
  }
}

export const recalcAllScores = createServerFn({ method: "POST" }).handler(async () => {
  await recalcAllScoresInternal();
  return { ok: true };
});

/* ---------- Data stats (admin verification) ---------- */

export const getDataStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [
    { count: teams },
    { count: fixtures },
    { count: standings },
    { count: finished },
    { count: upcoming },
    { count: live },
    { data: groupRows },
  ] = await Promise.all([
    supabaseAdmin.from("teams").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("standings").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).eq("status", "finished"),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).eq("status", "live"),
    supabaseAdmin.from("standings").select("group_code").order("group_code"),
  ]);
  const groups = new Set((groupRows ?? []).map((r: any) => r.group_code)).size;
  return {
    teams: teams ?? 0,
    fixtures: fixtures ?? 0,
    standings: standings ?? 0,
    groups,
    finished: finished ?? 0,
    upcoming: upcoming ?? 0,
    live: live ?? 0,
  };
});

/* ---------- Refresh logs (admin) ---------- */

export const getRefreshLogs = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("refresh_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);
  return data ?? [];
});