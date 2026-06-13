import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { refreshWorldCupData, recalcAllScores, getRefreshLogs } from "@/lib/wc.functions";
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
  const logs = useQuery({ queryKey: ["logs"], queryFn: () => logsFn() });

  const run = async (label: string, fn: () => Promise<unknown>) => {
    toast.loading(label + "...", { id: label });
    try {
      await fn();
      toast.success(label + " הצליח", { id: label });
      logs.refetch();
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה", { id: label });
    }
  };

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
      </div>
    </AppShell>
  );
}