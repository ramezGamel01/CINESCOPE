import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Clock, Palette, Play, Star } from "lucide-react";
import { accentSwatch } from "@/lib/colorSearch";
import { extractPalette } from "@/lib/palette";
import { textOn } from "@/lib/color";
import { tiltHandlers, useScrollProgress } from "@/hooks/useMotion";
import { findCatalogFilm } from "@/services/catalog";
import { backdropUrl, posterUrl } from "@/services/tmdb";
import type { MovieDetail } from "@/types/movie";
import { FavoriteButton } from "./FavoriteButton";
import { ColorStrip, PaletteBar } from "./PaletteBar";

/** Palette from the catalog when available, otherwise extracted in the browser. */
function useFilmColors(movie: MovieDetail) {
  const film = findCatalogFilm(movie.id);
  const backdrop = backdropUrl(movie.backdrop_path, "w300");
  const live = useQuery({
    queryKey: ["palette", movie.id],
    queryFn: () => extractPalette(backdrop!, movie.id),
    enabled: !film && Boolean(backdrop),
    staleTime: Infinity,
  });
  return film ? { palette: film.palette, strip: film.strip } : live.data;
}

export function MovieDetails({ movie }: { movie: MovieDetail }) {
  const hero = useRef<HTMLDivElement>(null);
  useScrollProgress(hero);
  const colors = useFilmColors(movie);
  const accent = colors ? accentSwatch(colors.palette) : undefined;
  const backdrop = backdropUrl(movie.backdrop_path);
  const trailer = movie.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const cast = movie.credits?.cast.slice(0, 8) ?? [];
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "";

  return (
    <div
      className="film-page"
      style={
        accent
          ? ({ "--film": accent.hex, "--film-ink": textOn(accent.hex) } as React.CSSProperties)
          : undefined
      }
    >
      <div ref={hero} className="film-hero relative -mx-4 h-[52vh] min-h-[320px] overflow-hidden sm:-mx-6 lg:mx-0 lg:rounded-3xl">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="film-hero__image absolute inset-0 h-full w-full object-cover"
            style={{ viewTransitionName: `backdrop-${movie.id}` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
      </div>

      <div className="relative -mt-44 grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="mx-auto w-48 shrink-0 md:mx-0 md:w-full" style={{ perspective: "900px" }}>
          <div className="tilt film-poster" {...tiltHandlers(14)}>
            <img
              src={posterUrl(movie.poster_path)}
              alt={movie.title}
              className="w-full rounded-2xl shadow-poster"
              style={{ viewTransitionName: `poster-${movie.id}` }}
            />
            <span className="tilt-glare rounded-2xl" />
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="hero-rise font-display text-5xl leading-none tracking-wide sm:text-6xl">{movie.title}</h1>
          {movie.tagline && <p className="mt-3 italic text-muted-foreground">{movie.tagline}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {year && <span>{year}</span>}
            {movie.runtime ? (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
              {movie.vote_average.toFixed(1)} / 10
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <span key={g.id} className="film-chip rounded-full border px-3 py-1 text-xs">
                {g.name}
              </span>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">Overview</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {movie.overview || "No overview available."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <FavoriteButton movie={movie} variant="full" />
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="film-button inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium"
              >
                <Play className="h-4 w-4" /> Watch Trailer
              </a>
            )}
          </div>
        </div>
      </div>

      <section className="reveal mt-14 rounded-3xl border border-border/70 bg-card/40 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Palette className="h-5 w-5" /> Color palette
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The main colors of this film&apos;s still, sized by how much of the frame they cover.
            </p>
          </div>
          {accent && (
            <Link to="/colors" search={{ c: accent.hex }} className="film-link text-sm font-medium">
              Find films with similar colors →
            </Link>
          )}
        </div>
        {colors ? (
          <>
            <PaletteBar palette={colors.palette} className="mt-6 h-16" showHex />
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Across the frame</p>
            <ColorStrip strip={colors.strip} className="mt-2 h-8" />
          </>
        ) : (
          <div className="mt-6 h-16 animate-pulse rounded-full bg-muted" />
        )}
      </section>

      {cast.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Top Cast</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {cast.map((c, i) => (
              <div key={c.id} className="cast-card text-center" style={{ "--i": i } as React.CSSProperties}>
                <img
                  src={
                    c.profile_path
                      ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                      : `https://placehold.co/185x278/1a1a2e/f5a623?text=?`
                  }
                  alt={c.name}
                  loading="lazy"
                  className="mx-auto aspect-[2/3] w-full rounded-xl object-cover"
                />
                <p className="mt-2 truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
