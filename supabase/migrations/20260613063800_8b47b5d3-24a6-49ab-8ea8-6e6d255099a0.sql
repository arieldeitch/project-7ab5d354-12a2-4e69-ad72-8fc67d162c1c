-- Live match support: dedup index for events + extra-time / period tracking
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_status text;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS extra_time integer;

CREATE UNIQUE INDEX IF NOT EXISTS match_events_dedup_idx
  ON public.match_events (
    match_id,
    event_type,
    COALESCE(team_id, 0),
    COALESCE(player_id, 0),
    COALESCE(minute, -1),
    COALESCE(extra_time, 0),
    COALESCE(detail, '')
  );

CREATE INDEX IF NOT EXISTS match_events_match_idx
  ON public.match_events (match_id, minute, extra_time, id);

CREATE INDEX IF NOT EXISTS match_events_created_idx
  ON public.match_events (created_at DESC);