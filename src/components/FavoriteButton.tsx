import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import type { FavoriteMovie, Movie } from "@/types/movie";

interface Props {
  movie: Movie | FavoriteMovie;
  variant?: "icon" | "full";
  className?: string;
}

export function FavoriteButton({ movie, variant = "icon", className = "" }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(movie.id);

  if (variant === "full") {
    return (
      <button
        onClick={() => toggleFavorite(movie)}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium transition ${
          active
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card hover:bg-secondary"
        } ${className}`}
      >
        <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
        {active ? "In Favorites" : "Add to Favorites"}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(movie);
      }}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-black/60 text-white hover:bg-primary hover:text-primary-foreground"
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
    </button>
  );
}
