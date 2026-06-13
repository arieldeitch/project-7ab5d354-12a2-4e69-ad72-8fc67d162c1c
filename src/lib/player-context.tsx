import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ActivePlayer = "tom" | "rony" | null;

type Ctx = {
  active: ActivePlayer;
  setActive: (p: ActivePlayer) => void;
  ready: boolean;
};

const PlayerContext = createContext<Ctx>({ active: null, setActive: () => {}, ready: false });

const KEY = "wc2026.activePlayer";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<ActivePlayer>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "tom" || v === "rony") setActiveState(v);
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  const setActive = (p: ActivePlayer) => {
    setActiveState(p);
    try {
      if (p) localStorage.setItem(KEY, p);
      else localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  };

  return <PlayerContext.Provider value={{ active, setActive, ready }}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);

export const PLAYER_META: Record<"tom" | "rony", { display: string; age: number; emoji: string; color: string }> = {
  tom: { display: "תום", age: 11, emoji: "⚽", color: "var(--color-primary)" },
  rony: { display: "רוני", age: 9, emoji: "🏆", color: "var(--color-gold)" },
};