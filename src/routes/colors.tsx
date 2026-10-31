import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ColorWheel, wheelToLab, type WheelValue } from "@/components/ColorWheel";
import { PaletteBar } from "@/components/PaletteBar";
import { PhotoMatch, type PhotoPalette } from "@/components/PhotoMatch";
import { chroma, hexToOklab, oklabToHex, textOn } from "@/lib/color";
import { PRESETS, presetTargets, rankByColor, rankBySimilarity } from "@/lib/colorSearch";
import { tiltHandlers } from "@/hooks/useMotion";
import { catalog, styles } from "@/services/catalog";
import { backdropUrl, posterUrl } from "@/services/tmdb";
import type { Swatch } from "@/types/movie";

interface ColorSearch {
  c?: string;
  preset?: string;
  style?: string;
}

export const Route = createFileRoute("/colors")({
  validateSearch: (search: Record<string, unknown>): ColorSearch => ({
    c:
      typeof search.c === "string" && /^#?[0-9a-f]{6}$/i.test(search.c)
        ? `#${search.c.replace("#", "").toLowerCase()}`
        : undefined,
    preset:
      typeof search.preset === "string" && PRESETS.some((p) => p.id === search.preset)
        ? search.preset
        : undefined,
    style:
      typeof search.style === "string" && styles.some((s) => s.id === search.style)
        ? search.style
        : undefined,
  }),
  head: () => ({ meta: [{ title: "Search by color — CineScope" }] }),
  component: ColorsPage,
});

const DEFAULT: WheelValue = { hue: 200, chroma: 0.11, lightness: 0.55 };

function wheelFromHex(hex: string): WheelValue {
  const lab = hexToOklab(hex);
  return {
    lightness: Math.min(0.9, Math.max(0.25, lab[0])),
    chroma: Math.min(0.2, chroma(lab)),
    hue: ((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360,
  };
}

// The whole catalog ordered by the hue of each film's most colorful swatch
const spectrum = [...catalog].sort((a, b) => {
  const hue = (film: (typeof catalog)[number]) => {
    const swatch = [...film.palette].sort((x, y) => chroma(y.lab) - chroma(x.lab))[0];
    if (!swatch || chroma(swatch.lab) < 0.03) return 400; // near-grey films go last
    return ((Math.atan2(swatch.lab[2], swatch.lab[1]) * 180) / Math.PI + 360) % 360;
  };
  return hue(a) - hue(b);
});

function ColorsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [wheel, setWheel] = useState<WheelValue>(() =>
    search.c ? wheelFromHex(search.c) : DEFAULT,
  );
  const [photo, setPhoto] = useState<PhotoPalette | null>(null);
  const preset = PRESETS.find((p) => p.id === search.preset);
  const style = styles.find((s) => s.id === search.style);
  const hex = oklabToHex(wheelToLab(wheel));

  const results = useMemo(() => {
    if (photo) return rankBySimilarity(catalog, photo.palette).slice(0, 12);
    if (style) {
      const palette: Swatch[] = style.palette.map((s) => ({ ...s, lab: hexToOklab(s.hex) }));
      const members = new Set(style.films);
      return rankBySimilarity(
        catalog.filter((film) => members.has(film.id)),
        palette,
      );
    }
    const targets = preset ? presetTargets(preset) : [wheelToLab(wheel)];
    return rankByColor(catalog, targets).slice(0, 12);
  }, [photo, style, preset, wheel]);

  const chooseColor = (value: WheelValue) => {
    setWheel(value);
    setPhoto(null);
    navigate({
      search: { c: oklabToHex(wheelToLab(value)) },
      replace: true,
      resetScroll: false,
      viewTransition: false,
    });
  };
  const choosePhoto = (value: PhotoPalette) => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(value);
  };
  const badge = (score: number, index: number) =>
    photo
      ? `${Math.round(Math.min(1, score) * 100)}% alike`
      : style || preset
        ? `#${index + 1} for this look`
        : `${Math.round(score * 100)}% of the frame`;

  return (
    <div className="pb-10">
      <header className="reveal mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-spectrum">Search by color</p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-7xl">
          Pick a color. <span className="text-primary">Find the films that look like it.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          Every film&apos;s palette comes from its stills: the pixels are grouped with k-means in
          OKLab, a color space where distance matches what your eye sees. Results rank films by how
          much of the frame is close to your color.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass-panel flex flex-col items-center gap-6 rounded-3xl p-6">
            <ColorWheel value={wheel} onChange={chooseColor} />
            <div
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 font-mono text-sm uppercase transition-colors"
              style={{
                backgroundColor: preset ? undefined : hex,
                color: preset ? undefined : textOn(hex),
              }}
            >
              {preset ? (
                <span className="flex w-full items-center justify-between">
                  <span className="font-sans normal-case">{preset.name}</span>
                  <span className="flex gap-1">
                    {preset.colors.map((c) => (
                      <span
                        key={c}
                        className="h-5 w-5 rounded-full border border-white/20"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                </span>
              ) : (
                <>
                  <span>{hex}</span>
                  <span className="font-sans text-xs normal-case opacity-80">your color</span>
                </>
              )}
            </div>
            <div className="w-full">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Or try a look
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Link
                    key={p.id}
                    to="/colors"
                    search={{ preset: p.id }}
                    replace
                    resetScroll={false}
                    viewTransition={false}
                    className={`preset-chip ${search.preset === p.id ? "is-active" : ""}`}
                    style={{ "--a": p.colors[0], "--b": p.colors[1] } as React.CSSProperties}
                  >
                    <span className="preset-chip__dots" />
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
            <PhotoMatch onPhoto={choosePhoto} />
          </div>
        </aside>

        <section aria-live="polite">
          <h2 className="mb-5 flex items-baseline justify-between gap-4">
            <span className="font-display text-3xl tracking-wide">
              {style ? style.name : "Best matches"}
            </span>
            <span className="text-sm text-muted-foreground">
              {style ? `${style.films.length} films in this style` : `from ${catalog.length} films`}
            </span>
          </h2>
          {photo && (
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-3">
              <img src={photo.url} alt="Your photo" className="h-16 w-24 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Films with your photo&apos;s colors</p>
                <PaletteBar palette={photo.palette} className="mt-2 h-3" />
              </div>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(photo.url);
                  setPhoto(null);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((film, i) => (
              <Link
                key={`${photo?.url ?? search.style ?? search.preset ?? hex}-${film.id}`}
                to="/movie/$id"
                params={{ id: String(film.id) }}
                className="match-card tilt group block"
                style={{ "--i": i } as React.CSSProperties}
                {...tiltHandlers(8)}
              >
                <div className="relative aspect-video overflow-hidden rounded-2xl">
                  <img
                    src={backdropUrl(film.backdrop_path, "w780") ?? ""}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ viewTransitionName: `backdrop-${film.id}` }}
                  />
                  <span className="tilt-glare" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                    {badge(film.score, i)}
                  </span>
                </div>
                <PaletteBar palette={film.palette} className="mt-3 h-2.5" />
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <h3 className="truncate font-semibold">{film.title}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {film.release_date?.slice(0, 4)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {styles.length > 0 && (
        <section className="mt-24">
          <div className="reveal mb-8 text-center">
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              Styles the algorithm found
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              Nobody labeled these. k-means grouped films whose palettes share the same hues and
              brightness, and each group is named from its own colors.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {styles.map((s) => {
              const posters = s.films
                .slice(0, 4)
                .map((id) => catalog.find((f) => f.id === id)?.poster_path ?? null);
              return (
                <Link
                  key={s.id}
                  to="/colors"
                  search={{ style: s.id }}
                  resetScroll={false}
                  viewTransition={false}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className={`style-card reveal ${search.style === s.id ? "is-active" : ""}`}
                  style={
                    {
                      "--a": s.palette[0]?.hex,
                      "--b": s.palette[1]?.hex ?? s.palette[0]?.hex,
                    } as React.CSSProperties
                  }
                >
                  <div className="grid grid-cols-4 gap-1.5">
                    {posters.map((path, i) => (
                      <img
                        key={i}
                        src={posterUrl(path, "w185")}
                        alt=""
                        loading="lazy"
                        className="aspect-[2/3] w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                  <PaletteBar
                    palette={s.palette.map((sw) => ({ ...sw, lab: hexToOklab(sw.hex) }))}
                    className="mt-4 h-3"
                  />
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-2xl tracking-wide">{s.name}</h3>
                    <span className="text-xs text-muted-foreground">{s.films.length} films</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-24">
        <div className="reveal mb-8 text-center">
          <h2 className="font-display text-4xl tracking-wide sm:text-5xl">The spectrum</h2>
          <p className="mt-2 text-muted-foreground">
            Every film in the catalog, ordered by the hue of its most vivid color.
          </p>
        </div>
        <div className="spectrum-grid">
          {spectrum.map((film) => (
            <Link
              key={film.id}
              to="/movie/$id"
              params={{ id: String(film.id) }}
              className="reveal group flex items-center gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
            >
              <span className="w-40 shrink-0 truncate text-sm text-muted-foreground group-hover:text-foreground sm:w-56">
                {film.title}
              </span>
              <PaletteBar
                palette={film.palette}
                className="h-6 transition-[height] duration-300 group-hover:h-8"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
