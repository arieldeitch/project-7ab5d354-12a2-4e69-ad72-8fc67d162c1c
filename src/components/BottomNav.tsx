import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, Trophy, Medal, User, Settings } from "lucide-react";

const tabs = [
  { to: "/home", label: "היום", Icon: Home },
  { to: "/predictions", label: "תחזיות", Icon: ListChecks },
  { to: "/tournament", label: "טורניר", Icon: Trophy },
  { to: "/leaderboard", label: "טבלה", Icon: Medal },
  { to: "/profile", label: "פרופיל", Icon: User },
  { to: "/setup", label: "העדפות", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-1">
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold transition-all " +
                  (active ? "text-gold scale-110" : "text-muted-foreground hover:text-foreground")
                }
              >
                <span
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-2xl transition-all " +
                    (active ? "trophy-glow animate-shimmer-gold" : "bg-card/40")
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[9px] leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
