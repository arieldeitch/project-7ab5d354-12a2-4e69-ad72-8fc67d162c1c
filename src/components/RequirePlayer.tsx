import { Navigate } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player-context";
import type { ReactNode } from "react";

export function RequirePlayer({ children }: { children: ReactNode }) {
  const { active, ready } = usePlayer();
  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-6xl animate-pulse">⚽</div>
      </div>
    );
  }
  if (!active) return <Navigate to="/select-player" />;
  return <>{children}</>;
}