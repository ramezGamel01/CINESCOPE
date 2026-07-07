import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          <span className="font-display tracking-wider">Movie Search App</span>
        </div>
        <p>Powered by TMDB. © {new Date().getFullYear()} CineScope.</p>
      </div>
    </footer>
  );
}
