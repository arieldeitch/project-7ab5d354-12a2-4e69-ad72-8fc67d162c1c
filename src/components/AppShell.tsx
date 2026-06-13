import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { usePlayer, PLAYER_META } from "@/lib/player-context";
import { useRef } from "react";

export function AppShell({ children, title, subtitle, action }: { children: ReactNode; title?: string; subtitle?: string; action?: ReactNode }) {
  const { active, setActive } = usePlayer();
  const meta = active ? PLAYER_META[active] : null;
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    longPressRef.current = setTimeout(() => {
      const pin = window.prompt("מצב הורה - הזן 4 ספרות סודיות:");
      if (pin === "2026") window.location.href = "/admin";
    }, 1000);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  return (
    <div className="min-h-dvh stadium-grid pb-28">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 gap-3">
          <button
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            className="flex items-center gap-2 select-none"
            aria-label="לוגו"
          >
            <span className="trophy-glow h-9 w-9 rounded-2xl grid place-items-center text-xl">🏆</span>
            <div className="text-right leading-tight">
              <div className="text-sm font-extrabold">אתגר המונדיאל</div>
              <div className="text-[10px] text-muted-foreground">2026</div>
            </div>
          </button>
          <div className="flex-1" />
          {meta && (
            <button
              onClick={() => {
                setActive(null);
                window.location.href = "/select-player";
              }}
              className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-sm"
            >
              <span className="text-lg">{meta.emoji}</span>
              <span className="font-bold">{meta.display}</span>
            </button>
          )}
        </div>
        {(title || subtitle || action) && (
          <div className="mx-auto max-w-2xl px-4 pb-3 flex items-end justify-between gap-2">
            <div>
              {title && <h1 className="text-2xl font-black text-gold">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {action}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}