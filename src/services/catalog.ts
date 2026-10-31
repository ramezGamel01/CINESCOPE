import data from "@/data/catalog.json";
import type { CatalogFilm, Movie, MovieDetail } from "@/types/movie";

/**
 * The curated catalog: real TMDB metadata plus color palettes built by
 * tools/palettes. It powers search by color, and it lets the whole app run
 * without an API key.
 */
export const catalog = data.films as unknown as CatalogFilm[];

const byId = new Map(catalog.map((film) => [film.id, film]));

export const findCatalogFilm = (id: number | string) => byId.get(Number(id));

export const catalogTrending = (): Movie[] => catalog.filter((film) => film.trending);

export function searchCatalog(query: string): Movie[] {
  const q = query.trim().toLowerCase();
  return catalog.filter(
    (film) =>
      film.title.toLowerCase().includes(q) ||
      film.genres.some((genre) => genre.name.toLowerCase() === q),
  );
}

export function catalogDetail(id: number | string): MovieDetail {
  const film = findCatalogFilm(id);
  if (!film) throw new Error("This film isn't in the offline catalog.");
  return {
    ...film,
    credits: { cast: film.cast },
    videos: {
      results: film.trailer_key
        ? [{ id: film.trailer_key, key: film.trailer_key, site: "YouTube", type: "Trailer", name: "Trailer" }]
        : [],
    },
  };
}
