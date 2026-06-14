import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMatchDetail, getMatchEvents } from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";
import { MatchTimeline } from "@/components/MatchTimeline";
import { teamLabel } from "@/lib/team-names";

const STAGE_HE: Record<string, string> = {
  group: "שלב הבתים",
  round_of_32: "שמינית הגמר המוקדמת",
  round_of_16: "שמינית הגמר",
  quarter_final: "רבע הגמר",
  semi_final: "חצי הגמר",
  third_place: "משחק המקום השלישי",
  final: "הגמר 🏆",
};

const WINNER_HE: Record<string, string> = {
  home: "ניצחון הבית",
  draw: "תיקו",
  away: "ניצחון האורחים",
};

export const Route = createFileRoute("/match/$matchId")({
  head: () => ({ meta: [{ title: "פרטי משחק · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <MatchDetail />
    </RequirePlayer>
  ),
});

function MatchDetail() {
  const { matchId } = Route.useParams();
  const router = useRouter();
  const fn = useServerFn(getMatchDetail);
  const eventsFn = useServerFn(getMatchEvents);

  const q = useQuery({
    queryKey: ["match-detail", matchId],
    queryFn: () => fn({ data: { matchId: Number(matchId) } }),
    refetchInterval: (data) => ((data as any)?.match?.status === "live" ? 30_000 : false),
  });

  const eventsQ = useQuery({
    queryKey: ["match-events", matchId],
    queryFn: () => eventsFn({ data: { matchId: Number(matchId) } }),
    refetchInterval: () => (q.data?.match?.status === "live" ? 30_000 : false),
    enabled: !!q.data,
  });

  const match = q.data?.match;
  const stage = match?.stage ? (STAGE_HE[match.stage] ?? match.stage) : "";

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.navigate({ to: "/home" });
    }
  };

  return (
    <AppShell
      title="פרטי משחק"
      subtitle={stage}
      action={
        <button
          onClick={handleBack}
          className="rounded-xl bg-card border border-border px-3 py-1.5 text-xs font-bold"
        >
          ← חזרה
        </button>
      }
    >
      {q.isLoading && (
        <div className="space-y-4">
          <div className="card-stadium h-44 animate-pulse" />
          <div className="card-stadium h-52 animate-pulse" />
        </div>
      )}

      {q.error && (
        <div className="card-stadium p-6 text-center text-muted-foreground">
          <div className="text-4xl mb-2">😕</div>
          <div className="font-bold">לא מצאנו את המשחק</div>
        </div>
      )}

      {match && (
        <>
          {/* Section 1 — Match summary */}
          <section className="mb-6">
            <MatchCard match={match as any} />
          </section>

          {/* Section 2 & 3 — Predictions + breakdowns */}
          <section className="mb-6">
            <h2 className="text-lg font-black mb-3 flex items-center gap-2">⚽ תחזיות השחקנים</h2>
            <div className="space-y-3">
              {(q.data?.predictions ?? []).map(({ player, prediction, score }) => (
                <PlayerPredCard
                  key={player.id}
                  player={player}
                  prediction={prediction}
                  score={score}
                  match={match}
                />
              ))}
            </div>
          </section>

          {/* Section 3 — Match events */}
          {(match.status === "live" || match.status === "finished") && (
            <section className="mb-6">
              <h2 className="text-lg font-black mb-3 flex items-center gap-2">📋 אירועי המשחק</h2>
              <div className="card-stadium p-4">
                <MatchTimeline
                  events={(eventsQ.data ?? []) as any[]}
                  isFinished={match.status === "finished"}
                />
              </div>
            </section>
          )}

          {/* Section 4 — Battle result */}
          {match.status === "finished" && (
            <BattleResult predictions={q.data?.predictions ?? []} />
          )}
        </>
      )}
    </AppShell>
  );
}

type Prediction = {
  winner: "home" | "draw" | "away" | null;
  home_score: number | null;
  away_score: number | null;
  first_scorer_id: number | null;
  anytime_scorer_id: number | null;
  over_2_5: boolean | null;
  both_teams_score: boolean | null;
} | null;

type Score = {
  winner_points: number;
  score_points: number;
  first_scorer_points: number;
  anytime_scorer_points: number;
  totals_points: number;
  btts_points: number;
  total_points: number;
} | null;

function PlayerPredCard({
  player,
  prediction,
  score,
  match,
}: {
  player: any;
  prediction: Prediction;
  score: Score;
  match: any;
}) {
  const isFinished = match.status === "finished";
  const totalPoints = score?.total_points ?? 0;
  const bonusPoints =
    (score?.first_scorer_points ?? 0) +
    (score?.anytime_scorer_points ?? 0) +
    (score?.totals_points ?? 0) +
    (score?.btts_points ?? 0);

  return (
    <div
      className={
        "card-stadium p-4 " +
        (isFinished && totalPoints > 0 ? "ring-1 ring-gold/40 " : "")
      }
    >
      {/* Player header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{player.avatar_emoji}</span>
        <span className="font-black text-base">{player.display_name}</span>
        {isFinished && (
          <span
            className={
              "mr-auto text-lg font-black tabular-nums " +
              (totalPoints > 0 ? "text-gold" : "text-muted-foreground")
            }
          >
            {totalPoints > 0 ? `+${totalPoints}` : "0"} נק׳
          </span>
        )}
      </div>

      {prediction ? (
        <>
          {/* Predicted score */}
          <div className="bg-muted/40 rounded-xl p-3 mb-3">
            <div className="text-[11px] text-muted-foreground text-center mb-1.5">ניחוש</div>
            {prediction.home_score != null && prediction.away_score != null ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm font-bold truncate max-w-[80px] text-center">
                  {teamLabel(match.home_team)}
                </span>
                <div dir="ltr" className="text-2xl font-black text-gold tabular-nums shrink-0">
                  {prediction.away_score}
                  <span className="text-muted-foreground mx-1">-</span>
                  {prediction.home_score}
                </div>
                <span className="text-sm font-bold truncate max-w-[80px] text-center">
                  {teamLabel(match.away_team)}
                </span>
              </div>
            ) : prediction.winner ? (
              <div className="text-center text-sm font-bold">
                {WINNER_HE[prediction.winner] ?? prediction.winner}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">ניחוש חלקי</div>
            )}
            {prediction.winner && prediction.home_score != null && (
              <div className="text-center text-[11px] text-muted-foreground mt-1.5">
                ניחוש מנצח: {WINNER_HE[prediction.winner] ?? prediction.winner}
              </div>
            )}
          </div>

          {/* Score breakdown (finished matches only) */}
          {isFinished && score && (
            <div className="space-y-1.5 text-sm">
              <ScoreRow label="ניחוש מנצח" points={score.winner_points} />
              <ScoreRow label="דיוק בתוצאה" points={score.score_points} />
              {bonusPoints > 0 && <ScoreRow label="בונוס" points={bonusPoints} />}
              <div className="flex items-center justify-between font-black text-sm border-t border-border pt-1.5 mt-1.5">
                <span>סה״כ</span>
                <span className={totalPoints > 0 ? "text-gold" : "text-muted-foreground"}>
                  {totalPoints}
                </span>
              </div>
            </div>
          )}

          {/* Pre-match: just confirm prediction exists */}
          {!isFinished && (
            <div className="text-xs text-muted-foreground text-center">
              ✓ תחזית נמסרה — תנקד כשהמשחק יסתיים
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-3">לא הגיש תחזית</div>
      )}
    </div>
  );
}

function ScoreRow({ label, points }: { label: string; points: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          "font-bold tabular-nums " + (points > 0 ? "text-gold" : "text-muted-foreground")
        }
      >
        {points > 0 ? `+${points}` : "—"}
      </span>
    </div>
  );
}

function BattleResult({ predictions }: { predictions: Array<{ player: any; score: Score }> }) {
  const scored = predictions.map((p) => ({
    player: p.player,
    pts: p.score?.total_points ?? 0,
  }));
  const max = scored.length ? Math.max(...scored.map((s) => s.pts)) : 0;
  const winners = scored.filter((s) => s.pts === max);
  const isTie = winners.length > 1 && max > 0;
  const noPoints = max === 0;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-black mb-3 flex items-center gap-2">🏆 תוצאת הדו-קרב</h2>
      <div className="card-stadium p-5 text-center">
        {noPoints ? (
          <>
            <div className="text-4xl mb-2">😅</div>
            <div className="font-black text-lg">שניהם בלי נקודות הפעם</div>
            <div className="text-sm text-muted-foreground mt-1">לפעם הבאה!</div>
          </>
        ) : isTie ? (
          <>
            <div className="text-4xl mb-2">🤝</div>
            <div className="font-black text-xl">תיקו בדו-קרב!</div>
            <div className="text-sm text-muted-foreground mt-1">שניהם קיבלו {max} נקודות</div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-2 animate-float">{winners[0].player.avatar_emoji}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              ניצח את הדו-קרב
            </div>
            <div className="text-2xl font-black">{winners[0].player.display_name}</div>
            <div className="text-gold font-black text-2xl mt-1">+{max} נק׳</div>
            {scored.length >= 2 &&
              scored
                .filter((s) => s.player.id !== winners[0].player.id)
                .map((s) => (
                  <div key={s.player.id} className="text-sm text-muted-foreground mt-2">
                    {s.player.display_name} קיבל {s.pts} נקודות
                  </div>
                ))}
          </>
        )}
      </div>
    </section>
  );
}
