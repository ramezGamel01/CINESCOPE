import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MovieGrid } from "@/components/MovieGrid";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { searchMovies } from "@/services/tmdb";

export const Route = createFileRoute("/search/$query")({
  component: SearchPage,
});

type SortKey = "relevance" | "rating" | "year" | "title";

function SearchPage() {
  const { query } = Route.useParams();
  const decoded = decodeURIComponent(query);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [minRating, setMinRating] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["search", decoded],
    queryFn: () => searchMovies(decoded),
  });

  const results = useMemo(() => {
    if (!data) return [];
    const out = [...data].filter((m) => (m.vote_average ?? 0) >= minRating);
    switch (sort) {
      case "rating":
        out.sort((a, b) => b.vote_average - a.vote_average);
        break;
      case "year":
        out.sort(
          (a, b) =>
            (b.release_date ? +new Date(b.release_date) : 0) -
            (a.release_date ? +new Date(a.release_date) : 0),
        );
        break;
      case "title":
        out.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return out;
  }, [data, sort, minRating]);

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <SearchBar initialValue={decoded} autoNavigate={false} />
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide">
            Results for <span className="text-primary">"{decoded}"</span>
          </h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {results.length} of {data.length} matching movies
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Rating</option>
              <option value="year">Newest</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
            Min rating
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-transparent outline-none"
            >
              <option value={0}>Any</option>
              <option value={5}>5+</option>
              <option value={6}>6+</option>
              <option value={7}>7+</option>
              <option value={8}>8+</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading && <LoadingSkeleton />}
      {error && (
        <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />
      )}
      {!isLoading && !error && results.length === 0 && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No movies found"
          description={`We couldn't find anything matching "${decoded}". Try a different title.`}
        />
      )}
      {results.length > 0 && <MovieGrid movies={results} />}
    </div>
  );
}
