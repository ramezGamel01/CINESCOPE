/**
 * Color helpers in OKLab, a color space where the distance between two colors
 * matches how different they look to people. Same math as the palette script
 * (tools/palettes/build_palettes.py), so browser and offline results agree.
 */

export type Lab = [number, number, number];

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab -> sRGB in 0..1. `inGamut` is false when the color can't be shown exactly. */
export function oklabToRgb([L, a, b]: Lab): { rgb: [number, number, number]; inGamut: boolean } {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const inGamut = linear.every((c) => c >= -0.001 && c <= 1.001);
  const rgb = linear.map((c) => linearToSrgb(Math.min(1, Math.max(0, c)))) as [
    number,
    number,
    number,
  ];
  return { rgb, inGamut };
}

export function hexToOklab(hex: string): Lab {
  const value = parseInt(hex.replace("#", ""), 16);
  return rgbToOklab(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

export function oklabToHex(lab: Lab): string {
  const { rgb } = oklabToRgb(lab);
  return `#${rgb
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Lightness 0..1, chroma 0..~0.37, hue in degrees -> OKLab. */
export function oklch(L: number, C: number, hueDegrees: number): Lab {
  const h = (hueDegrees * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

export function chroma([, a, b]: Lab): number {
  return Math.hypot(a, b);
}

export function distance(x: Lab, y: Lab): number {
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Readable text color (near black or white) for a background. */
export function textOn(hex: string): string {
  return hexToOklab(hex)[0] > 0.68 ? "#111" : "#fff";
}
