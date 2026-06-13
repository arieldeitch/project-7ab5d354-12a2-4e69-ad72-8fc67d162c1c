import { useState } from "react";

type T = { id: number; name: string; name_he?: string | null; flag_url?: string | null; logo_url?: string | null };

export function TeamPicker({
  teams,
  value,
  onChange,
}: {
  teams: T[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? teams.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || (t.name_he ?? "").includes(q))
    : teams;
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="חיפוש נבחרת..."
        className="w-full rounded-xl bg-input border border-border px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
        {filtered.map((t) => {
          const sel = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(sel ? null : t.id)}
              className={
                "card-stadium p-2 flex flex-col items-center gap-1 transition-all " +
                (sel ? "ring-2 ring-secondary scale-105 animate-pop-in" : "hover:scale-105")
              }
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                {t.flag_url || t.logo_url ? (
                  <img src={t.flag_url ?? t.logo_url ?? ""} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl grid place-items-center h-full">🏳️</span>
                )}
              </div>
              <span className="text-[11px] font-bold text-center truncate w-full">
                {t.name_he ?? t.name}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8">
            לא נמצאו נבחרות. הריענון הראשון יוסיף את כל הנבחרות.
          </div>
        )}
      </div>
    </div>
  );
}