import { Clock, Play, Star } from "lucide-react";
import { backdropUrl, posterUrl } from "@/services/tmdb";
import type { MovieDetail } from "@/types/movie";
import { FavoriteButton } from "./FavoriteButton";

export function MovieDetails({ movie }: { movie: MovieDetail }) {
  const backdrop = backdropUrl(movie.backdrop_path);
  const trailer = movie.videos?.results.find(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  const cast = movie.credits?.cast.slice(0, 8) ?? [];
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "";

  return (
    <div>
      <div className="relative -mx-4 h-[45vh] min-h-[300px] sm:-mx-6 lg:mx-0 lg:rounded-3xl lg:overflow-hidden">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      </div>

      <div className="relative -mt-40 grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="mx-auto w-48 shrink-0 md:mx-0 md:w-full">
          <img
            src={posterUrl(movie.poster_path)}
            alt={movie.title}
            className="w-full rounded-2xl shadow-poster"
          />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{movie.title}</h1>
          {movie.tagline && (
            <p className="mt-2 italic text-muted-foreground">{movie.tagline}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {year && <span>{year}</span>}
            {movie.runtime ? (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
              {movie.vote_average.toFixed(1)} / 10
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <span
                key={g.id}
                className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs"
              >
                {g.name}
              </span>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">Overview</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {movie.overview || "No overview available."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <FavoriteButton movie={movie} variant="full" />
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-medium hover:bg-secondary"
              >
                <Play className="h-4 w-4" /> Watch Trailer
              </a>
            )}
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Top Cast</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {cast.map((c) => (
              <div key={c.id} className="text-center">
                <img
                  src={
                    c.profile_path
                      ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                      : `https://placehold.co/185x278/1a1a2e/f5a623?text=?`
                  }
                  alt={c.name}
                  className="mx-auto aspect-[2/3] w-full rounded-xl object-cover"
                />
                <p className="mt-2 truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
