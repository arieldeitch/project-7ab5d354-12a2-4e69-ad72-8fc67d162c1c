import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getStandings,
  getMatchesByStage,
  getMatchesByGroup,
  getAllGroupMatches,
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
  const navigate = useNavigate();
  const toMatch = (id: number) => navigate({ to: "/match/$matchId", params: { matchId: String(id) } });
  const standingsFn = useServerFn(getStandings);
  const groupMatchesFn = useServerFn(getAllGroupMatches);
  const q = useQuery({ queryKey: ["standings"], queryFn: () => standingsFn() });
  const gm = useQuery({ queryKey: ["all-group-matches"], queryFn: () => groupMatchesFn() });

  const byGroup = new Map<string, any[]>();
  for (const s of q.data ?? []) {
    if (!byGroup.has(s.group_code)) byGroup.set(s.group_code, []);
    byGroup.get(s.group_code)!.push(s);
  }

  const finishedByGroup = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const m of gm.data ?? []) {
      if (m.status !== "finished" || !m.group_code) continue;
      if (!map.has(m.group_code)) map.set(m.group_code, []);
      map.get(m.group_code)!.push(m);
    }
    return map;
  }, [gm.data]);

  if (q.isLoading) {
    return <div className="card-stadium h-64 animate-pulse" />;
  }
  const hasStandings = byGroup.size > 0;
  return (
    <div className="space-y-4">
      {hasStandings ? (
        <>
          <div className="card-stadium p-3 text-[11px] text-muted-foreground flex items-center justify-center gap-4 flex-wrap">
            <span>🟢 מעפילה</span>
            <span>🟡 במאבק</span>
            <span>🔴 בחוץ</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from(byGroup.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, rows]) => {
                const recentMatches = (finishedByGroup.get(code) ?? []).slice(0, 3);
                return (
                  <div key={code} className="card-stadium overflow-hidden">
                    {/* Group header */}
                    <div className="px-4 pt-3 pb-1">
                      <h3 className="font-black text-gold text-xl">בית {code}</h3>
                    </div>

                    {/* Column headers — same grid as data rows for alignment */}
                    <div
                      className="grid items-center px-2 pb-1 gap-x-2 text-[10px] text-muted-foreground border-b border-border"
                      style={{ gridTemplateColumns: "1.75rem 1fr auto auto auto auto auto" }}
                    >
                      <span />
                      <span />
                      <span className="hidden sm:block w-5 text-center">נצ׳</span>
                      <span className="hidden sm:block w-5 text-center">ת׳</span>
                      <span className="hidden sm:block w-5 text-center">הפ׳</span>
                      <span className="w-7 text-center">הפר׳</span>
                      <span className="w-8 text-center font-bold">נק׳</span>
                    </div>

                    {/* Standings rows */}
                    <div className="divide-y divide-border/60 px-2">
                      {rows.map((r) => {
                        const qualifier = r.rank <= 2 ? "🟢" : r.rank === 3 ? "🟡" : "🔴";
                        const gd = (r.goals_for ?? 0) - (r.goals_against ?? 0);
                        return (
                          <div
                            key={r.team_id}
                            className="grid items-center py-2 gap-x-2 text-[12px]"
                            style={{ gridTemplateColumns: "1.75rem 1fr auto auto auto auto auto" }}
                          >
                            {/* Rank — dominant */}
                            <span className="text-base font-black text-center leading-none">{r.rank}</span>

                            {/* Team: flag + name + qualifier */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <TeamBadge team={r.team} size={24} className="border shrink-0" />
                              <span className="font-bold leading-tight truncate">{teamLabel(r.team)}</span>
                              <span className="text-[10px] leading-none shrink-0">{qualifier}</span>
                            </div>

                            {/* W D L — desktop only */}
                            <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.wins}</span>
                            <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.draws}</span>
                            <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.losses}</span>

                            {/* GD — always visible */}
                            <span className="tabular-nums text-muted-foreground w-7 text-center" dir="ltr">
                              {gd > 0 ? `+${gd}` : gd}
                            </span>

                            {/* Points — emphasized */}
                            <span className="tabular-nums font-black text-gold text-base w-8 text-center">{r.points}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Latest completed matches */}
                    {recentMatches.length > 0 && (
                      <div className="border-t border-border/60 mt-1 px-3 py-2 bg-muted/30 space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground mb-1.5">🏁 תוצאות אחרונות</div>
                        {recentMatches.map((m: any) => {
                          const hs = m.home_score ?? 0;
                          const as_ = m.away_score ?? 0;
                          return (
                            <button
                              key={m.id}
                              onClick={() => toMatch(m.id)}
                              className="w-full flex items-center gap-2 py-0.5 hover:opacity-80 active:scale-[0.98] transition text-[11px]"
                            >
                              {/* DOM order: home, score-pill, away → RTL renders away | pill | home */}
                              <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                <span className="font-bold truncate">{teamLabel(m.home_team)}</span>
                                <TeamBadge team={m.home_team} size={16} className="border shrink-0" />
                              </div>
                              <span
                                dir="ltr"
                                className="shrink-0 tabular-nums font-black bg-card border border-border rounded-md px-2 py-0.5 text-[11px]"
                              >
                                {as_} – {hs}
                              </span>
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <TeamBadge team={m.away_team} size={16} className="border shrink-0" />
                                <span className="font-bold truncate">{teamLabel(m.away_team)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      ) : (
        <div className="card-stadium p-5 text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h3 className="font-black mb-1">דירוג הבתים בדרך</h3>
          <p className="text-sm text-muted-foreground">
            הטבלאות יתעדכנו אוטומטית עם תחילת המשחקים.
          </p>
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
  const navigate = useNavigate();
  const toMatch = (id: number) => navigate({ to: "/match/$matchId", params: { matchId: String(id) } });
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
          <span className="text-[10px] text-muted-foreground hidden sm:block">מש׳ · נצ׳ · תק׳ · הפ׳ · שע׳ · סע׳ · הפר׳ · נק׳</span>
          <span className="text-[10px] text-muted-foreground sm:hidden">נק׳</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r: any) => {
            const dot = r.rank <= 2 ? "🟢" : r.rank === 3 ? "🟡" : "🔴";
            const gd = (r.goals_for ?? 0) - (r.goals_against ?? 0);
            return (
              <div
                key={r.team_id}
                className="grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_minmax(0,1fr)_repeat(8,auto)] items-center gap-1.5 py-1.5 text-[11px]"
              >
                <span className="w-4 text-center font-bold text-muted-foreground">{r.rank}</span>
                <span className="text-xs leading-none">{dot}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <TeamBadge team={r.team} size={22} className="border shrink-0" />
                  <span className="text-xs font-bold leading-tight">{teamLabel(r.team)}</span>
                </div>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.played}</span>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.wins}</span>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.draws}</span>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-5 text-center">{r.losses}</span>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-6 text-center">{r.goals_for}</span>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-6 text-center">{r.goals_against}</span>
                <span className="hidden sm:block tabular-nums text-muted-foreground w-7 text-center">
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
              <MatchCard key={m.id} match={m} onClick={() => toMatch(m.id)} />
            ))}
          </div>
        </div>
      )}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-gold mb-2">⏭️ משחקי הבית הקרובים</h3>
          <div className="space-y-2">
            {upcomingMatches.map((m: any) => (
              <MatchCard key={m.id} match={m} onClick={() => toMatch(m.id)} />
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
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["stage", stage], queryFn: () => fn({ data: { stage } }) });
  const rows = q.data ?? [];
  if (q.isLoading) return null;
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-black text-gold mb-2">{label}</h3>
      <div className="space-y-2">
        {rows.map((m: any) => (
          <MatchCard
            key={m.id}
            match={m}
            onClick={() => navigate({ to: "/match/$matchId", params: { matchId: String(m.id) } })}
          />
        ))}
      </div>
    </div>
  );
}

function TrophyPage() {
  const navigate = useNavigate();
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
          <MatchCard
            match={f}
            onClick={() => navigate({ to: "/match/$matchId", params: { matchId: String(f.id) } })}
          />
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