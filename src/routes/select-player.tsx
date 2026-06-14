import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePlayer, PLAYER_META } from "@/lib/player-context";
import { useServerFn } from "@tanstack/react-start";
import { ensureMyProfile } from "@/lib/wc.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/select-player")({
  head: () => ({ meta: [{ title: "בחר שחקן · אתגר המונדיאל" }] }),
  component: SelectPlayer,
});

function SelectPlayer() {
  const { setActive } = usePlayer();
  const navigate = useNavigate();
  const ensureProfile = useServerFn(ensureMyProfile);

  const pick = async (name: "tom" | "rony") => {
    try {
      const meta = PLAYER_META[name];
      await ensureProfile({
        data: { name, age: meta.age, displayName: meta.display, avatarEmoji: meta.emoji },
      });
      setActive(name);
      await navigate({ to: "/home" });
    } catch (err) {
      console.error("pick() failed:", err);
      toast.error("בעיה בכניסה, נסה שוב");
    }
  };

  return (
    <div className="min-h-dvh stadium-grid flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-10 animate-pop-in">
        <div className="trophy-glow inline-grid place-items-center h-24 w-24 rounded-3xl text-5xl mb-4 animate-float">
          🏆
        </div>
        <h1 className="text-4xl font-black text-gold leading-tight">אתגר המונדיאל</h1>
        <div className="text-6xl font-black bg-gradient-to-l from-secondary to-accent bg-clip-text text-transparent">
          2026
        </div>
        <p className="mt-4 text-muted-foreground">מי משחק עכשיו?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {(["tom", "rony"] as const).map((p) => {
          const meta = PLAYER_META[p];
          return (
            <button
              key={p}
              onClick={() => pick(p)}
              className="card-stadium p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <div className="trophy-glow h-20 w-20 rounded-full grid place-items-center text-4xl animate-shimmer-gold">
                {meta.emoji}
              </div>
              <div className="text-2xl font-black">{meta.display}</div>
              <div className="text-xs text-muted-foreground">בן {meta.age}</div>
            </button>
          );
        })}
      </div>

      <p className="mt-10 text-xs text-muted-foreground text-center max-w-xs">
        בחרו את השחקן שלכם — הנתונים האישיים נשמרים בנפרד לכל אחד.
      </p>
    </div>
  );
}
