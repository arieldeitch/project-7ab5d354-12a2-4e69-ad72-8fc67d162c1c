import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "טבלת האליפות · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Leaderboard />
    </RequirePlayer>
  ),
});

function Leaderboard() {
  const fn = useServerFn(getLeaderboard);
  const q = useQuery({ queryKey: ["lb"], queryFn: () => fn() });
  const rows = q.data ?? [];

  const tom = rows.find((r: any) => r.player.name === "tom");
  const rony = rows.find((r: any) => r.player.name === "rony");

  return (
    <AppShell title="טבלת האליפות" subtitle="האתגר המשפחתי - תום מול רוני">
      {rows[0] && (
        <div className="trophy-glow rounded-3xl p-6 text-center mb-6 animate-shimmer-gold">
          <div className="text-5xl mb-2 animate-float">{rows[0].player.avatar_emoji}</div>
          <div className="text-sm font-bold opacity-80">המוביל כרגע</div>
          <div className="text-3xl font-black">{rows[0].player.display_name}</div>
          <div className="text-4xl font-black tabular-nums mt-1">{rows[0].player.total_points} נק׳</div>
        </div>
      )}

      {tom && rony && (
        <div className="card-stadium p-4 mb-6">
          <h2 className="text-lg font-black mb-3 text-center">⚔️ ראש בראש</h2>
          <div className="grid grid-cols-2 gap-3">
            <PlayerCol p={tom} />
            <PlayerCol p={rony} />
          </div>
          <CompareRow label="נקודות" tom={tom.player.total_points} rony={rony.player.total_points} />
          <CompareRow label="תחזיות" tom={tom.predictions} rony={rony.predictions} />
          <CompareRow label="תוצאות בול" tom={tom.exactScores} rony={rony.exactScores} />
          <CompareRow label="ניחושי מנצח" tom={tom.winnerHits} rony={rony.winnerHits} />
          <CompareRow label="מדליות זהב" tom={tom.medals.gold} rony={rony.medals.gold} />
          <CompareRow label="הישגים" tom={tom.achievements} rony={rony.achievements} />
          <CompareRow label="נקודות בראקט" tom={tom.bracketPoints} rony={rony.bracketPoints} />
        </div>
      )}

      <h2 className="text-lg font-black mb-2">🏅 כל השחקנים</h2>
      <div className="card-stadium divide-y divide-border">
        {rows.map((row: any, i: number) => (
          <div key={row.player.id} className="flex items-center gap-3 p-3">
            <span className="text-2xl w-8 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
            <span className="text-3xl">{row.player.avatar_emoji}</span>
            <div className="flex-1">
              <div className="font-black text-lg">{row.player.display_name}</div>
              <div className="text-xs text-muted-foreground">
                🥇 {row.medals.gold} · 🥈 {row.medals.silver} · 🥉 {row.medals.bronze} · 🏆 {row.achievements}
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-gold tabular-nums">{row.player.total_points}</div>
              <div className="text-[10px] text-muted-foreground">נקודות</div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function PlayerCol({ p }: { p: any }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-1 animate-float">{p.player.avatar_emoji}</div>
      <div className="font-black">{p.player.display_name}</div>
      <div className="text-xs text-muted-foreground">בן {p.player.age}</div>
    </div>
  );
}

function CompareRow({ label, tom, rony }: { label: string; tom: number; rony: number }) {
  const lead = tom === rony ? "tie" : tom > rony ? "tom" : "rony";
  return (
    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 mt-2 text-sm">
      <div className={"text-center font-black tabular-nums " + (lead === "tom" ? "text-gold text-lg" : "")}>{tom}</div>
      <div className="text-[11px] text-muted-foreground px-2">{label}</div>
      <div className={"text-center font-black tabular-nums " + (lead === "rony" ? "text-gold text-lg" : "")}>{rony}</div>
    </div>
  );
}