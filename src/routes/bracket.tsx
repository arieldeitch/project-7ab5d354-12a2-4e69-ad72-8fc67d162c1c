import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getTeams, searchFootballPlayers, getBracket, saveBracket } from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { TeamPicker } from "@/components/TeamPicker";
import { PlayerPicker } from "@/components/PlayerPicker";
import { usePlayer } from "@/lib/player-context";
import { toast } from "sonner";

export const Route = createFileRoute("/bracket")({
  head: () => ({ meta: [{ title: "בראקט המונדיאל · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Bracket />
    </RequirePlayer>
  ),
});

function Bracket() {
  const { active } = usePlayer();
  const playerName = active!;
  const teamsFn = useServerFn(getTeams);
  const playersFn = useServerFn(searchFootballPlayers);
  const bracketFn = useServerFn(getBracket);
  const saveFn = useServerFn(saveBracket);

  const teams = useQuery({ queryKey: ["teams"], queryFn: () => teamsFn() });
  const players = useQuery({ queryKey: ["players-all"], queryFn: () => playersFn({ data: {} }) });
  const bracket = useQuery({ queryKey: ["bracket", playerName], queryFn: () => bracketFn({ data: { playerName } }) });

  const [champion, setChampion] = useState<number | null>(null);
  const [runnerUp, setRunnerUp] = useState<number | null>(null);
  const [third, setThird] = useState<number | null>(null);
  const [boot, setBoot] = useState<number | null>(null);
  const [mvp, setMvp] = useState<number | null>(null);
  const [openField, setOpenField] = useState<string | null>("champion");

  useEffect(() => {
    if (bracket.data) {
      setChampion(bracket.data.champion_team_id ?? null);
      setRunnerUp(bracket.data.runner_up_team_id ?? null);
      setThird(bracket.data.third_place_team_id ?? null);
      setBoot(bracket.data.golden_boot_player_id ?? null);
      setMvp(bracket.data.mvp_player_id ?? null);
    }
  }, [bracket.data]);

  const save = useMutation({
    mutationFn: (data: any) => saveFn({ data: { playerName, ...data } }),
    onSuccess: () => {
      toast.success("הבראקט עודכן! 🏆");
      bracket.refetch();
    },
    onError: () => toast.error("בעיה בשמירה"),
  });

  const teamName = (id: number | null) => {
    if (!id) return "טרם נבחר";
    const t = teams.data?.find((x) => x.id === id);
    return t?.name_he ?? t?.name ?? "—";
  };
  const playerName2 = (id: number | null) => {
    if (!id) return "טרם נבחר";
    const p = players.data?.find((x) => x.id === id);
    return p?.name_he ?? p?.name ?? "—";
  };

  const fields = [
    { id: "champion", label: "🏆 אלוף המונדיאל", value: champion, set: setChampion, kind: "team", points: 100, display: teamName },
    { id: "runner", label: "🥈 סגן האלוף", value: runnerUp, set: setRunnerUp, kind: "team", points: 25, display: teamName },
    { id: "third", label: "🥉 מקום שלישי", value: third, set: setThird, kind: "team", points: 15, display: teamName },
    { id: "boot", label: "👟 נעל הזהב", value: boot, set: setBoot, kind: "player", points: 50, display: playerName2 },
    { id: "mvp", label: "⭐ MVP", value: mvp, set: setMvp, kind: "player", points: 50, display: playerName2 },
  ] as const;

  return (
    <AppShell title="בראקט המונדיאל שלי" subtitle="חיזוי האלופה הגדולה - 100 נקודות מחכות!">
      <div className="space-y-3">
        {fields.map((f) => {
          const isOpen = openField === f.id;
          return (
            <div key={f.id} className="card-stadium overflow-hidden">
              <button
                onClick={() => setOpenField(isOpen ? null : f.id)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="text-right">
                  <div className="text-sm font-black">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.display(f.value)}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gold font-black">+{f.points} נק׳</div>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3 animate-pop-in">
                  {f.kind === "team" ? (
                    <TeamPicker teams={teams.data ?? []} value={f.value} onChange={f.set} />
                  ) : (
                    <PlayerPicker players={players.data ?? []} value={f.value} onChange={f.set} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() =>
          save.mutate({
            champion_team_id: champion,
            runner_up_team_id: runnerUp,
            third_place_team_id: third,
            golden_boot_player_id: boot,
            mvp_player_id: mvp,
          })
        }
        disabled={save.isPending}
        className="trophy-glow w-full py-3 mt-5 rounded-2xl font-black text-lg disabled:opacity-50"
      >
        💾 שמור את הבראקט שלי
      </button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        ⚠️ הבראקט ננעל בסוף שלב הבתים. עד אז ניתן לערוך חופשי.
      </p>
    </AppShell>
  );
}