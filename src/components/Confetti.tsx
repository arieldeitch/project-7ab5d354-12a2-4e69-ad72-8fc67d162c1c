import { useEffect, useState } from "react";

const COLORS = ["#fbbf24", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#f59e0b"];

export function Confetti({ trigger }: { trigger: unknown }) {
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (trigger == null) return;
    setShown(Date.now());
    const t = setTimeout(() => setShown(null), 2400);
    return () => clearTimeout(t);
  }, [trigger]);

  if (shown == null) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.6 + Math.random() * 1.2;
        const color = COLORS[i % COLORS.length];
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            style={{
              left: left + "%",
              top: "-20px",
              width: size,
              height: size,
              background: color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              position: "absolute",
              animation: `confetti-fall ${duration}s ${delay}s linear forwards`,
            }}
          />
        );
      })}
    </div>
  );
}