import type { FavoriteMovie, Movie } from "@/types/movie";
import { MovieCard } from "./MovieCard";

export function MovieGrid({ movies }: { movies: (Movie | FavoriteMovie)[] }) {
  return (
    <div className="movie-grid grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((m, i) => (
        <MovieCard key={m.id} movie={m} index={i} />
      ))}
    </div>
  );
}
