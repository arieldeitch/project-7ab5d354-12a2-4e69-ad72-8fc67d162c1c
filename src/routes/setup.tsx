import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTeams,
  searchFootballPlayers,
  updatePlayerProfile,
  saveBracket,
  getMyProfile,
  refreshWorldCupData,
} from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { usePlayer, PLAYER_META } from "@/lib/player-context";
import { TeamPicker } from "@/components/TeamPicker";
import { PlayerPicker } from "@/components/PlayerPicker";
import { Confetti } from "@/components/Confetti";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "התחלה · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Setup />
    </RequirePlayer>
  ),
});

const STEPS = ["נבחרת אהובה", "שחקן אהוב", "האלוף שלי", "מלך השערים", "מצטיין"] as const;

function Setup() {
  const { active } = usePlayer();
  const playerName = active!;
  const meta = PLAYER_META[playerName];
  const navigate = useNavigate();

  const teamsFn = useServerFn(getTeams);
  const playersFn = useServerFn(searchFootballPlayers);
  const refreshFn = useServerFn(refreshWorldCupData);
  const updateFn = useServerFn(updatePlayerProfile);
  const saveBracketFn = useServerFn(saveBracket);
  const profileFn = useServerFn(getMyProfile);

  const teams = useQuery({ queryKey: ["teams"], queryFn: () => teamsFn() });
  const players = useQuery({ queryKey: ["players-all"], queryFn: () => playersFn({ data: {} }) });
  const profile = useQuery({
    queryKey: ["profile", playerName],
    queryFn: () => profileFn({ data: { name: playerName } }),
  });

  const [step, setStep] = useState(0);
  const [favTeam, setFavTeam] = useState<number | null>(profile.data?.player.favorite_team_id ?? null);
  const [favPlayer, setFavPlayer] = useState<number | null>(profile.data?.player.favorite_player_id ?? null);
  const [champion, setChampion] = useState<number | null>(profile.data?.bracket?.champion_team_id ?? null);
  const [goldenBoot, setGoldenBoot] = useState<number | null>(profile.data?.bracket?.golden_boot_player_id ?? null);
  const [mvp, setMvp] = useState<number | null>(profile.data?.bracket?.mvp_player_id ?? null);
  const [celebrate, setCelebrate] = useState<number | null>(null);

  const noTeams = !teams.isLoading && (teams.data?.length ?? 0) === 0;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    try {
      await updateFn({ data: { name: playerName, favorite_team_id: favTeam, favorite_player_id: favPlayer } });
      await saveBracketFn({
        data: {
          playerName,
          champion_team_id: champion,
          golden_boot_player_id: goldenBoot,
          mvp_player_id: mvp,
        },
      });
      setCelebrate(Date.now());
      toast.success("הפרופיל מוכן! קדימה למונדיאל");
      setTimeout(() => navigate({ to: "/home" }), 1400);
    } catch (e) {
      toast.error("בעיה בשמירת הפרופיל, נסה שוב");
      console.error("finish() failed:", e);
    }
  };

  const runRefresh = async () => {
    toast.loading("מביא את נבחרות ושחקני המונדיאל...", { id: "ref" });
    try {
      const r = await refreshFn();
      toast.success(`נטענו ${r.teams} נבחרות, ${r.fixtures} משחקים`, { id: "ref" });
      await teams.refetch();
      await players.refetch();
    } catch (e) {
      toast.error("בעיה בטעינת הנתונים", { id: "ref" });
      console.error(e);
    }
  };

  return (
    <div className="min-h-dvh stadium-grid px-4 py-8 pb-32">
      <Confetti trigger={celebrate} />
      <div className="mx-auto max-w-xl">
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="trophy-glow h-12 w-12 rounded-2xl grid place-items-center text-2xl">{meta.emoji}</span>
            <h1 className="text-2xl font-black">היי {meta.display}, בוא נכין את הפרופיל</h1>
          </div>
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === step ? "w-8 bg-secondary" : i < step ? "w-4 bg-primary" : "w-4 bg-muted")
                }
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            שלב {step + 1} מתוך {STEPS.length}: {STEPS[step]}
          </p>
        </header>

        {noTeams && (
          <div className="card-stadium p-4 mb-4 text-center">
            <p className="text-sm mb-3">עוד אין נבחרות בבסיס הנתונים. נטען עכשיו את כל נבחרות המונדיאל?</p>
            <button
              onClick={runRefresh}
              className="trophy-glow px-5 py-2 rounded-xl font-bold"
            >
              ⚡ טען נתוני מונדיאל
            </button>
          </div>
        )}

        <div className="card-stadium p-4 animate-pop-in" key={step}>
          {step === 0 && (
            <>
              <h2 className="text-xl font-black mb-3">איזו נבחרת את/ה הכי אוהב/ת?</h2>
              <TeamPicker teams={teams.data ?? []} value={favTeam} onChange={setFavTeam} />
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-xl font-black mb-3">השחקן האהוב עליך</h2>
              <PlayerPicker players={players.data ?? []} value={favPlayer} onChange={setFavPlayer} />
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-xl font-black mb-1">מי תרים את הגביע?</h2>
              <p className="text-xs text-muted-foreground mb-3">
                ניחוש האלוף שווה <span className="text-gold font-bold">100 נקודות</span>!
              </p>
              <TeamPicker teams={teams.data ?? []} value={champion} onChange={setChampion} />
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-xl font-black mb-1">מי יקח את נעל הזהב?</h2>
              <p className="text-xs text-muted-foreground mb-3">המבקיע הגדול של המונדיאל</p>
              <PlayerPicker players={players.data ?? []} value={goldenBoot} onChange={setGoldenBoot} />
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-xl font-black mb-1">מי יהיה השחקן הכי טוב בטורניר?</h2>
              <p className="text-xs text-muted-foreground mb-3">השחקן המצטיין ביותר בטורניר</p>
              <PlayerPicker players={players.data ?? []} value={mvp} onChange={setMvp} />
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <button
            onClick={back}
            disabled={step === 0}
            className="px-5 py-2.5 rounded-xl bg-card border border-border font-bold disabled:opacity-40"
          >
            ← חזרה
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 transition"
            >
              הבא →
            </button>
          ) : (
            <button
              onClick={finish}
              className="trophy-glow px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition"
            >
              סיימתי! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}