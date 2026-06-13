import { useState } from "react";

type P = { id: number; name: string; name_he?: string | null; photo_url?: string | null; position?: string | null; nationality?: string | null };

export function PlayerPicker({
  players,
  value,
  onChange,
  placeholder,
}: {
  players: P[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.name_he ?? "").includes(q))
    : players.slice(0, 60);
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "חיפוש שחקן..."}
        className="w-full rounded-xl bg-input border border-border px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {filtered.map((p) => {
          const sel = value === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(sel ? null : p.id)}
              className={
                "card-stadium p-2 flex items-center gap-2 text-right transition-all " +
                (sel ? "ring-2 ring-secondary scale-[1.02]" : "")
              }
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl grid place-items-center h-full">👤</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">{p.name_he ?? p.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {p.position ?? ""} {p.nationality ? `· ${p.nationality}` : ""}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8">
            עוד אין רשימת שחקנים. הריענון הראשון יביא את מבקיעי המונדיאל.
          </div>
        )}
      </div>
    </div>
  );
}