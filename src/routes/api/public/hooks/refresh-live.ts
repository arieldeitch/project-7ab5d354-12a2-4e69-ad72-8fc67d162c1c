import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/refresh-live")({
  server: {
    handlers: {
      POST: async () => {
        const startedAt = new Date().toISOString();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;
        try {
          const { syncLiveMatchesInternal } = await import("@/lib/wc.functions");
          const r = await syncLiveMatchesInternal();
          await sb.from("refresh_logs").insert({
            kind: "live",
            status: "ok",
            detail: `matches:${r.matches} events:${r.events} finished:${r.finished}`,
            started_at: startedAt,
            finished_at: new Date().toISOString(),
          });
          return Response.json({ ok: true, ...r });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await sb.from("refresh_logs").insert({
            kind: "live",
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