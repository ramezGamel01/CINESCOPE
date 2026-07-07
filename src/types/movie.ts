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
