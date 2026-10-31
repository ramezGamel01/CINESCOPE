export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

export interface MovieDetail extends Movie {
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string | null;
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  site: string;
  type: string;
  name: string;
}

export interface FavoriteMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

/** One dominant color of a film still, with the share of the frame it covers. */
export interface Swatch {
  hex: string;
  weight: number;
  lab: [number, number, number];
}

/** A film in the prebuilt color catalog (src/data/catalog.json). */
export interface CatalogFilm extends Movie {
  tagline: string | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  cast: CastMember[];
  trailer_key: string | null;
  trending: boolean;
  palette: Swatch[];
  strip: string[];
  style?: string;
}

/** A visual style found by clustering palettes (tools/palettes). */
export interface FilmStyle {
  id: string;
  name: string;
  palette: { hex: string; weight: number }[];
  films: number[];
}
