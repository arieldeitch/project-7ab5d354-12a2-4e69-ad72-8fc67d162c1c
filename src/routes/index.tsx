import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "אתגר המונדיאל 2026" },
      { name: "description", content: "תחזיות מונדיאל משפחתיות לתום ורוני" },
      { property: "og:title", content: "אתגר המונדיאל 2026" },
      { property: "og:description", content: "המונדיאל המשפחתי - תחזיות, הישגים, מדליות" },
    ],
  }),
  component: Index,
});

function Index() {
  const { active, ready } = usePlayer();
  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-7xl animate-pulse">⚽</div>
      </div>
    );
  }
  if (active) return <Navigate to="/home" />;
  return <Navigate to="/select-player" />;
}

// legacy
function _PlaceholderIndex() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#fcfbf8" }}
    >
      <img
        data-lovable-blank-page-placeholder="REMOVE_THIS"
        src="https://cdn.gpteng.co/blank-app-v1.svg"
        alt="Your app will live here!"
      />
    </div>
  );
}
