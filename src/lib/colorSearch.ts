import { chroma, distance, hexToOklab, type Lab } from "@/lib/color";
import type { Swatch } from "@/types/movie";

/** How quickly a match fades with color distance (in OKLab units). */
const SPREAD = 0.11;

/**
 * How strongly a palette contains a color: each swatch counts by the share of
 * the frame it covers, discounted by how far it is from the target color.
 */
export function colorScore(palette: Swatch[], target: Lab): number {
  return palette.reduce((sum, swatch) => {
    const d = distance(swatch.lab, target);
    return sum + swatch.weight * Math.exp(-((d / SPREAD) ** 2));
  }, 0);
}

/** Scores against several colors at once; all of them must be present (geometric mean). */
export function matchScore(palette: Swatch[], targets: Lab[]): number {
  const scores = targets.map((t) => colorScore(palette, t));
  return scores.reduce((p, s) => p * Math.max(s, 1e-6), 1) ** (1 / scores.length);
}

export function rankByColor<T extends { palette: Swatch[] }>(
  films: T[],
  targets: Lab[],
): (T & { score: number })[] {
  return films
    .map((film) => ({ ...film, score: matchScore(film.palette, targets) }))
    .sort((a, b) => b.score - a.score);
}

/** The most vivid swatch that is neither too dark nor too light, for accents. */
export function accentSwatch(palette: Swatch[]): Swatch | undefined {
  const usable = palette.filter((s) => s.lab[0] > 0.45 && s.lab[0] < 0.88);
  return [...(usable.length ? usable : palette)].sort(
    (a, b) => chroma(b.lab) * Math.sqrt(b.weight) - chroma(a.lab) * Math.sqrt(a.weight),
  )[0];
}

export interface ColorPreset {
  id: string;
  name: string;
  colors: string[];
}

/** Looks people often search for, each defined by the colors that make it. */
export const PRESETS: ColorPreset[] = [
  { id: "teal-orange", name: "Teal & orange", colors: ["#1d6a73", "#e08a4c"] },
  { id: "neon-noir", name: "Neon noir", colors: ["#d0367a", "#1c1d4a"] },
  { id: "desert", name: "Desert gold", colors: ["#d2a463", "#7a5130"] },
  { id: "pastel", name: "Soft pastel", colors: ["#e9c3cf", "#bcd6e2"] },
  { id: "cold-blue", name: "Cold blue", colors: ["#2d4f7c", "#a9c4dc"] },
  { id: "forest", name: "Deep green", colors: ["#2f5a3c", "#9fb46e"] },
];

export const presetTargets = (preset: ColorPreset): Lab[] => preset.colors.map(hexToOklab);
