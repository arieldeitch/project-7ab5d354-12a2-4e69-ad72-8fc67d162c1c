import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStandings, getMatchesByStage } from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";

export const Route = createFileRoute("/tournament")({
  head: () => ({ meta: [{ title: "הטורניר · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Tournament />
    </RequirePlayer>
  ),
});

const TABS = [
  { id: "groups", label: "שלב הבתים" },
  { id: "ko", label: "נוקאאוט" },
  { id: "trophy", label: "הגביע 🏆" },
] as const;

function Tournament() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("groups");
  return (
    <AppShell title="הטורניר" subtitle="כל מה שקורה במונדיאל 2026">
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition " +
              (tab === t.id ? "trophy-glow" : "bg-card border border-border")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "groups" && <Groups />}
      {tab === "ko" && <Knockout />}
      {tab === "trophy" && <TrophyPage />}
    </AppShell>
  );
}

function Groups() {
  const fn = useServerFn(getStandings);
  const q = useQuery({ queryKey: ["standings"], queryFn: () => fn() });
  const byGroup = new Map<string, any[]>();
  for (const s of q.data ?? []) {
    if (!byGroup.has(s.group_code)) byGroup.set(s.group_code, []);
    byGroup.get(s.group_code)!.push(s);
  }
  if (q.isLoading) {
    return <div className="card-stadium h-64 animate-pulse" />;
  }
  if (byGroup.size === 0) {
    return (
      <div className="card-stadium p-6 text-center text-sm text-muted-foreground">
        ⚽ עוד אין נתוני דירוג. הם יעודכנו אוטומטית כשהמשחקים יתחילו.
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {Array.from(byGroup.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, rows]) => (
          <div key={code} className="card-stadium p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-gold text-lg">בית {code}</h3>
              <span className="text-[10px] text-muted-foreground">משחקים · נק׳</span>
            </div>
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div key={r.team_id} className="flex items-center gap-2 py-1.5">
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">{r.rank}</span>
                  <img
                    src={r.team?.flag_url ?? r.team?.logo_url ?? ""}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover bg-muted"
                  />
                  <span className="flex-1 text-sm font-bold truncate">{r.team?.name_he ?? r.team?.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{r.played}</span>
                  <span className="text-sm font-black tabular-nums text-gold w-7 text-left">{r.points}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

const KO_STAGES = [
  { id: "round_of_32", label: "שמינית הגמר המוקדמת" },
  { id: "round_of_16", label: "שמינית הגמר" },
  { id: "quarter_final", label: "רבע הגמר" },
  { id: "semi_final", label: "חצי הגמר" },
  { id: "third_place", label: "מקום שלישי" },
  { id: "final", label: "הגמר 🏆" },
] as const;

function Knockout() {
  const fn = useServerFn(getMatchesByStage);
  return (
    <div className="space-y-5">
      {KO_STAGES.map((s) => (
        <StageBlock key={s.id} stage={s.id} label={s.label} fn={fn} />
      ))}
    </div>
  );
}

function StageBlock({ stage, label, fn }: { stage: string; label: string; fn: any }) {
  const q = useQuery({ queryKey: ["stage", stage], queryFn: () => fn({ data: { stage } }) });
  const rows = q.data ?? [];
  if (q.isLoading) return null;
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-black text-gold mb-2">{label}</h3>
      <div className="space-y-2">
        {rows.map((m: any) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function TrophyPage() {
  const fn = useServerFn(getMatchesByStage);
  const finals = useQuery({ queryKey: ["stage", "final"], queryFn: () => fn({ data: { stage: "final" } }) });
  const f = finals.data?.[0];
  return (
    <div className="card-stadium p-6 text-center">
      <div className="text-7xl animate-float mb-2">🏆</div>
      <h2 className="text-3xl font-black text-gold mb-1">גביע העולם</h2>
      <p className="text-sm text-muted-foreground mb-4">השאיפה הגדולה של 32 הנבחרות</p>
      {f ? (
        <div className="mt-4">
          <MatchCard match={f} />
          {f.status === "finished" && (
            <div className="mt-4 trophy-glow rounded-2xl p-4 animate-shimmer-gold">
              <div className="text-sm font-bold">האלוף:</div>
              <div className="text-2xl font-black">
                {f.home_score! > f.away_score! ? f.home_team?.name_he ?? f.home_team?.name : f.away_team?.name_he ?? f.away_team?.name}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">הגמר עדיין רחוק... כל משחק חשוב!</p>
      )}
    </div>
  );
}