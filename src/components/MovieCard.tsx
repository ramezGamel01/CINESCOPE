import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { tiltHandlers } from "@/hooks/useMotion";
import { findCatalogFilm } from "@/services/catalog";
import { posterUrl } from "@/services/tmdb";
import type { FavoriteMovie, Movie } from "@/types/movie";
import { FavoriteButton } from "./FavoriteButton";
import { PaletteBar } from "./PaletteBar";

interface Props {
  movie: Movie | FavoriteMovie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: Props) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "—";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const palette = findCatalogFilm(movie.id)?.palette;

  return (
    <Link
      to="/movie/$id"
      params={{ id: String(movie.id) }}
      className="movie-card tilt group relative block"
      style={{ "--i": index % 12 } as React.CSSProperties}
      {...tiltHandlers(12)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-poster">
        <img
          src={posterUrl(movie.poster_path, "w342")}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://placehold.co/500x750/1a1a2e/f5a623?text=No+Poster";
          }}
          className="h-full w-full object-cover"
          style={{ viewTransitionName: `poster-${movie.id}` }}
        />
        <span className="tilt-glare" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute right-2 top-2">
          <FavoriteButton movie={movie} />
        </div>
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs backdrop-blur-md">
          <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
          <span className="font-semibold">{rating}</span>
        </div>
      </div>
      {palette && <PaletteBar palette={palette} className="mt-2 h-1.5" />}
      <div className="px-0.5 pt-2">
        <h3 className="truncate text-sm font-semibold">{movie.title}</h3>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </Link>
  );
}
