import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { MovieDetails } from "@/components/MovieDetails";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { getMovieDetails } from "@/services/tmdb";

export const Route = createFileRoute("/movie/$id")({
  component: MoviePage,
});

function MoviePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovieDetails(id),
  });

  return (
    <div>
      <button
        onClick={() => router.history.back()}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {isLoading && <LoadingSkeleton count={4} />}
      {error && (
        <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />
      )}
      {data && <MovieDetails movie={data} />}
    </div>
  );
}
