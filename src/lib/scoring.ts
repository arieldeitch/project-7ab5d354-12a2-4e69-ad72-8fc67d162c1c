/**
 * Friendly scoring engine for World Cup Challenge.
 * Rewards close predictions, never punishes participation.
 */

export type ScoringConfig = {
  winner_correct: number;
  score_exact: number;
  score_off_by_1: number;
  score_off_by_2: number;
  score_off_by_3: number;
  first_scorer_exact: number;
  first_scorer_team: number;
  anytime_scorer: number;
  totals_correct: number;
  totals_close: number;
  btts_correct: number;
};

export type PredictionInput = {
  winner: "home" | "draw" | "away" | null;
  home_score: number | null;
  away_score: number | null;
  first_scorer_id: number | null;
  anytime_scorer_id: number | null;
  over_2_5: boolean | null;
  both_teams_score: boolean | null;
};

export type MatchResult = {
  home_score: number;
  away_score: number;
  first_scorer_id?: number | null;
  first_scorer_team_id?: number | null;
  scorer_ids?: number[];
  home_team_id?: number;
  away_team_id?: number;
};

export type ScoreBreakdown = {
  winner_points: number;
  score_points: number;
  first_scorer_points: number;
  anytime_scorer_points: number;
  totals_points: number;
  btts_points: number;
  total_points: number;
};

export function actualWinner(r: MatchResult): "home" | "draw" | "away" {
  if (r.home_score > r.away_score) return "home";
  if (r.home_score < r.away_score) return "away";
  return "draw";
}

export function calculateScore(
  pred: PredictionInput,
  result: MatchResult,
  cfg: ScoringConfig,
): ScoreBreakdown {
  let winner_points = 0;
  let score_points = 0;
  let first_scorer_points = 0;
  let anytime_scorer_points = 0;
  let totals_points = 0;
  let btts_points = 0;

  // Winner
  if (pred.winner && pred.winner === actualWinner(result)) {
    winner_points = cfg.winner_correct;
  }

  // Exact / close score
  if (pred.home_score !== null && pred.away_score !== null) {
    const dh = Math.abs(pred.home_score - result.home_score);
    const da = Math.abs(pred.away_score - result.away_score);
    const dist = dh + da;
    if (dist === 0) score_points = cfg.score_exact;
    else if (dist === 1) score_points = cfg.score_off_by_1;
    else if (dist === 2) score_points = cfg.score_off_by_2;
    else if (dist === 3) score_points = cfg.score_off_by_3;
  }

  // First scorer
  if (pred.first_scorer_id && result.first_scorer_id != null) {
    if (pred.first_scorer_id === result.first_scorer_id) {
      first_scorer_points = cfg.first_scorer_exact;
    } else if (
      result.first_scorer_team_id != null &&
      result.scorer_ids?.includes(pred.first_scorer_id)
    ) {
      // Predicted scorer scored, but not first — partial credit
      first_scorer_points = cfg.first_scorer_team;
    }
  }

  // Anytime scorer
  if (pred.anytime_scorer_id && result.scorer_ids?.includes(pred.anytime_scorer_id)) {
    anytime_scorer_points = cfg.anytime_scorer;
  }

  // Over / Under 2.5
  if (pred.over_2_5 !== null) {
    const totalGoals = result.home_score + result.away_score;
    const isOver = totalGoals > 2;
    if (pred.over_2_5 === isOver) totals_points = cfg.totals_correct;
    else if (totalGoals === (pred.over_2_5 ? 2 : 3)) totals_points = cfg.totals_close;
  }

  // Both teams to score
  if (pred.both_teams_score !== null) {
    const btts = result.home_score > 0 && result.away_score > 0;
    if (pred.both_teams_score === btts) btts_points = cfg.btts_correct;
  }

  const total_points =
    winner_points +
    score_points +
    first_scorer_points +
    anytime_scorer_points +
    totals_points +
    btts_points;

  return {
    winner_points,
    score_points,
    first_scorer_points,
    anytime_scorer_points,
    totals_points,
    btts_points,
    total_points,
  };
}

/** Friendly message that never says "wrong". */
export function friendlyMessage(b: ScoreBreakdown): string {
  if (b.total_points >= 40) return "תחזית אגדית! 🌟";
  if (b.total_points >= 25) return "ביצוע מעולה! 🔥";
  if (b.total_points >= 15) return "כל הכבוד!";
  if (b.total_points > 0) return "צברת נקודות! 👏";
  return "בפעם הבאה תפגע בול! ⚽";
}