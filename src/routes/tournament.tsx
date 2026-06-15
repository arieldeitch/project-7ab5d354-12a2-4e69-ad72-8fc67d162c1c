import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getStandings,
  getMatchesByStage,
  getMatchesByGroup,
  getAllGroupMatches,
  getKnockoutTracker,
  getStatsHub,
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
  { id: "stats", label: "📊 סטטיסטיקות" },
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
      {tab === "stats" && <StatsHub />}
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
      {/* Group selector — dropdown for A–L support on mobile */}
      <div className="relative">
        <select
          value={active ?? ""}
          onChange={(e) => setSelected(e.target.value || null)}
          className="w-full px-4 py-3 rounded-2xl border border-border bg-card font-black text-base appearance-none cursor-pointer"
          dir="rtl"
        >
          {groups.map((g) => (
            <option key={g} value={g}>בית {g}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">▼</span>
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
  const navigate = useNavigate();
  const trackerFn = useServerFn(getKnockoutTracker);
  const stageMatchFn = useServerFn(getMatchesByStage);
  const tracker = useQuery({
    queryKey: ["knockout-tracker"],
    queryFn: () => trackerFn(),
    refetchInterval: 2 * 60_000,
  });

  const teamMap = useMemo(
    () => new Map((tracker.data?.teams ?? []).map((t: any) => [t.id, t])),
    [tracker.data?.teams],
  );

  if (tracker.isLoading) return <div className="card-stadium h-64 animate-pulse" />;

  const d = tracker.data;
  const hasKoMatches = (d?.koMatches?.length ?? 0) > 0;
  const noPicks = !d?.tom?.bracket?.champion_team_id && !d?.rony?.bracket?.champion_team_id;

  return (
    <div className="space-y-5">
      {noPicks ? (
        <div className="card-stadium p-8 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-black mb-2">התחילו את התחרות</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            עדיין לא הוגשו תחזיות.<br />
            בחרו זוכה למונדיאל ומלאו את הבראקט כדי להתחיל.
          </p>
          <Link to="/bracket" className="trophy-glow inline-block px-6 py-3 rounded-2xl font-black">
            מלא תחזיות
          </Link>
        </div>
      ) : (
        <>
          <ChampionPicksCard tom={d?.tom ?? null} rony={d?.rony ?? null} teamMap={teamMap} />
          <AccuracyCard tom={d?.tom ?? null} rony={d?.rony ?? null} />
          <BracketProgressCard roundSummary={d?.roundSummary ?? {}} koMatches={d?.koMatches ?? []} navigate={navigate} />
        </>
      )}
      {hasKoMatches && (
        <div className="space-y-5">
          {KO_STAGES.map((s) => (
            <StageBlock key={s.id} stage={s.id} label={s.label} fn={stageMatchFn} />
          ))}
        </div>
      )}
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

const CHAMP_STATUS_CONFIG = {
  alive:     { label: "עדיין במרוץ", icon: "🟢", cls: "text-emerald-400" },
  eliminated: { label: "נפל",        icon: "🔴", cls: "text-destructive" },
  champion:  { label: "אלוף! 🏆",   icon: "🏆", cls: "text-gold" },
  no_pick:   { label: "טרם נבחר",   icon: "⭕", cls: "text-muted-foreground" },
} as const;

function ChampionPicksCard({
  tom, rony, teamMap,
}: { tom: any; rony: any; teamMap: Map<number, any> }) {
  const players = [tom, rony].filter(Boolean);
  if (!players.length) return null;

  const hasPick = players.some((p: any) => p.bracket?.champion_team_id);

  return (
    <div className="card-stadium p-4">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">
        🏆 בחירת האלוף
      </div>
      <div className="space-y-4">
        {players.map((p: any) => {
          const team = teamMap.get(p.bracket?.champion_team_id);
          const cfg = CHAMP_STATUS_CONFIG[p.champStatus as keyof typeof CHAMP_STATUS_CONFIG];
          return (
            <div key={p.player.name} className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{p.player.avatar_emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm">{p.player.display_name}</div>
                {team ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TeamBadge team={team} size={20} className="border shrink-0" />
                    <span className="text-sm font-bold truncate">{teamLabel(team)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-0.5">טרם בחר אלוף</div>
                )}
              </div>
              <div className={`text-center shrink-0 ${cfg.cls}`}>
                <div className="text-lg leading-none">{cfg.icon}</div>
                <div className="text-[10px] font-bold mt-0.5">{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      {!hasPick && (
        <Link
          to="/bracket"
          className="mt-4 block text-center text-xs text-gold font-bold border border-gold/30 rounded-xl py-2 transition hover:bg-gold/5"
        >
          ✏️ עדכן את הבחירות שלך ←
        </Link>
      )}
    </div>
  );
}

function AccuracyCard({ tom, rony }: { tom: any; rony: any }) {
  const players = [tom, rony].filter(Boolean);
  if (!players.length) return null;

  // Prefer KO match prediction accuracy when KO matches exist; fall back to bracket pick accuracy
  const hasKoPreds = players.some((p: any) => p.koAcc.total > 0);
  const hasBracketResolved = players.some((p: any) => p.bracketAcc.resolved > 0);
  const hasData = hasKoPreds || hasBracketResolved;

  return (
    <div className="card-stadium p-4">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">
        🎯 דיוק בנוקאאוט
      </div>
      {!hasData ? (
        <div className="text-center text-sm text-muted-foreground py-2">
          נתוני דיוק יופיעו כשמשחקי הנוקאאוט יתחילו
        </div>
      ) : (
        <div className="space-y-4">
          {players.map((p: any) => {
            const { correct, total } = hasKoPreds
              ? { correct: p.koAcc.correct, total: p.koAcc.total }
              : { correct: p.bracketAcc.correct, total: p.bracketAcc.resolved };
            const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
            return (
              <div key={p.player.name} className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{p.player.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm">{p.player.display_name}</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-gold tabular-nums">{correct} / {total}</span>
                    <span className="text-xs text-muted-foreground">נכון</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
                    <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-lg font-black text-gold tabular-nums shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const KO_STAGE_LABELS: Record<string, string> = {
  round_of_32: "שלב ה-32",
  round_of_16: "שמינית הגמר",
  quarter_final: "רבע הגמר",
  semi_final: "חצי הגמר",
  third_place: "מקום שלישי",
  final: "הגמר 🏆",
};

function BracketProgressCard({
  roundSummary, koMatches, navigate,
}: { roundSummary: Record<string, { total: number; finished: number }>; koMatches: any[]; navigate: any }) {
  const stagesWithData = Object.entries(roundSummary).filter(([, v]) => v.total > 0);

  const finalWinner = (() => {
    const f = koMatches.find((m) => m.stage === "final" && m.status === "finished");
    if (!f) return null;
    return (f.home_score ?? 0) > (f.away_score ?? 0) ? f.home_team : f.away_team;
  })();

  return (
    <div className="card-stadium p-4">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">
        🔢 מסלול הנוקאאוט
      </div>
      {stagesWithData.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-2">
          הנוקאאוט יתחיל בסוף שלב הבתים · {new Date("2026-07-02").toLocaleDateString("he-IL")}
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {stagesWithData.map(([stage, summary]) => {
            const { total, finished } = summary;
            const isDone = finished === total && total > 0;
            const isActive = finished > 0 && !isDone;
            return (
              <div key={stage} className="flex items-center gap-3 py-2.5">
                <span className="text-lg shrink-0">
                  {isDone ? "✅" : isActive ? "🔄" : "⏳"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{KO_STAGE_LABELS[stage] ?? stage}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    {finished} / {total} הסתיימו
                  </div>
                </div>
                <span className={`text-xs font-bold shrink-0 ${isDone ? "text-emerald-400" : isActive ? "text-accent" : "text-muted-foreground"}`}>
                  {isDone ? "הושלם" : isActive ? "מתמשך" : "ממתין"}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {finalWinner && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-2">🏆 אלוף העולם</div>
          <button
            onClick={() => {
              const f = koMatches.find((m) => m.stage === "final" && m.status === "finished");
              if (f) navigate({ to: "/match/$matchId", params: { matchId: String(f.id) } });
            }}
            className="flex items-center gap-2 trophy-glow w-full rounded-xl p-2.5 justify-center"
          >
            <TeamBadge team={finalWinner} size={28} className="border" />
            <span className="font-black text-base">{teamLabel(finalWinner)}</span>
          </button>
        </div>
      )}
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

/* ─────────────────────────── Statistics Hub ─────────────────────────── */

const STATS_SUBTABS = [
  { id: "scorers",  label: "⚽ שערים" },
  { id: "assists",  label: "🎯 בישולים" },
  { id: "attack",   label: "🔥 התקפה" },
  { id: "defense",  label: "🛡️ הגנה" },
  { id: "form",     label: "📈 פורמה" },
] as const;

type StatsSub = (typeof STATS_SUBTABS)[number]["id"];

function StatsHub() {
  const statsFn = useServerFn(getStatsHub);
  const stats = useQuery({
    queryKey: ["stats-hub"],
    queryFn: () => statsFn(),
    refetchInterval: 5 * 60_000,
  });
  const [sub, setSub] = useState<StatsSub>("scorers");

  if (stats.isLoading) return <div className="card-stadium h-64 animate-pulse" />;
  const d = stats.data;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATS_SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition " +
              (sub === t.id ? "trophy-glow" : "bg-card border border-border")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "scorers" && (
        <StatsCard
          title="⚽ מלכי השערים"
          empty={
            <>
              <div className="text-3xl mb-2">⚽</div>
              <div className="font-bold text-sm mb-1">נתוני הכובשים יופיעו כאן</div>
              <div className="text-xs text-muted-foreground">ברגע שאירועי שערים יתחילו להיאסף במהלך הטורניר.</div>
            </>
          }
        >
          {(d?.topScorers ?? []).map((p, i) => (
            <StatRow
              key={p.playerId}
              rank={i + 1}
              team={{ flag_url: p.flagUrl, code: p.teamCode }}
              name={p.playerNameHe ?? p.playerName}
              sub={p.teamNameHe ?? p.teamName ?? ""}
              value={p.goals}
              valueLabel="שערים"
            />
          ))}
        </StatsCard>
      )}

      {sub === "assists" && (
        <StatsCard
          title="🎯 מלכי הבישולים"
          empty={
            <>
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-bold text-sm mb-1">נתוני הבישולים יופיעו כאן</div>
              <div className="text-xs text-muted-foreground">ברגע שאירועי משחק יתחילו להיאסף.</div>
            </>
          }
        >
          {(d?.topAssists ?? []).map((p, i) => (
            <StatRow
              key={p.assistName}
              rank={i + 1}
              team={{ flag_url: p.flagUrl, code: p.teamCode }}
              name={p.assistName}
              sub={p.teamNameHe ?? p.teamName ?? ""}
              value={p.assists}
              valueLabel="בישולים"
            />
          ))}
        </StatsCard>
      )}

      {sub === "attack" && (
        <StatsCard title="🔥 מתקפות חדות" empty="נתונים יופיעו לאחר תחילת המשחקים">
          {(d?.bestAttack ?? []).map((t, i) => (
            <StatRow
              key={t.teamId}
              rank={i + 1}
              team={{ flag_url: t.flagUrl, code: t.teamCode }}
              name={t.teamNameHe ?? t.teamName}
              sub={`${t.played} משחקים`}
              value={t.goalsFor}
              valueLabel="שערים"
            />
          ))}
        </StatsCard>
      )}

      {sub === "defense" && (
        <StatsCard title="🛡️ הגנה חסינה" empty="נתונים יופיעו לאחר תחילת המשחקים">
          {(d?.bestDefense ?? []).map((t, i) => (
            <StatRow
              key={t.teamId}
              rank={i + 1}
              team={{ flag_url: t.flagUrl, code: t.teamCode }}
              name={t.teamNameHe ?? t.teamName}
              sub={`${t.played} משחקים`}
              value={t.goalsAgainst}
              valueLabel="ספגו"
            />
          ))}
        </StatsCard>
      )}

      {sub === "form" && (
        <StatsCard title="📈 פורמה אחרונה" empty="נתוני פורמה יופיעו לאחר תחילת המשחקים">
          {(d?.teamForm ?? []).map((t) => (
            <FormRow key={t.teamId} team={{ flag_url: t.flagUrl, code: t.teamCode }} name={t.teamNameHe ?? t.teamName} form={t.form} />
          ))}
        </StatsCard>
      )}
    </div>
  );
}

function StatsCard({ title, empty, children }: { title: string; empty: ReactNode; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasContent = items.some(Boolean);
  return (
    <div className="card-stadium overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-black text-gold">{title}</h3>
      </div>
      {!hasContent ? (
        <div className="p-5 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="divide-y divide-border/60 px-3">{children}</div>
      )}
    </div>
  );
}

function StatRow({ rank, team, name, sub, value, valueLabel }: {
  rank: number;
  team: { flag_url?: string | null; code?: string | null };
  name: string;
  sub: string;
  value: number;
  valueLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-sm font-black text-muted-foreground w-5 text-center shrink-0 tabular-nums">{rank}</span>
      <TeamBadge team={team} size={28} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm leading-snug truncate">{name}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
      <div className="text-center shrink-0">
        <div className="text-xl font-black text-gold tabular-nums leading-none">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{valueLabel}</div>
      </div>
    </div>
  );
}

const FORM_ICONS: Record<"W" | "D" | "L", string> = { W: "✅", D: "➖", L: "❌" };

function FormRow({ team, name, form }: {
  team: { flag_url?: string | null; code?: string | null };
  name: string;
  form: Array<"W" | "D" | "L">;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <TeamBadge team={team} size={28} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">{name}</div>
      </div>
      <div className="flex gap-1 shrink-0" dir="ltr">
        {form.map((r, i) => (
          <span key={i} className="text-base leading-none">{FORM_ICONS[r]}</span>
        ))}
      </div>
    </div>
  );
}