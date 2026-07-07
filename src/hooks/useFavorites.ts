import { useCallback, useEffect, useState } from "react";
import type { FavoriteMovie, Movie } from "@/types/movie";

const STORAGE_KEY = "movie-search-favorites";

function read(): FavoriteMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteMovie[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);

  useEffect(() => {
    setFavorites(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: FavoriteMovie[]) => {
    setFavorites(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const addFavorite = useCallback(
    (movie: Movie | FavoriteMovie) => {
      if (favorites.some((f) => f.id === movie.id)) return; // prevent duplicates
      const fav: FavoriteMovie = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      };
      persist([fav, ...favorites]);
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (id: number) => persist(favorites.filter((f) => f.id !== id)),
    [favorites, persist],
  );

  const toggleFavorite = useCallback(
    (movie: Movie | FavoriteMovie) =>
      favorites.some((f) => f.id === movie.id)
        ? removeFavorite(movie.id)
        : addFavorite(movie),
    [favorites, addFavorite, removeFavorite],
  );

  return { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite };
}
