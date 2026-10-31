import { Film, Sparkles } from "lucide-react";
import { useMotion } from "@/hooks/useMotion";

export function Footer() {
  const [motion, setMotion] = useMotion();
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          <span className="font-display tracking-wider">CineScope</span>
        </div>
        <button
          type="button"
          onClick={() => setMotion(!motion)}
          aria-pressed={motion}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 transition-colors hover:text-foreground"
        >
          <Sparkles className="h-4 w-4" />
          Motion: {motion ? "on" : "off"}
        </button>
        <p>
          Data and images from{" "}
          <a
            href="https://www.themoviedb.org"
            className="underline underline-offset-2 hover:text-foreground"
          >
            TMDB
          </a>
          . Not endorsed by TMDB.
        </p>
      </div>
    </footer>
  );
}
