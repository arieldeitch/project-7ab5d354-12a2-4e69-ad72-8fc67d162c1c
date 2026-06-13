import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getStandings,
  getMatchesByStage,
  getFinishedMatches,
  getUpcomingMatches,
  getMatchesByGroup,
} from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";
import { TeamBadge } from "@/components/TeamBadge";
import { teamLabel } from "@/lib/team-names";

export const Route = createFileRoute("/tournament")({
  head: () => ({ meta: [{ title: "הטורניר · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Tournament />
    </RequirePlayer>
  ),
});

const TABS = [
  { id: "groups", label: "טבלאות בתים" },
  { id: "group-view", label: "מרכז הבתים" },
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
      {tab === "group-view" && <GroupCenter />}
      {tab === "ko" && <Knockout />}
      {tab === "trophy" && <TrophyPage />}
    </AppShell>
  );
}

function Groups() {
  const fn = useServerFn(getStandings);
  const finishedFn = useServerFn(getFinishedMatches);
  const upcomingFn = useServerFn(getUpcomingMatches);
  const q = useQuery({ queryKey: ["standings"], queryFn: () => fn() });
  const finished = useQuery({ queryKey: ["finished", 10], queryFn: () => finishedFn({ data: { limit: 10 } }) });
  const upcoming = useQuery({ queryKey: ["upcoming", 8], queryFn: () => upcomingFn({ data: { limit: 8 } }) });
  const byGroup = new Map<string, any[]>();
  for (const s of q.data ?? []) {
    if (!byGroup.has(s.group_code)) byGroup.set(s.group_code, []);
    byGroup.get(s.group_code)!.push(s);
  }
  if (q.isLoading) {
    return <div className="card-stadium h-64 animate-pulse" />;
  }
  const hasStandings = byGroup.size > 0;
  return (
    <div className="space-y-5">
      {hasStandings ? (
        <>
          <div className="card-stadium p-3 text-[11px] text-muted-foreground flex items-center justify-center gap-3 flex-wrap">
            <span>🟢 מעפילה כרגע</span>
            <span>🟡 במאבק על העלייה</span>
            <span>🔴 מחוץ לתמונה</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from(byGroup.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, rows]) => (
                <div key={code} className="card-stadium p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-gold text-lg">בית {code}</h3>
                    <span className="text-[10px] text-muted-foreground">מש׳ · נצ׳ · תק׳ · הפ׳ · שע׳ · סע׳ · הפר׳ · נק׳</span>
                  </div>
                  <div className="divide-y divide-border">
                    {rows.map((r) => {
                      const dot = r.rank <= 2 ? "🟢" : r.rank === 3 ? "🟡" : "🔴";
                      return (
                        <div key={r.team_id} className="grid grid-cols-[auto_auto_minmax(0,1fr)_repeat(7,auto)] items-center gap-1.5 py-1.5 text-[11px]">
                          <span className="w-4 text-center font-bold text-muted-foreground">{r.rank}</span>
                          <span className="text-xs leading-none">{dot}</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TeamBadge team={r.team} size={22} className="border" />
                            <span className="text-xs font-bold truncate">{teamLabel(r.team)}</span>
                          </div>
                          <span className="tabular-nums text-muted-foreground w-5 text-center">{r.played}</span>
                          <span className="tabular-nums text-muted-foreground w-5 text-center">{r.wins}</span>
                          <span className="tabular-nums text-muted-foreground w-5 text-center">{r.draws}</span>
                          <span className="tabular-nums text-muted-foreground w-5 text-center">{r.losses}</span>
                          <span className="tabular-nums text-muted-foreground w-6 text-center">{r.goals_for}</span>
                          <span className="tabular-nums text-muted-foreground w-6 text-center">{r.goals_against}</span>
                          <span className="tabular-nums font-black text-gold w-7 text-center">{r.points}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="card-stadium p-5 text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h3 className="font-black mb-1">דירוג הבתים בדרך</h3>
          <p className="text-sm text-muted-foreground">
            הטבלאות יתעדכנו אוטומטית עם תחילת המשחקים. בינתיים — הנה כל מה שכבר קרה ומה שיהיה.
          </p>
        </div>
      )}

      {(finished.data?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-lg font-black text-gold mb-2">🏁 תוצאות אחרונות</h3>
          <div className="space-y-2">
            {finished.data!.slice(0, 6).map((m: any) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {(upcoming.data?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-lg font-black text-gold mb-2">⏭️ המשחקים הבאים</h3>
          <div className="space-y-2">
            {upcoming.data!.slice(0, 6).map((m: any) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
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

function GroupCenter() {
  const standingsFn = useServerFn(getStandings);
  const matchesFn = useServerFn(getMatchesByGroup);
  const standings = useQuery({ queryKey: ["standings"], queryFn: () => standingsFn() });

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const s of standings.data ?? []) set.add(s.group_code);
    return Array.from(set).sort();
  }, [standings.data]);

  const [selected, setSelected] = useState<string | null>(null);
  const active = selected ?? groups[0] ?? null;

  const groupMatches = useQuery({
    queryKey: ["group-matches", active],
    queryFn: () => matchesFn({ data: { group: active! } }),
    enabled: !!active,
  });

  if (standings.isLoading) return <div className="card-stadium h-64 animate-pulse" />;

  if (groups.length === 0) {
    return (
      <div className="card-stadium p-5 text-center">
        <div className="text-4xl mb-2">📋</div>
        <h3 className="font-black mb-1">הבתים עוד לא נקבעו</h3>
        <p className="text-sm text-muted-foreground">
          ברגע שהבתים יוגרלו ויעלו ל-API, המסך הזה יתעורר לחיים.
        </p>
      </div>
    );
  }

  const rows = (standings.data ?? []).filter((s: any) => s.group_code === active);
  const matches = groupMatches.data ?? [];
  const finishedMatches = matches.filter((m: any) => m.status === "finished");
  const upcomingMatches = matches.filter((m: any) => m.status !== "finished");
  const leader = rows.find((r: any) => r.rank === 1) ?? null;
  const goalsInGroup = finishedMatches.reduce(
    (acc: number, m: any) => acc + (m.home_score ?? 0) + (m.away_score ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* Group selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setSelected(g)}
            className={
              "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition " +
              (active === g ? "trophy-glow" : "bg-card border border-border")
            }
          >
            בית {g}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-stadium p-3 text-center">
          <div className="text-[10px] text-muted-foreground font-bold mb-1">מובילת הבית</div>
          <div className="text-sm font-black truncate">
            {leader ? teamLabel(leader.team) : "—"}
          </div>
        </div>
        <div className="card-stadium p-3 text-center">
          <div className="text-[10px] text-muted-foreground font-bold mb-1">שערים בבית</div>
          <div className="text-2xl font-black text-gold tabular-nums">{goalsInGroup}</div>
        </div>
        <div className="card-stadium p-3 text-center">
          <div className="text-[10px] text-muted-foreground font-bold mb-1">משחקים שהושלמו</div>
          <div className="text-2xl font-black text-gold tabular-nums">{finishedMatches.length}</div>
        </div>
      </div>

      {/* Standings table */}
      <div className="card-stadium p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-gold text-lg">טבלת בית {active}</h3>
          <span className="text-[10px] text-muted-foreground">מש׳ · נצ׳ · תק׳ · הפ׳ · שע׳ · סע׳ · הפר׳ · נק׳</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r: any) => {
            const dot = r.rank <= 2 ? "🟢" : r.rank === 3 ? "🟡" : "🔴";
            const gd = (r.goals_for ?? 0) - (r.goals_against ?? 0);
            return (
              <div
                key={r.team_id}
                className="grid grid-cols-[auto_auto_minmax(0,1fr)_repeat(8,auto)] items-center gap-1.5 py-1.5 text-[11px]"
              >
                <span className="w-4 text-center font-bold text-muted-foreground">{r.rank}</span>
                <span className="text-xs leading-none">{dot}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <TeamBadge team={r.team} size={22} className="border" />
                  <span className="text-xs font-bold truncate">{teamLabel(r.team)}</span>
                </div>
                <span className="tabular-nums text-muted-foreground w-5 text-center">{r.played}</span>
                <span className="tabular-nums text-muted-foreground w-5 text-center">{r.wins}</span>
                <span className="tabular-nums text-muted-foreground w-5 text-center">{r.draws}</span>
                <span className="tabular-nums text-muted-foreground w-5 text-center">{r.losses}</span>
                <span className="tabular-nums text-muted-foreground w-6 text-center">{r.goals_for}</span>
                <span className="tabular-nums text-muted-foreground w-6 text-center">{r.goals_against}</span>
                <span className="tabular-nums text-muted-foreground w-7 text-center">
                  <span dir="ltr">{gd > 0 ? `+${gd}` : gd}</span>
                </span>
                <span className="tabular-nums font-black text-gold w-7 text-center">{r.points}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group matches: finished + upcoming */}
      {finishedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-gold mb-2">🏁 תוצאות הבית</h3>
          <div className="space-y-2">
            {finishedMatches.map((m: any) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-gold mb-2">⏭️ משחקי הבית הקרובים</h3>
          <div className="space-y-2">
            {upcomingMatches.map((m: any) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
      {matches.length === 0 && !groupMatches.isLoading && (
        <div className="card-stadium p-4 text-center text-sm text-muted-foreground">
          עדיין אין משחקים שמשויכים לבית הזה.
        </div>
      )}
    </div>
  );
}

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