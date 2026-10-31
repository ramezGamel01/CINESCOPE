import { createServerFn } from "@tanstack/react-start";
import { catalogDetail, catalogTrending, searchCatalog } from "@/services/catalog";
import type { Movie, MovieDetail } from "@/types/movie";

const BASE_URL = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";

type TmdbCall =
  { kind: "trending" } | { kind: "search"; query: string } | { kind: "detail"; id: string };

// TMDB is called from the server, so the API key never reaches the browser.
// Only these three calls are accepted, so the endpoint can't be used as an open proxy.
const callTmdb = createServerFn({ method: "GET" })
  .validator((input: unknown): TmdbCall => {
    const call = (input ?? {}) as { kind?: unknown; query?: unknown; id?: unknown };
    if (call.kind === "trending") return { kind: "trending" };
    if (call.kind === "search" && typeof call.query === "string") {
      const query = call.query.trim();
      if (query && query.length <= 200) return { kind: "search", query };
    }
    if (call.kind === "detail" && /^\d{1,10}$/.test(String(call.id ?? ""))) {
      return { kind: "detail", id: String(call.id) };
    }
    throw new Error("Unsupported TMDB request");
  })
  .handler(async ({ data }): Promise<string | null> => {
    const key = process.env.TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY;
    if (!key) return null;
    const path =
      data.kind === "trending"
        ? "/trending/movie/week"
        : data.kind === "search"
          ? "/search/movie"
          : `/movie/${data.id}`;
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("api_key", key);
    if (data.kind === "search") {
      url.searchParams.set("query", data.query);
      url.searchParams.set("include_adult", "false");
    }
    if (data.kind === "detail") url.searchParams.set("append_to_response", "credits,videos");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
    return res.text();
  });

// Whether the last answer came from TMDB (true) or the server has no key (false)
let live: boolean | null = null;
export const isLive = () => live !== false;

async function fromTmdb<T>(call: TmdbCall): Promise<T | null> {
  const text = await callTmdb({ data: call });
  live = text !== null;
  return text === null ? null : (JSON.parse(text) as T);
}

// Without an API key on the server the app runs on the curated offline catalog
export const getTrending = async (): Promise<Movie[]> =>
  (await fromTmdb<{ results: Movie[] }>({ kind: "trending" }))?.results ?? catalogTrending();

export const searchMovies = async (query: string): Promise<Movie[]> =>
  (await fromTmdb<{ results: Movie[] }>({ kind: "search", query }))?.results ??
  searchCatalog(query);

export const getMovieDetails = async (id: string | number): Promise<MovieDetail> =>
  (await fromTmdb<MovieDetail>({ kind: "detail", id: String(id) })) ?? catalogDetail(id);

export const posterUrl = (
  path: string | null,
  size: "w185" | "w342" | "w500" | "original" = "w500",
) =>
  path ? `${IMG_BASE}/${size}${path}` : `https://placehold.co/500x750/1a1a2e/f5a623?text=No+Poster`;

export const backdropUrl = (
  path: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280",
) => (path ? `${IMG_BASE}/${size}${path}` : null);
