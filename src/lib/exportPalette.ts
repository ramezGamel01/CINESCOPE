import type { Swatch } from "@/types/movie";

const slug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "film";

/** CSS custom properties, one per color, largest share first. */
export function paletteToCss(title: string, palette: Swatch[]): string {
  const name = slug(title);
  const lines = palette.map(
    (s, i) => `  --${name}-${i + 1}: ${s.hex}; /* ${Math.round(s.weight * 100)}% */`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

/** A colors block to paste into a Tailwind config. */
export function paletteToTailwind(title: string, palette: Swatch[]): string {
  const entries = palette.map((s, i) => `    ${(i + 1) * 100}: "${s.hex}",`);
  return `"${slug(title)}": {\n${entries.join("\n")}\n}`;
}

/** An SVG of labeled swatches; dropped into Figma or Illustrator it becomes editable shapes. */
export function paletteToSvg(title: string, palette: Swatch[]): string {
  const size = 120;
  const swatches = palette
    .map(
      (s, i) =>
        `<rect x="${i * (size + 16)}" y="0" width="${size}" height="${size}" rx="12" fill="${s.hex}"/>` +
        `<text x="${i * (size + 16)}" y="${size + 22}" font-family="Inter, sans-serif" font-size="14" fill="#222">${s.hex}</text>`,
    )
    .join("");
  const width = palette.length * (size + 16) - 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${size + 30}" viewBox="0 0 ${width} ${size + 30}"><title>${title} palette</title>${swatches}</svg>`;
}

export function downloadFile(name: string, content: Blob | string, type = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export const paletteFileName = (title: string, ext: string) => `${slug(title)}-palette.${ext}`;
