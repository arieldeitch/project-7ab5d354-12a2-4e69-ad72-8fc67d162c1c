import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTodayMatches,
  getUpcomingMatches,
  getLeaderboard,
  getMyPredictions,
  refreshWorldCupData,
  getMyProfile,
  getFinishedMatches,
  getLiveMatches,
  getRecentEvents,
  refreshLiveMatches,
  getDailyLeaderboard,
  getHeadToHead,
} from "@/lib/wc.functions";
import { RequirePlayer } from "@/components/RequirePlayer";
import { AppShell } from "@/components/AppShell";
import { MatchCard, CountdownBadge } from "@/components/MatchCard";
import { usePlayer, PLAYER_META } from "@/lib/player-context";
import { toast } from "sonner";
import { eventIcon, eventLabelHe, formatMinute, parsePlayerName } from "@/lib/event-labels";
import { teamLabel } from "@/lib/team-names";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "המשחקים של היום · אתגר המונדיאל" }] }),
  component: () => (
    <RequirePlayer>
      <Home />
    </RequirePlayer>
  ),
});

function Home() {
  const { active } = usePlayer();
  const meta = PLAYER_META[active!];
  const navigate = useNavigate();
  const toMatch = (id: number) => navigate({ to: "/match/$matchId", params: { matchId: String(id) } });
  const todayFn = useServerFn(getTodayMatches);
  const upcomingFn = useServerFn(getUpcomingMatches);
  const lbFn = useServerFn(getLeaderboard);
  const predsFn = useServerFn(getMyPredictions);
  const profileFn = useServerFn(getMyProfile);
  const refreshFn = useServerFn(refreshWorldCupData);
  const finishedFn = useServerFn(getFinishedMatches);
  const liveFn = useServerFn(getLiveMatches);
  const eventsFn = useServerFn(getRecentEvents);
  const liveRefreshFn = useServerFn(refreshLiveMatches);
  const dailyFn = useServerFn(getDailyLeaderboard);
  const h2hFn = useServerFn(getHeadToHead);

  const live = useQuery({
    queryKey: ["live"],
    queryFn: () => liveFn(),
    refetchInterval: 30_000,
  });
  const hasLive = (live.data?.length ?? 0) > 0;
  const liveInterval = hasLive ? 30_000 : 5 * 60_000;

  const today = useQuery({ queryKey: ["today"], queryFn: () => todayFn(), refetchInterval: liveInterval });
  const upcoming = useQuery({
    queryKey: ["upcoming"],
    queryFn: () => upcomingFn({ data: { limit: 5 } }),
    refetchInterval: liveInterval,
  });
  const finished = useQuery({
    queryKey: ["finished", 20],
    queryFn: () => finishedFn({ data: { limit: 20 } }),
    refetchInterval: liveInterval,
  });
  const events = useQuery({
    queryKey: ["recent-events"],
    queryFn: () => eventsFn({ data: { limit: 25 } }),
    refetchInterval: hasLive ? 30_000 : 2 * 60_000,
  });
  const lb = useQuery({ queryKey: ["lb"], queryFn: () => lbFn(), refetchInterval: liveInterval });
  const h2h = useQuery({ queryKey: ["h2h"], queryFn: () => h2hFn(), refetchInterval: liveInterval });
  const daily = useQuery({
    queryKey: ["daily-lb"],
    queryFn: () => dailyFn(),
    refetchInterval: liveInterval,
  });
  const preds = useQuery({ queryKey: ["preds", active], queryFn: () => predsFn({ data: { playerName: active! } }), refetchInterval: liveInterval });
  const profile = useQuery({ queryKey: ["profile", active], queryFn: () => profileFn({ data: { name: active! } }), refetchInterval: liveInterval });

  // While there are live matches, also hammer the server-side live sync every minute
  // so the API quota is used to keep the feed fresh.
  useEffect(() => {
    if (!hasLive) return;
    const id = setInterval(() => {
      liveRefreshFn().catch(() => undefined);
    }, 60_000);
    return () => clearInterval(id);
  }, [hasLive, liveRefreshFn]);

  const predByMatch = new Map((preds.data ?? []).map((p) => [p.match_id, p]));

  const noData =
    !today.isLoading &&
    (today.data?.length ?? 0) === 0 &&
    (upcoming.data?.length ?? 0) === 0 &&
    (finished.data?.length ?? 0) === 0 &&
    !hasLive;

  type MatchTab = "today" | "results" | "upcoming";
  const [tab, setTab] = useState<MatchTab>("today");

  // Merge today's matches with live matches (live data is polled every 30s — fresher status)
  const allTodayMap = new Map<number, any>();
  (today.data ?? []).forEach((m: any) => allTodayMap.set(m.id, m));
  (live.data ?? []).forEach((m: any) => allTodayMap.set(m.id, m));
  const allToday = [...allTodayMap.values()].sort(
    (a: any, b: any) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
  );
  const liveToday = allToday.filter((m: any) => m.status === "live");
  const finishedToday = allToday.filter((m: any) => m.status === "finished");
  const scheduledToday = allToday.filter((m: any) => m.status === "scheduled");

  const todayCount = allToday.length;
  const resultsCount = finished.data?.length ?? 0;
  const upcomingCount = upcoming.data?.length ?? 0;

  const runRefresh = async () => {
    toast.loading("מרענן נתוני מונדיאל...", { id: "ref" });
    try {
      const r = await refreshFn();
      toast.success(`עודכנו ${r.fixtures} משחקים, ${r.teams} נבחרות`, { id: "ref" });
      today.refetch();
      upcoming.refetch();
    } catch (e) {
      toast.error("בעיה בריענון", { id: "ref" });
      console.error(e);
    }
  };

  return (
    <AppShell
      title={`היי ${meta.display}!`}
      subtitle="המשחקים של היום"
      action={
        <button
          onClick={runRefresh}
          className="rounded-xl bg-card border border-border px-3 py-1.5 text-xs font-bold"
          title="רענן נתונים"
        >
          🔄
        </button>
      }
    >
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <StatPill label="הנקודות שלי" value={profile.data?.stats.totalPoints ?? 0} accent="gold" />
        <StatPill label="מדליות זהב" value={profile.data?.stats.medals.gold ?? 0} accent="primary" />
        <StatPill label="הישגים" value={profile.data?.stats.achievementsCount ?? 0} accent="accent" />
      </div>

      {/* Rivalry card */}
      {(lb.data?.length ?? 0) >= 2 && (
        <RivalryCard
          leader={(lb.data as any[])[0]}
          challenger={(lb.data as any[])[1]}
          h2h={h2h.data ?? null}
        />
      )}

      {noData && (
        <div className="card-stadium p-6 text-center mb-6">
          <div className="text-5xl mb-3">⚽</div>
          <h3 className="text-lg font-black mb-1">בואו נטען את המונדיאל!</h3>
          <p className="text-sm text-muted-foreground mb-4">לחיצה אחת ונביא את כל הנבחרות, המשחקים והקבוצות.</p>
          <button onClick={runRefresh} className="trophy-glow px-6 py-2.5 rounded-xl font-bold">
            ⚡ טען נתונים
          </button>
        </div>
      )}

      {(events.data?.length ?? 0) > 0 && (
        <Section title="📣 מה חדש במונדיאל?">
          <ol className="card-stadium divide-y divide-border overflow-hidden">
            {(events.data ?? []).slice(0, 8).map((e: any) => {
              const m = e.match;
              const ht = teamLabel(m?.home_team);
              const at = teamLabel(m?.away_team);
              const { scorer, assist } = parsePlayerName(e.player_name);
              return (
                <li key={e.id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="text-xl leading-none">{eventIcon(e)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {scorer ?? eventLabelHe(e)}
                      {e.team ? ` · ${teamLabel(e.team)}` : ""}
                    </div>
                    {assist && (
                      <div className="text-[11px] text-gold/80 truncate">
                        מסייע: {assist}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground truncate">
                      {eventLabelHe(e)} · {ht} <span dir="ltr">{m?.home_score ?? "-"}:{m?.away_score ?? "-"}</span> {at}
                    </div>
                  </div>
                  <span className="text-xs font-black text-gold tabular-nums shrink-0">
                    {formatMinute(e.minute, e.extra_time)}
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      <section className="mb-6">
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {([
            { id: "today", label: "🔥 משחקי היום", count: todayCount },
            { id: "results", label: "🏁 תוצאות", count: resultsCount },
            { id: "upcoming", label: "📅 משחקים עתידיים", count: upcomingCount },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 " +
                (tab === t.id ? "trophy-glow" : "bg-card border border-border")
              }
            >
              <span>{t.label}</span>
              <span className={"text-[10px] tabular-nums px-1.5 py-0.5 rounded-full " + (tab === t.id ? "bg-background/30" : "bg-muted text-muted-foreground")}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "today" && (
          today.isLoading ? (
            <SkeletonCards />
          ) : allToday.length === 0 ? (
            <EmptyState text="אין משחקים היום. עברו לטאב 'משחקים עתידיים' לראות מה מחכה!" />
          ) : (
            <div className="space-y-5">
              {liveToday.length > 0 && (
                <TodayGroup
                  title={
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      🔴 חי עכשיו
                    </span>
                  }
                >
                  {liveToday.map((m: any) => <MatchCard key={m.id} match={m} onClick={() => toMatch(m.id)} />)}
                </TodayGroup>
              )}
              {finishedToday.length > 0 && (
                <TodayGroup title="🏁 הסתיימו היום">
                  {finishedToday.map((m: any) => <MatchCard key={m.id} match={m} onClick={() => toMatch(m.id)} />)}
                </TodayGroup>
              )}
              {scheduledToday.length > 0 && (
                <TodayGroup title="⏰ בהמשך היום">
                  {scheduledToday.map((m: any) => {
                    const pred = predByMatch.get(m.id);
                    return (
                      <MatchCard
                        key={m.id}
                        match={m}
                        onClick={() => toMatch(m.id)}
                        footer={
                          <Link
                            to="/predictions"
                            search={{ matchId: m.id } as any}
                            className="flex items-center justify-between w-full text-xs"
                          >
                            <CountdownBadge kickoff={m.kickoff_at} />
                            <span
                              className={
                                "px-3 py-1.5 rounded-lg font-bold " +
                                (pred ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
                              }
                            >
                              {pred ? "✓ תחזית נמסרה — ערוך" : "📝 הוסף תחזית"}
                            </span>
                          </Link>
                        }
                      />
                    );
                  })}
                </TodayGroup>
              )}
            </div>
          )
        )}

        {tab === "results" && (
          finished.isLoading ? (
            <SkeletonCards />
          ) : resultsCount === 0 ? (
            <EmptyState text="עוד לא הסתיימו משחקים. תכף תתחיל הפעולה!" />
          ) : (
            <div className="space-y-3">
              {(finished.data ?? []).map((m: any) => (
                <MatchCard key={m.id} match={m} onClick={() => toMatch(m.id)} />
              ))}
            </div>
          )
        )}

        {tab === "upcoming" && (
          upcoming.isLoading ? (
            <SkeletonCards />
          ) : upcomingCount === 0 ? (
            <EmptyState text="כרגע אין משחקים עתידיים מתוזמנים." />
          ) : (
            <div className="space-y-3">
              {(upcoming.data ?? []).map((m: any) => {
                const pred = predByMatch.get(m.id);
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onClick={() => toMatch(m.id)}
                    footer={
                      <Link
                        to="/predictions"
                        search={{ matchId: m.id } as any}
                        className="flex items-center justify-between w-full text-xs"
                      >
                        <CountdownBadge kickoff={m.kickoff_at} />
                        <span
                          className={
                            "px-3 py-1.5 rounded-lg font-bold " +
                            (pred ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
                          }
                        >
                          {pred ? "✓ תחזית נמסרה — ערוך" : "📝 הוסף תחזית"}
                        </span>
                      </Link>
                    }
                  />
                );
              })}
            </div>
          )
        )}
      </section>

      {/* Daily winner card */}
      {(daily.data?.some((d: any) => d.dailyPoints > 0)) && (
        <DailyWinnerCard daily={daily.data as any[]} />
      )}

      <Section title="🏅 טבלת האליפות">
        <div className="card-stadium p-3 divide-y divide-border">
          {(lb.data ?? []).map((row: any, i: number) => (
            <div key={row.player.id} className="flex items-center gap-3 py-2.5">
              <span className="text-xl w-7 text-center">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
              </span>
              <span className="text-2xl">{row.player.avatar_emoji ?? "⚽"}</span>
              <div className="flex-1">
                <div className="font-black">{row.player.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  {row.predictions} תחזיות · {row.exactScores} בול
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-gold tabular-nums">{row.player.total_points}</div>
                <div className="text-[10px] text-muted-foreground">נקודות</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent: "gold" | "primary" | "accent" }) {
  const bg = accent === "gold" ? "trophy-glow" : accent === "primary" ? "pitch-bg" : "championship-bg";
  return (
    <div className={`${bg} rounded-2xl p-3 text-center`}>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

function TodayGroup({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-black mb-3 flex items-center gap-2">{title}</h2>
      {children}
    </section>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="card-stadium h-32 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="card-stadium p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function RivalryCard({ leader, challenger, h2h }: { leader: any; challenger: any; h2h: any | null }) {
  const gap = (leader.player.total_points ?? 0) - (challenger.player.total_points ?? 0);
  const streak = h2h?.streak;
  const lastBattle = h2h?.recentBattles?.[0] ?? null;
  const streakName =
    streak?.player === "tom"
      ? h2h?.tom?.display_name
      : streak?.player === "rony"
        ? h2h?.rony?.display_name
        : null;
  const lastWinnerName =
    lastBattle?.winner === "tom"
      ? h2h?.tom?.display_name
      : lastBattle?.winner === "rony"
        ? h2h?.rony?.display_name
        : null;
  const showStreak = (streak?.count ?? 0) >= 2 && streakName;
  return (
    <div className="card-stadium p-4 mb-5">
      <div className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
        ⚔️ מאבק הפסגה
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center">
          <div className="text-4xl mb-1">{leader.player.avatar_emoji}</div>
          <div className="font-black text-sm">{leader.player.display_name}</div>
          <div className="text-xl font-black text-gold tabular-nums">{leader.player.total_points}</div>
        </div>
        <div className="flex flex-col items-center px-2 shrink-0">
          {gap === 0 ? (
            <span className="text-xs font-black text-muted-foreground">שיווי!</span>
          ) : (
            <>
              <div className="text-2xl font-black text-accent tabular-nums">{gap}</div>
              <div className="text-[10px] text-muted-foreground">נקודות הפרש</div>
            </>
          )}
        </div>
        <div className="flex-1 text-center">
          <div className="text-4xl mb-1">{challenger.player.avatar_emoji}</div>
          <div className="font-black text-sm">{challenger.player.display_name}</div>
          <div className="text-xl font-black text-gold tabular-nums">{challenger.player.total_points}</div>
        </div>
      </div>
      {gap > 0 && (
        <div className="text-center text-xs font-bold text-muted-foreground mt-2">
          🔥 {leader.player.display_name} מוביל ב-{gap} נקודות
        </div>
      )}
      {(showStreak || lastBattle) && (
        <div className="border-t border-border mt-3 pt-3 flex gap-6 justify-center">
          {showStreak && (
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground font-bold mb-0.5">סדרה נוכחית</div>
              <div className="text-sm font-black">🔥 {streak.count} ניצחונות</div>
              <div className="text-[11px] text-muted-foreground">{streakName}</div>
            </div>
          )}
          {lastBattle && (
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground font-bold mb-0.5">דואל אחרון</div>
              <div className="text-sm font-black">
                {lastBattle.winner === "draw" ? "🤝 תיקו" : `🏆 ${lastWinnerName}`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DailyWinnerCard({ daily }: { daily: Array<{ player: any; dailyPoints: number }> }) {
  const withPoints = daily.filter((d) => d.dailyPoints > 0);
  if (!withPoints.length) return null;
  const top = withPoints[0];
  const isTie = withPoints.length >= 2 && withPoints[0].dailyPoints === withPoints[1].dailyPoints;
  return (
    <Section title="🌟 ניקוד היום">
      <div className="card-stadium p-4">
        {isTie ? (
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🤝</div>
            <div>
              <div className="font-black">תיקו! שניהם קיבלו {top.dailyPoints} נקודות היום</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">{top.player.avatar_emoji}</div>
            <div>
              <div className="font-black text-base">{top.player.display_name}</div>
              <div className="text-sm text-muted-foreground">
                צבר <span className="text-gold font-black text-lg">{top.dailyPoints}</span> נקודות היום
              </div>
            </div>
          </div>
        )}
        <div className="divide-y divide-border">
          {daily.map((d) => (
            <div key={d.player.name} className="flex items-center justify-between py-1.5 text-sm">
              <span className="font-bold">{d.player.display_name}</span>
              <span className={`font-black tabular-nums ${d.dailyPoints > 0 ? "text-gold" : "text-muted-foreground"}`}>
                {d.dailyPoints} נק׳
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}