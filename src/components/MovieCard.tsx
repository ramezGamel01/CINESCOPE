import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { posterUrl } from "@/services/tmdb";
import type { FavoriteMovie, Movie } from "@/types/movie";
import { FavoriteButton } from "./FavoriteButton";

interface Props {
  movie: Movie | FavoriteMovie;
}

export function MovieCard({ movie }: Props) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "—";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";

  return (
    <Link
      to="/movie/$id"
      params={{ id: String(movie.id) }}
      className="group relative block overflow-hidden rounded-xl card-bg shadow-poster transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={posterUrl(movie.poster_path)}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://placehold.co/500x750/1a1a2e/f5a623?text=No+Poster";
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute right-2 top-2">
          <FavoriteButton movie={movie} />
        </div>
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs backdrop-blur-md">
          <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
          <span className="font-semibold">{rating}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="truncate font-semibold text-sm">{movie.title}</h3>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </Link>
  );
}
