import { posterUrl } from "@/services/tmdb";

/**
 * A tilted wall of posters in 3D space. Columns drift slowly in opposite
 * directions; the parent's --scroll variable tips the wall back as you scroll.
 */
export function PosterWall({ posters }: { posters: (string | null)[] }) {
  const usable = posters.filter((p): p is string => Boolean(p));
  if (usable.length < 6) return null;
  const columns = Array.from({ length: 8 }, (_, c) =>
    Array.from({ length: 6 }, (_, r) => usable[(c * 5 + r * 3) % usable.length]!),
  );
  return (
    <div className="poster-wall" aria-hidden="true">
      <div className="poster-wall__plane">
        {columns.map((column, c) => (
          <div key={c} className={`poster-wall__column ${c % 2 ? "is-down" : ""}`} style={{ animationDuration: `${38 + c * 4}s` }}>
            {[...column, ...column].map((path, r) => (
              <img key={r} src={posterUrl(path, "w185")} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
