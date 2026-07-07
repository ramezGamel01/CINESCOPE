import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MovieGrid } from "@/components/MovieGrid";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { getTrending, hasApiKey } from "@/services/tmdb";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const enabled = hasApiKey();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trending"],
    queryFn: getTrending,
    enabled,
  });

  return (
    <div>
      <section className="hero-bg relative -mx-4 overflow-hidden rounded-none px-4 py-16 sm:-mx-6 sm:rounded-3xl sm:px-10 sm:py-24 lg:mx-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">CineScope</p>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-7xl">
            Discover Your Next
            <br />
            <span className="text-primary">Favorite Film</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Search thousands of movies, dive into details, and build your own
            watchlist — all in one cinematic place.
          </p>
          <div className="mt-8">
            <SearchBar large autoNavigate={false} />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-wide">Trending This Week</h2>
            <p className="text-sm text-muted-foreground">
              The films everyone is talking about.
            </p>
          </div>
        </div>

        {!enabled && (
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
            <h3 className="text-lg font-semibold">Add your TMDB API key</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a <code className="rounded bg-muted px-1">.env</code> file in the
              project root with:
            </p>
            <pre className="mt-3 inline-block rounded-lg bg-card px-4 py-2 text-sm">
              VITE_TMDB_API_KEY=your_api_key_here
            </pre>
            <p className="mt-3 text-xs text-muted-foreground">
              Get a free key at themoviedb.org, then restart the dev server.
            </p>
          </div>
        )}

        {enabled && isLoading && <LoadingSkeleton />}
        {enabled && error && (
          <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />
        )}
        {enabled && data && <MovieGrid movies={data} />}
      </section>
    </div>
  );
}
