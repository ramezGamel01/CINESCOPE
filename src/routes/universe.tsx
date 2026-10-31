import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ColorUniverse } from "@/components/ColorUniverse";
import { catalog, styles } from "@/services/catalog";

export const Route = createFileRoute("/universe")({
  validateSearch: (search: Record<string, unknown>): { style?: string } => ({
    style:
      typeof search.style === "string" && styles.some((s) => s.id === search.style)
        ? search.style
        : undefined,
  }),
  head: () => ({ meta: [{ title: "The color universe — CineScope" }] }),
  component: UniversePage,
});

function UniversePage() {
  const { style } = Route.useSearch();
  const highlight = useMemo(() => {
    const found = styles.find((s) => s.id === style);
    return found ? new Set(found.films) : null;
  }, [style]);

  return (
    <div>
      <header className="reveal mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-spectrum">The color universe</p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-7xl">
          Every film is a <span className="text-spectrum">point of light</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          Films sit in 3D color space: hue around the ring, more colorful further from the center,
          brighter higher up. Films that look alike end up close together.
        </p>
      </header>

      <section className="universe-stage relative -mx-4 mt-10 h-[72vh] min-h-[460px] overflow-hidden sm:-mx-6 lg:mx-0 lg:rounded-3xl">
        <ColorUniverse films={catalog} highlight={highlight} />
        <p className="pointer-events-none absolute left-0 right-0 top-4 text-center text-xs text-muted-foreground">
          Drag to orbit · scroll to zoom · click a light to open the film
        </p>
      </section>

      {styles.length > 0 && (
        <section className="mt-8">
          <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Light up a style the clustering found
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/universe"
              search={{}}
              replace
              resetScroll={false}
              viewTransition={false}
              className={`preset-chip ${!style ? "is-active" : ""}`}
              style={{ "--a": "#888", "--b": "#444" } as React.CSSProperties}
            >
              All films
            </Link>
            {styles.map((s) => (
              <Link
                key={s.id}
                to="/universe"
                search={{ style: s.id }}
                replace
                resetScroll={false}
                viewTransition={false}
                className={`preset-chip ${style === s.id ? "is-active" : ""}`}
                style={
                  {
                    "--a": s.palette[0]?.hex,
                    "--b": s.palette[1]?.hex ?? s.palette[0]?.hex,
                  } as React.CSSProperties
                }
              >
                <span className="preset-chip__dots" />
                {s.name} · {s.films.length}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
