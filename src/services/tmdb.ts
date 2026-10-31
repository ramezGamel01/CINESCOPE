import { catalogDetail, catalogTrending, searchCatalog } from "@/services/catalog";
import type { Movie, MovieDetail } from "@/types/movie";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const BASE_URL = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";

export const hasApiKey = () => Boolean(API_KEY);

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error("Missing TMDB API key. Create a .env file with VITE_TMDB_API_KEY=your_key");
  }
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// Without an API key the app runs on the curated offline catalog
export const getTrending = async () =>
  API_KEY
    ? tmdb<{ results: Movie[] }>("/trending/movie/week").then((d) => d.results)
    : catalogTrending();

export const getPopular = () => tmdb<{ results: Movie[] }>("/movie/popular").then((d) => d.results);

export const searchMovies = async (query: string) =>
  API_KEY
    ? tmdb<{ results: Movie[] }>("/search/movie", { query, include_adult: "false" }).then(
        (d) => d.results,
      )
    : searchCatalog(query);

export const getMovieDetails = async (id: string | number) =>
  API_KEY
    ? tmdb<MovieDetail>(`/movie/${id}`, { append_to_response: "credits,videos" })
    : catalogDetail(id);

export const posterUrl = (
  path: string | null,
  size: "w185" | "w342" | "w500" | "original" = "w500",
) =>
  path ? `${IMG_BASE}/${size}${path}` : `https://placehold.co/500x750/1a1a2e/f5a623?text=No+Poster`;

export const backdropUrl = (
  path: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280",
) => (path ? `${IMG_BASE}/${size}${path}` : null);
