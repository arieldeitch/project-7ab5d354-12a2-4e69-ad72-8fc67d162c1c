import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getUpcomingMatches,
  getMyPredictions,
  savePrediction,
  searchFootballPlayers,
} from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { MatchCard, CountdownBadge } from "@/components/MatchCard";
import { usePlayer } from "@/lib/player-context";
import { toast } from "sonner";
import { Confetti } from "@/components/Confetti";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "התחזיות שלי · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Predictions />
    </RequirePlayer>
  ),
});

function Predictions() {
  const { active } = usePlayer();
  const playerName = active!;
  const upcomingFn = useServerFn(getUpcomingMatches);
  const predsFn = useServerFn(getMyPredictions);
  const saveFn = useServerFn(savePrediction);
  const playersFn = useServerFn(searchFootballPlayers);

  const upcoming = useQuery({ queryKey: ["upcoming-all"], queryFn: () => upcomingFn({ data: { limit: 60 } }) });
  const preds = useQuery({ queryKey: ["preds", playerName], queryFn: () => predsFn({ data: { playerName } }) });
  const players = useQuery({ queryKey: ["players-all"], queryFn: () => playersFn({ data: {} }) });

  const [openId, setOpenId] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState<number | null>(null);

  const predByMatch = new Map((preds.data ?? []).map((p: any) => [p.match_id, p]));

  const save = useMutation({
    mutationFn: (data: any) => saveFn({ data: { playerName, ...data } }),
    onSuccess: () => {
      toast.success("תחזית נשמרה! 🎯");
      setCelebrate(Date.now());
      preds.refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "לא הצלחנו לשמור"),
  });

  return (
    <AppShell title="התחזיות שלי" subtitle="ערכו עד שריקת הפתיחה — אחר כך נעול!">
      <Confetti trigger={celebrate} />
      {upcoming.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-stadium h-40 animate-pulse" />
          ))}
        </div>
      ) : (upcoming.data?.length ?? 0) === 0 ? (
        <div className="card-stadium p-6 text-center text-sm text-muted-foreground">
          ⚽ אין משחקים פתוחים לתחזית. ריענון יביא את המשחקים הקרובים.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.data!.map((m: any) => {
            const existing = predByMatch.get(m.id);
            const open = openId === m.id;
            return (
              <div key={m.id}>
                <MatchCard
                  match={m}
                  onClick={() => setOpenId(open ? null : m.id)}
                  highlight={!!existing}
                  footer={
                    <div className="flex items-center justify-between text-xs">
                      <CountdownBadge kickoff={m.kickoff_at} />
                      <span
                        className={
                          "px-3 py-1 rounded-lg font-bold " +
                          (existing ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
                        }
                      >
                        {existing ? "✓ נמסרה" : "📝 פתח"}
                      </span>
                    </div>
                  }
                />
                {open && (
                  <PredictionForm
                    match={m}
                    existing={existing}
                    players={players.data ?? []}
                    onSave={(d) => save.mutate({ matchId: m.id, ...d })}
                    busy={save.isPending}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function PredictionForm({
  match,
  existing,
  players,
  onSave,
  busy,
}: {
  match: any;
  existing: any;
  players: any[];
  onSave: (d: any) => void;
  busy: boolean;
}) {
  const [winner, setWinner] = useState<"home" | "draw" | "away" | null>(existing?.winner ?? null);
  const [home, setHome] = useState<number>(existing?.home_score ?? 1);
  const [away, setAway] = useState<number>(existing?.away_score ?? 1);
  const [firstScorer, setFirstScorer] = useState<number | null>(existing?.first_scorer_id ?? null);
  const [anytime, setAnytime] = useState<number | null>(existing?.anytime_scorer_id ?? null);
  const [over, setOver] = useState<boolean | null>(existing?.over_2_5 ?? null);
  const [btts, setBtts] = useState<boolean | null>(existing?.both_teams_score ?? null);

  const teamPlayers = players.filter(
    (p: any) => p.team_id === match.home_team_id || p.team_id === match.away_team_id,
  );
  const pickerList = teamPlayers.length > 0 ? teamPlayers : players.slice(0, 40);

  return (
    <div className="card-stadium p-4 mt-2 animate-pop-in space-y-5">
      {/* Winner */}
      <div>
        <div className="text-sm font-bold mb-2">מי ינצח?</div>
        <div className="grid grid-cols-3 gap-2">
          {(["home", "draw", "away"] as const).map((w) => {
            const label =
              w === "home"
                ? teamLabel(match.home_team)
                : w === "away"
                  ? teamLabel(match.away_team)
                  : "תיקו";
            return (
              <button
                key={w}
                onClick={() => setWinner(w)}
                className={
                  "py-2.5 rounded-xl text-sm font-bold transition " +
                  (winner === w
                    ? "trophy-glow scale-105"
                    : "bg-card border border-border hover:scale-105")
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score */}
      <div>
        <div className="text-sm font-bold mb-2">תוצאה מדויקת</div>
        <div className="flex items-center justify-center gap-3">
          <ScoreSpinner value={home} setValue={setHome} label={teamLabel(match.home_team, "בית")} />
          <span className="text-3xl font-black text-muted-foreground">-</span>
          <ScoreSpinner value={away} setValue={setAway} label={teamLabel(match.away_team, "חוץ")} />
        </div>
      </div>

      {/* Goals over/under */}
      <div>
        <div className="text-sm font-bold mb-2">סך השערים</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, label: "מעל 2.5 ⚡" },
            { v: false, label: "מתחת 2.5 🛡️" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => setOver(o.v)}
              className={
                "py-2 rounded-xl text-sm font-bold transition " +
                (over === o.v ? "pitch-bg scale-105" : "bg-card border border-border")
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* BTTS */}
      <div>
        <div className="text-sm font-bold mb-2">שתי הקבוצות יבקיעו?</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, label: "כן 🎯" },
            { v: false, label: "לא 🚫" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => setBtts(o.v)}
              className={
                "py-2 rounded-xl text-sm font-bold transition " +
                (btts === o.v ? "championship-bg scale-105" : "bg-card border border-border")
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scorers */}
      {pickerList.length > 0 && (
        <>
          <ScorerSelect title="המבקיע הראשון" players={pickerList} value={firstScorer} onChange={setFirstScorer} />
          <ScorerSelect title="מבקיע מתישהו" players={pickerList} value={anytime} onChange={setAnytime} />
        </>
      )}

      <button
        onClick={() =>
          onSave({
            winner,
            home_score: home,
            away_score: away,
            first_scorer_id: firstScorer,
            anytime_scorer_id: anytime,
            over_2_5: over,
            both_teams_score: btts,
          })
        }
        disabled={busy}
        className="trophy-glow w-full py-3 rounded-xl font-black text-lg disabled:opacity-50"
      >
        {busy ? "שומר..." : "💾 שמור תחזית"}
      </button>
    </div>
  );
}

function ScoreSpinner({ value, setValue, label }: { value: number; setValue: (n: number) => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">{label}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setValue(Math.max(0, value - 1))} className="h-9 w-9 rounded-full bg-card border border-border font-black">−</button>
        <div className="text-4xl font-black tabular-nums w-10 text-center text-gold">{value}</div>
        <button onClick={() => setValue(Math.min(15, value + 1))} className="h-9 w-9 rounded-full bg-card border border-border font-black">+</button>
      </div>
    </div>
  );
}

function ScorerSelect({
  title,
  players,
  value,
  onChange,
}: {
  title: string;
  players: any[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  return (
    <div>
      <div className="text-sm font-bold mb-2">{title}</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => onChange(null)}
          className={
            "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap " +
            (value === null ? "bg-muted" : "bg-card border border-border")
          }
        >
          דלג
        </button>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition " +
              (value === p.id ? "trophy-glow" : "bg-card border border-border")
            }
          >
            {p.name_he ?? p.name}
          </button>
        ))}
      </div>
    </div>
  );
}