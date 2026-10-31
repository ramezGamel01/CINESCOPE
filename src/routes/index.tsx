import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ArrowRight, Flame, Palette } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MovieGrid } from "@/components/MovieGrid";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PosterWall } from "@/components/PosterWall";
import { PRESETS } from "@/lib/colorSearch";
import { useScrollProgress } from "@/hooks/useMotion";
import { catalog } from "@/services/catalog";
import { getTrending, hasApiKey } from "@/services/tmdb";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const hero = useRef<HTMLElement>(null);
  useScrollProgress(hero);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trending"],
    queryFn: getTrending,
  });

  return (
    <div>
      <section
        ref={hero}
        className="hero relative -mx-4 -mt-8 flex min-h-[86vh] items-center overflow-hidden px-4 sm:-mx-6 sm:px-10"
      >
        <PosterWall posters={catalog.map((film) => film.poster_path)} />
        <div className="hero__shade" />
        <div className="hero__content relative mx-auto max-w-3xl text-center">
          <p className="hero-rise text-sm uppercase tracking-[0.35em] text-spectrum" style={{ "--d": 0 } as React.CSSProperties}>
            CineScope
          </p>
          <h1 className="hero-rise mt-5 font-display text-6xl leading-[0.92] tracking-wide sm:text-8xl" style={{ "--d": 1 } as React.CSSProperties}>
            Find films by
            <br />
            <span className="text-spectrum">their colors</span>
          </h1>
          <p className="hero-rise mx-auto mt-6 max-w-xl text-lg text-muted-foreground" style={{ "--d": 2 } as React.CSSProperties}>
            Pick a color and get the movies that look like it, or search any title the usual way.
          </p>
          <div className="hero-rise mt-8 flex flex-col items-center gap-4" style={{ "--d": 3 } as React.CSSProperties}>
            <Link to="/colors" className="spectrum-button">
              <Palette className="h-5 w-5" /> Search by color <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="w-full max-w-xl">
              <SearchBar large autoNavigate={false} />
            </div>
          </div>
        </div>
      </section>

      <section className="reveal mt-16">
        <h2 className="mb-5 font-display text-3xl tracking-wide">Browse by look</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PRESETS.map((preset) => (
            <Link
              key={preset.id}
              to="/colors"
              search={{ preset: preset.id }}
              className="look-tile"
              style={{ "--a": preset.colors[0], "--b": preset.colors[1] } as React.CSSProperties}
            >
              <span>{preset.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="reveal mb-6 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-3xl tracking-wide">Trending this week</h2>
            <p className="text-sm text-muted-foreground">
              {hasApiKey()
                ? "The films everyone is talking about."
                : "From the curated catalog: live TMDB data appears when an API key is set."}
            </p>
          </div>
        </div>

        {isLoading && <LoadingSkeleton />}
        {error && <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />}
        {data && <MovieGrid movies={data} />}
      </section>
    </div>
  );
}
