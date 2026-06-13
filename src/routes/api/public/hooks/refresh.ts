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
        const counts = { teams: 0, fixtures: 0 };
        try {
          const teams = await apiFootball.teams();
          if (teams.length > 0) {
            await sb.from("teams").upsert(
              teams.map((t: any) => ({
                id: t.team.id,
                name: t.team.name,
                code: t.team.code ?? null,
                flag_url: t.team.code ? flagUrl(t.team.code) : t.team.logo ?? null,
                logo_url: t.team.logo ?? null,
              })),
              { onConflict: "id" },
            );
            counts.teams = teams.length;
          }
          const fixtures = await apiFootball.fixtures();
          if (fixtures.length > 0) {
            await sb.from("matches").upsert(
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
            counts.fixtures = fixtures.length;
          }
          await sb.from("refresh_logs").insert({
            kind: "cron",
            status: "ok",
            detail: `teams:${counts.teams} fixtures:${counts.fixtures}`,
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