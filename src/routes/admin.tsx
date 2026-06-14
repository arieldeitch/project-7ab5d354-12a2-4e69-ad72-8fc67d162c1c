import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { refreshWorldCupData, recalcAllScores, getRefreshLogs, getDataStats } from "@/lib/wc.functions";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "מצב הורה · אתגר המונדיאל" }] }),
  component: Admin,
});

function Admin() {
  const refreshFn = useServerFn(refreshWorldCupData);
  const recalcFn = useServerFn(recalcAllScores);
  const logsFn = useServerFn(getRefreshLogs);
  const statsFn = useServerFn(getDataStats);

  const logs = useQuery({ queryKey: ["logs"], queryFn: () => logsFn() });
  const stats = useQuery({ queryKey: ["data-stats"], queryFn: () => statsFn(), refetchInterval: 30_000 });

  const run = async (label: string, fn: () => Promise<unknown>) => {
    toast.loading(label + "...", { id: label });
    try {
      await fn();
      toast.success(label + " הצליח", { id: label });
      logs.refetch();
      stats.refetch();
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה", { id: label });
    }
  };

  const s = stats.data;

  return (
    <AppShell title="מצב הורה" subtitle="פעולות ניהול">
      <div className="grid grid-cols-1 gap-3 mb-6">
        <button onClick={() => run("ריענון נתונים", () => refreshFn())} className="trophy-glow px-5 py-3 rounded-2xl font-black">
          🔄 ריענון מלא של המונדיאל
        </button>
        <button onClick={() => run("חישוב מחדש", () => recalcFn())} className="pitch-bg px-5 py-3 rounded-2xl font-black">
          🧮 חישוב מחדש של כל הניקוד
        </button>
      </div>

      <h2 className="text-lg font-black mb-2">📊 נתוני מסד הנתונים</h2>
      <div className="card-stadium p-4 mb-6">
        {stats.isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-2">טוען...</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="נבחרות" value={s?.teams ?? 0} ok={(s?.teams ?? 0) > 0} />
            <StatBox label="משחקים" value={s?.fixtures ?? 0} ok={(s?.fixtures ?? 0) > 0} />
            <StatBox label="קבוצות" value={s?.groups ?? 0} ok={(s?.groups ?? 0) > 0} />
            <StatBox label="טבלת ניקוד" value={s?.standings ?? 0} ok={(s?.standings ?? 0) > 0} />
            <StatBox label="הסתיימו" value={s?.finished ?? 0} ok={true} />
            <StatBox label="עתידיים" value={s?.upcoming ?? 0} ok={true} />
          </div>
        )}
        {!stats.isLoading && (s?.teams ?? 0) === 0 && (
          <p className="text-xs text-destructive text-center mt-3">
            ⚠️ אין נתונים. לחץ על "ריענון מלא" כדי לטעון נבחרות ומשחקים.
          </p>
        )}
      </div>

      <h2 className="text-lg font-black mb-2">📋 יומן ריענונים</h2>
      <div className="card-stadium divide-y divide-border">
        {(logs.data ?? []).map((l: any) => (
          <div key={l.id} className="p-3 text-sm">
            <div className="flex justify-between">
              <span className={"font-bold " + (l.status === "ok" ? "text-primary" : "text-destructive")}>
                {l.status === "ok" ? "✓" : "✗"} {l.kind}
              </span>
              <span className="text-xs text-muted-foreground">{new Date(l.started_at).toLocaleString("he-IL")}</span>
            </div>
            {l.detail && <div className="text-xs text-muted-foreground mt-1">{l.detail}</div>}
          </div>
        ))}
        {(logs.data?.length ?? 0) === 0 && !logs.isLoading && (
          <div className="p-4 text-center text-sm text-muted-foreground">אין ריענונים עדיין</div>
        )}
      </div>
    </AppShell>
  );
}

function StatBox({ label, value, ok }: { label: string; value: number; ok: boolean }) {
  return (
    <div className={`card-stadium p-3 text-center ${ok && value > 0 ? "" : value === 0 ? "border-destructive/40" : ""}`}>
      <div className={`text-2xl font-black tabular-nums ${value > 0 ? "text-gold" : "text-destructive"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
