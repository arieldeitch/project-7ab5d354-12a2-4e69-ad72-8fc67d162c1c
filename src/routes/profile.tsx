import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, getTeams, searchFootballPlayers } from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { usePlayer, PLAYER_META } from "@/lib/player-context";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "הפרופיל שלי · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Profile />
    </RequirePlayer>
  ),
});

function Profile() {
  const { active, setActive } = usePlayer();
  const meta = PLAYER_META[active!];
  const profileFn = useServerFn(getMyProfile);
  const teamsFn = useServerFn(getTeams);
  const playersFn = useServerFn(searchFootballPlayers);

  const profile = useQuery({ queryKey: ["profile", active], queryFn: () => profileFn({ data: { name: active! } }) });
  const teams = useQuery({ queryKey: ["teams"], queryFn: () => teamsFn() });
  const players = useQuery({ queryKey: ["players-all"], queryFn: () => playersFn({ data: {} }) });

  const p = profile.data?.player;
  const stats = profile.data?.stats;
  const bracket = profile.data?.bracket;
  const favTeam = teams.data?.find((t) => t.id === p?.favorite_team_id);
  const favPlayer = (players.data ?? []).find((x: any) => x.id === p?.favorite_player_id);
  const champion = teams.data?.find((t) => t.id === bracket?.champion_team_id);
  const boot = (players.data ?? []).find((x: any) => x.id === bracket?.golden_boot_player_id);
  const mvp = (players.data ?? []).find((x: any) => x.id === bracket?.mvp_player_id);

  const acc = stats && stats.predictionsMade > 0 ? Math.round((stats.winnerHits / stats.predictionsMade) * 100) : 0;

  return (
    <AppShell title={`הפרופיל של ${meta.display}`} subtitle="כל ההישגים שלך במקום אחד">
      <div className="card-stadium p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="trophy-glow h-20 w-20 rounded-3xl grid place-items-center text-4xl animate-shimmer-gold">{meta.emoji}</div>
          <div className="flex-1">
            <div className="text-2xl font-black">{meta.display}</div>
            <div className="text-xs text-muted-foreground">בן {meta.age}</div>
            <div className="text-3xl font-black text-gold tabular-nums mt-1">{p?.total_points ?? 0}</div>
            <div className="text-xs text-muted-foreground">נקודות סה״כ</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Stat label="תחזיות" value={stats?.predictionsMade ?? 0} />
        <Stat label="דיוק %" value={`${acc}%`} />
        <Stat label="תוצאות בול" value={stats?.exactScores ?? 0} />
        <Stat label="נקודות בראקט" value={stats?.bracketPoints ?? 0} />
      </div>

      <h2 className="text-lg font-black mb-2">🎖️ מדליות</h2>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <MedalBox emoji="🥇" label="זהב" value={stats?.medals.gold ?? 0} />
        <MedalBox emoji="🥈" label="כסף" value={stats?.medals.silver ?? 0} />
        <MedalBox emoji="🥉" label="ארד" value={stats?.medals.bronze ?? 0} />
      </div>

      <h2 className="text-lg font-black mb-2">⚽ ההעדפות שלי</h2>
      <div className="space-y-2 mb-5">
        <PrefRow label="נבחרת אהובה" value={favTeam?.name_he ?? favTeam?.name ?? "טרם נבחרה"} flag={favTeam?.flag_url} />
        <PrefRow label="שחקן אהוב" value={favPlayer?.name ?? "טרם נבחר"} flag={favPlayer?.photo_url} />
      </div>

      <h2 className="text-lg font-black mb-2">🏆 תחזיות הטורניר</h2>
      <div className="space-y-2 mb-5">
        <PrefRow label="האלוף שלי" value={champion?.name_he ?? champion?.name ?? "טרם נבחר"} flag={champion?.flag_url} />
        <PrefRow label="נעל הזהב" value={boot?.name ?? "טרם נבחר"} flag={boot?.photo_url} />
        <PrefRow label="MVP" value={mvp?.name ?? "טרם נבחר"} flag={mvp?.photo_url} />
      </div>

      <h2 className="text-lg font-black mb-2">⭐ הישגים</h2>
      <div className="card-stadium p-4 mb-5">
        {(profile.data?.achievements?.length ?? 0) === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            עוד אין הישגים. בצעו תחזיות והכניסו גולים! 🎯
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {profile.data!.achievements.map((a: any) => (
              <div key={a.id} className="rounded-xl bg-card border border-border p-3 text-center">
                <div className="text-3xl mb-1">{a.icon ?? "🏅"}</div>
                <div className="text-xs font-bold">{a.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-6">
        <Link to="/setup" className="flex-1 text-center py-3 rounded-2xl bg-card border border-border font-bold">
          ✏️ עריכת פרופיל
        </Link>
        <Link to="/bracket" className="flex-1 text-center py-3 rounded-2xl pitch-bg font-bold">
          🏆 הבראקט שלי
        </Link>
      </div>

      <button
        onClick={() => {
          setActive(null);
          window.location.href = "/select-player";
        }}
        className="mt-3 w-full py-3 rounded-2xl bg-card border border-border text-sm font-bold text-muted-foreground"
      >
        החלף שחקן
      </button>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-stadium p-3 text-center">
      <div className="text-2xl font-black tabular-nums text-gold">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function MedalBox({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="card-stadium p-3 text-center">
      <div className="text-3xl mb-1">{emoji}</div>
      <div className="text-xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function PrefRow({ label, value, flag }: { label: string; value: string; flag?: string | null }) {
  return (
    <div className="card-stadium p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
        {flag ? <img src={flag} alt="" className="h-full w-full object-cover" /> : <span className="text-xl grid place-items-center h-full">🏳️</span>}
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}