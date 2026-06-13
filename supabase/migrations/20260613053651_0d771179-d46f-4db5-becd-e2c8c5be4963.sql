
-- ============================================================
-- World Cup Challenge 2026 - Initial Schema
-- ============================================================

-- ---------- ENUMS ----------
CREATE TYPE match_status AS ENUM ('scheduled','live','finished','postponed','cancelled');
CREATE TYPE prediction_winner AS ENUM ('home','draw','away');
CREATE TYPE tournament_stage AS ENUM ('group','round_of_32','round_of_16','quarter_final','semi_final','third_place','final');
CREATE TYPE medal_kind AS ENUM ('gold','silver','bronze','great_effort');

-- ---------- PLAYERS (Tom & Rony) ----------
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age INT NOT NULL,
  avatar_emoji TEXT DEFAULT '🏆',
  favorite_team_id INT,
  favorite_player_id INT,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- TEAMS ----------
CREATE TABLE public.teams (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  name_he TEXT,
  code TEXT,
  flag_url TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  group_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- FOOTBALL PLAYERS ----------
CREATE TABLE public.football_players (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  name_he TEXT,
  team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  position TEXT,
  photo_url TEXT,
  nationality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- GROUPS ----------
CREATE TABLE public.groups (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- ---------- MATCHES ----------
CREATE TABLE public.matches (
  id INT PRIMARY KEY,
  external_id TEXT,
  stage tournament_stage NOT NULL DEFAULT 'group',
  group_code TEXT REFERENCES public.groups(code) ON DELETE SET NULL,
  home_team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  stadium TEXT,
  city TEXT,
  status match_status NOT NULL DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  home_score_ht INT,
  away_score_ht INT,
  minute INT,
  possession_home INT,
  possession_away INT,
  shots_home INT,
  shots_away INT,
  corners_home INT,
  corners_away INT,
  yellow_home INT,
  yellow_away INT,
  red_home INT,
  red_away INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_kickoff ON public.matches(kickoff_at);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_stage ON public.matches(stage);

-- ---------- MATCH EVENTS ----------
CREATE TABLE public.match_events (
  id BIGSERIAL PRIMARY KEY,
  match_id INT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  player_id INT REFERENCES public.football_players(id) ON DELETE SET NULL,
  player_name TEXT,
  minute INT,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_match ON public.match_events(match_id);

-- ---------- STANDINGS ----------
CREATE TABLE public.standings (
  id BIGSERIAL PRIMARY KEY,
  group_code TEXT NOT NULL REFERENCES public.groups(code) ON DELETE CASCADE,
  team_id INT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  goals_for INT NOT NULL DEFAULT 0,
  goals_against INT NOT NULL DEFAULT 0,
  goal_difference INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_code, team_id)
);

-- ---------- PREDICTIONS ----------
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id INT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  winner prediction_winner,
  home_score INT,
  away_score INT,
  first_scorer_id INT REFERENCES public.football_players(id) ON DELETE SET NULL,
  anytime_scorer_id INT REFERENCES public.football_players(id) ON DELETE SET NULL,
  over_2_5 BOOLEAN,
  both_teams_score BOOLEAN,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, match_id)
);
CREATE INDEX idx_pred_player ON public.predictions(player_id);
CREATE INDEX idx_pred_match ON public.predictions(match_id);

-- ---------- PREDICTION SCORES ----------
CREATE TABLE public.prediction_scores (
  id BIGSERIAL PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id INT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  winner_points INT NOT NULL DEFAULT 0,
  score_points INT NOT NULL DEFAULT 0,
  first_scorer_points INT NOT NULL DEFAULT 0,
  anytime_scorer_points INT NOT NULL DEFAULT 0,
  totals_points INT NOT NULL DEFAULT 0,
  btts_points INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prediction_id)
);
CREATE INDEX idx_scores_player ON public.prediction_scores(player_id);

-- ---------- BRACKET PREDICTIONS ----------
CREATE TABLE public.bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  champion_team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  runner_up_team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  third_place_team_id INT REFERENCES public.teams(id) ON DELETE SET NULL,
  golden_boot_player_id INT REFERENCES public.football_players(id) ON DELETE SET NULL,
  mvp_player_id INT REFERENCES public.football_players(id) ON DELETE SET NULL,
  group_winners JSONB DEFAULT '{}'::jsonb,
  group_runners_up JSONB DEFAULT '{}'::jsonb,
  round_of_32 JSONB DEFAULT '[]'::jsonb,
  round_of_16 JSONB DEFAULT '[]'::jsonb,
  quarter_finals JSONB DEFAULT '[]'::jsonb,
  semi_finals JSONB DEFAULT '[]'::jsonb,
  finalists JSONB DEFAULT '[]'::jsonb,
  total_bracket_points INT NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id)
);

-- ---------- ACHIEVEMENTS ----------
CREATE TABLE public.achievements (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, code)
);
CREATE INDEX idx_ach_player ON public.achievements(player_id);

-- ---------- MEDALS ----------
CREATE TABLE public.medals (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  kind medal_kind NOT NULL,
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, day)
);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_player ON public.notifications(player_id, read);

-- ---------- REFRESH LOGS ----------
CREATE TABLE public.refresh_logs (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  items_count INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- ---------- SCORING CONFIG ----------
CREATE TABLE public.scoring_config (
  id INT PRIMARY KEY DEFAULT 1,
  winner_correct INT NOT NULL DEFAULT 10,
  score_exact INT NOT NULL DEFAULT 25,
  score_off_by_1 INT NOT NULL DEFAULT 18,
  score_off_by_2 INT NOT NULL DEFAULT 12,
  score_off_by_3 INT NOT NULL DEFAULT 5,
  first_scorer_exact INT NOT NULL DEFAULT 30,
  first_scorer_team INT NOT NULL DEFAULT 10,
  anytime_scorer INT NOT NULL DEFAULT 15,
  totals_correct INT NOT NULL DEFAULT 10,
  totals_close INT NOT NULL DEFAULT 5,
  btts_correct INT NOT NULL DEFAULT 8,
  bracket_r16 INT NOT NULL DEFAULT 5,
  bracket_qf INT NOT NULL DEFAULT 10,
  bracket_sf INT NOT NULL DEFAULT 15,
  bracket_final INT NOT NULL DEFAULT 25,
  bracket_champion INT NOT NULL DEFAULT 100,
  bracket_golden_boot INT NOT NULL DEFAULT 50,
  bracket_mvp INT NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scoring_singleton CHECK (id = 1)
);

INSERT INTO public.scoring_config (id) VALUES (1);

-- ============================================================
-- GRANTS (family app — open to anon and authenticated)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.football_players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.standings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prediction_scores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bracket_predictions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scoring_config TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================
-- RLS - permissive (private family app, no auth model)
-- ============================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.football_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_config ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'players','teams','football_players','groups','matches','match_events',
      'standings','predictions','prediction_scores','bracket_predictions',
      'achievements','medals','notifications','refresh_logs','scoring_config'
    ])
  LOOP
    EXECUTE format('CREATE POLICY "open_select_%I" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "open_insert_%I" ON public.%I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "open_update_%I" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "open_delete_%I" ON public.%I FOR DELETE USING (true)', t, t);
  END LOOP;
END $$;

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_players_updated BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_teams_updated BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_matches_updated BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_predictions_updated BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_bracket_updated BEFORE UPDATE ON public.bracket_predictions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Seed Tom & Rony
-- ============================================================
INSERT INTO public.players (name, display_name, age, avatar_emoji) VALUES
  ('tom',  'תום',  11, '⚽'),
  ('rony', 'רוני',  9, '🏆');

-- Seed group placeholders A-L
INSERT INTO public.groups (code, name) VALUES
  ('A','בית A'),('B','בית B'),('C','בית C'),('D','בית D'),
  ('E','בית E'),('F','בית F'),('G','בית G'),('H','בית H'),
  ('I','בית I'),('J','בית J'),('K','בית K'),('L','בית L');
