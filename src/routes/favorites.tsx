import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { EmptyState } from "@/components/EmptyState";
import { useFavorites } from "@/hooks/useFavorites";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl tracking-wide">Your Favorites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {favorites.length} {favorites.length === 1 ? "movie" : "movies"} saved
          locally on this device.
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="No favorites yet"
          description="Tap the heart on any movie to save it here for later."
          action={
            <Link
              to="/"
              className="rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground"
            >
              Browse movies
            </Link>
          }
        />
      ) : (
        <MovieGrid movies={favorites} />
      )}
    </div>
  );
}
