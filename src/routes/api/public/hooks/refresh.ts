import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/refresh")({
  server: {
    handlers: {
      POST: async () => {
        const { apiFootball, stageFromRound, statusFromApi, flagUrl } = await import(
          "@/lib/api-football.server"
        );
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const startedAt = new Date().toISOString();
        const sb = supabaseAdmin as any;
        const counts = { teams: 0, fixtures: 0, standings: 0, scorers: 0 };
        try {
          /* Teams */
          const teams = await apiFootball.teams();
          if (teams.length > 0) {
            const { error } = await sb.from("teams").upsert(
              teams.map((t: any) => ({
                id: t.team.id,
                name: t.team.name,
                code: t.team.code ?? null,
                flag_url: t.team.code ? flagUrl(t.team.code) : t.team.logo ?? null,
                logo_url: t.team.logo ?? null,
              })),
              { onConflict: "id" },
            );
            if (error) throw error;
            counts.teams = teams.length;
          }

          /* Fixtures */
          const fixtures = await apiFootball.fixtures();
          if (fixtures.length > 0) {
            const { error } = await sb.from("matches").upsert(
              fixtures.map((f: any) => ({
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
                minute: f.fixture.status.elapsed,
              })),
              { onConflict: "id" },
            );
            if (error) throw error;
            counts.fixtures = fixtures.length;
          }

          /* Standings */
          try {
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
                  await sb.from("teams").update({ group_code: groupCode }).eq("id", t.team.id);
                }
              }
              if (rows.length > 0) {
                const groupCodesArr = Array.from(groupCodes);
                // Satisfy FK constraint: ensure group codes exist before standings insert
                await sb.from("groups").upsert(
                  groupCodesArr.map((code: string) => ({ code, name: `קבוצה ${code}` })),
                  { onConflict: "code", ignoreDuplicates: true },
                );
                await sb.from("standings").delete().in("group_code", groupCodesArr);
                const { error } = await sb.from("standings").insert(rows);
                if (error) throw error;
                counts.standings = rows.length;

                // Backfill group_code on group-stage matches via home team's group
                const { data: teamGroups } = await sb.from("teams").select("id, group_code").not("group_code", "is", null);
                for (const t of teamGroups ?? []) {
                  await sb.from("matches").update({ group_code: t.group_code }).eq("home_team_id", t.id).eq("stage", "group");
                }
              }
            }
          } catch (e) {
            console.warn("[refresh] standings failed (non-fatal)", e);
          }

          /* Top scorers → populates football_players for pickers */
          try {
            const scorers = await apiFootball.topScorers();
            const rows = scorers.map((s: any) => ({
              id: s.player.id,
              name: s.player.name,
              team_id: s.statistics?.[0]?.team?.id ?? null,
              position: s.statistics?.[0]?.games?.position ?? null,
              photo_url: s.player.photo ?? null,
              nationality: s.player.nationality ?? null,
            }));
            if (rows.length > 0) {
              await sb.from("football_players").upsert(rows, { onConflict: "id" });
              counts.scorers = rows.length;
            }
          } catch (e) {
            console.warn("[refresh] topScorers failed (non-fatal)", e);
          }

          /* Recalculate prediction scores for finished matches */
          try {
            const { recalcAllScoresInternal } = await import("@/lib/wc.functions");
            await recalcAllScoresInternal();
          } catch (e) {
            console.warn("[refresh] recalc failed (non-fatal)", e);
          }

          await sb.from("refresh_logs").insert({
            kind: "cron",
            status: "ok",
            detail: `teams:${counts.teams} fixtures:${counts.fixtures} standings:${counts.standings} scorers:${counts.scorers}`,
            started_at: startedAt,
            finished_at: new Date().toISOString(),
          });
          return Response.json({ ok: true, ...counts });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await sb.from("refresh_logs").insert({
            kind: "cron",
            status: "error",
            detail: msg.slice(0, 500),
            started_at: startedAt,
            finished_at: new Date().toISOString(),
          });
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});