import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "טבלת האליפות · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Leaderboard />
    </RequirePlayer>
  ),
});

const SNAPSHOT_KEY_PREFIX = "wc_lb_";

function todayKey() {
  return SNAPSHOT_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

function Leaderboard() {
  const fn = useServerFn(getLeaderboard);
  const q = useQuery({ queryKey: ["lb"], queryFn: () => fn() });
  const rows = q.data ?? [];

  // Daily snapshot: compare today's ranks against start-of-day ranks
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!rows.length) return;
    const key = todayKey();
    const current: Record<string, number> = {};
    rows.forEach((r: any, i: number) => {
      current[r.player.name] = i + 1;
    });
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setPrevRanks(JSON.parse(stored));
      } else {
        // First check of today — save snapshot, no movement shown
        localStorage.setItem(key, JSON.stringify(current));
        setPrevRanks(current);
        // Clean up previous days
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith(SNAPSHOT_KEY_PREFIX) && k !== key) localStorage.removeItem(k);
        }
      }
    } catch {
      setPrevRanks(current);
    }
  }, [rows.length]);

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
        {rows.map((row: any, i: number) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
          const mv = movementFor(row.player.name, i + 1, prevRanks);
          return (
            <div key={row.player.id} className="p-3">
              <div className="flex items-center gap-3">
                {/* Rank + movement */}
                <div className="flex flex-col items-center w-10 shrink-0">
                  <span className="text-2xl leading-none">{medal}</span>
                  <span className={`text-[11px] font-black leading-none mt-0.5 ${mv.color}`}>{mv.icon}</span>
                </div>
                <span className="text-3xl shrink-0">{row.player.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg">{row.player.display_name}</div>
                  {/* Score breakdown */}
                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    <span>🎯 {row.winnerHits} מנצח</span>
                    <span>⚽ {row.exactScores} בול</span>
                    {row.bonusPointsTotal > 0 && <span>⭐ {row.bonusPointsTotal} בונוס</span>}
                  </div>
                  {/* Medals + achievements */}
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    🥇 {row.medals.gold} · 🥈 {row.medals.silver} · 🥉 {row.medals.bronze} · 🏆 {row.achievements}
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-2xl font-black text-gold tabular-nums">{row.player.total_points}</div>
                  <div className="text-[10px] text-muted-foreground">נקודות</div>
                </div>
              </div>
              {/* Point composition bar */}
              <ScoreBar
                winner={row.winnerPointsTotal}
                score={row.scorePointsTotal}
                bonus={row.bonusPointsTotal}
                bracket={row.bracketPoints}
                total={row.player.total_points}
              />
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function movementFor(playerName: string, currentRank: number, prevRanks: Record<string, number>) {
  const prev = prevRanks[playerName];
  if (!prev || prev === currentRank) return { icon: "➖", color: "text-muted-foreground" };
  if (currentRank < prev) return { icon: "⬆", color: "text-emerald-500" };
  return { icon: "⬇", color: "text-red-500" };
}

function ScoreBar({
  winner,
  score,
  bonus,
  bracket,
  total,
}: {
  winner: number;
  score: number;
  bonus: number;
  bracket: number;
  total: number;
}) {
  if (!total) return null;
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex rounded-full overflow-hidden h-2">
        {winner > 0 && (
          <div className="bg-primary" style={{ width: `${pct(winner)}%` }} title={`מנצח: ${winner}`} />
        )}
        {score > 0 && (
          <div className="bg-gold" style={{ width: `${pct(score)}%` }} title={`תוצאה: ${score}`} />
        )}
        {bonus > 0 && (
          <div className="bg-accent" style={{ width: `${pct(bonus)}%` }} title={`בונוס: ${bonus}`} />
        )}
        {bracket > 0 && (
          <div className="bg-muted-foreground" style={{ width: `${pct(bracket)}%` }} title={`בראקט: ${bracket}`} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
        {winner > 0 && <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-primary" /> מנצח {winner}</span>}
        {score > 0 && <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-gold" /> תוצאה {score}</span>}
        {bonus > 0 && <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-accent" /> בונוס {bonus}</span>}
        {bracket > 0 && <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" /> בראקט {bracket}</span>}
      </div>
    </div>
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
