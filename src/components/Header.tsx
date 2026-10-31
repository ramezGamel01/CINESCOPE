import { Link, useNavigate } from "@tanstack/react-router";
import { Film, Heart, Home, Orbit, Palette, Search } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate({ to: "/search/$query", params: { query } });
    setOpen(false);
  };

  const navLink = (
    to: "/" | "/colors" | "/universe" | "/favorites",
    label: string,
    Icon: typeof Home,
  ) => (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "text-primary" }}
      inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
      className="flex items-center gap-2 text-sm font-medium transition-colors"
      onClick={() => setOpen(false)}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="logo-mark grid h-9 w-9 place-items-center rounded-lg text-white transition-transform group-hover:scale-105">
            <Film className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl tracking-wider">
            CINE<span className="text-spectrum">SCOPE</span>
          </span>
        </Link>

        <form onSubmit={onSubmit} className="hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Quick search..."
              className="w-full rounded-full border border-border bg-input/50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-6 md:flex">
          {navLink("/", "Home", Home)}
          {navLink("/colors", "Colors", Palette)}
          {navLink("/universe", "Universe", Orbit)}
          {navLink("/favorites", "Favorites", Heart)}
        </nav>

        <button
          className="md:hidden rounded-lg border border-border p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="block h-0.5 w-5 bg-foreground" />
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
            <form onSubmit={onSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search movies..."
                  className="w-full rounded-full border border-border bg-input/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </form>
            <div className="flex gap-6">
              {navLink("/", "Home", Home)}
              {navLink("/colors", "Colors", Palette)}
              {navLink("/universe", "Universe", Orbit)}
              {navLink("/favorites", "Favorites", Heart)}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
