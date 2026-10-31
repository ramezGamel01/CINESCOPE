import { distance, oklabToHex, rgbToOklab, type Lab } from "@/lib/color";
import type { Swatch } from "@/types/movie";

/**
 * Extracts a palette from an image in the browser, for films that aren't in
 * the prebuilt catalog. Same steps as the offline script: trim letterbox bars,
 * convert to OKLab, cluster with k-means++, merge look-alike colors.
 */

const CLUSTERS = 6;
const STRIP_SLICES = 16;
const MERGE_DISTANCE = 0.045;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = url;
  });
}

function kmeans(points: Lab[], k: number, random: () => number): { centers: Lab[]; counts: number[] } {
  const centers: Lab[] = [points[Math.floor(random() * points.length)]!];
  while (centers.length < k) {
    const dist = points.map((p) => Math.min(...centers.map((c) => distance(p, c) ** 2)));
    const total = dist.reduce((a, b) => a + b, 0);
    let pick = random() * total;
    let index = 0;
    while (pick > dist[index]! && index < points.length - 1) pick -= dist[index++]!;
    centers.push(points[index]!);
  }
  const labels = new Array<number>(points.length).fill(0);
  for (let iteration = 0; iteration < 25; iteration++) {
    points.forEach((p, i) => {
      let best = 0;
      for (let c = 1; c < k; c++) if (distance(p, centers[c]!) < distance(p, centers[best]!)) best = c;
      labels[i] = best;
    });
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => labels[i] === c);
      if (!members.length) continue;
      centers[c] = [0, 1, 2].map((axis) => members.reduce((s, m) => s + m[axis]!, 0) / members.length) as Lab;
    }
  }
  const counts = new Array<number>(k).fill(0);
  labels.forEach((label) => counts[label]!++);
  return { centers, counts };
}

export async function extractPalette(url: string, seed = 1): Promise<{ palette: Swatch[]; strip: string[] }> {
  const img = await loadImage(url);
  const width = 120;
  const height = Math.round((width * img.naturalHeight) / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(img, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  // Rows of OKLab pixels, without near-black letterbox rows
  const rows: Lab[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Lab[] = [];
    let brightness = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b] = [data[i]! / 255, data[i + 1]! / 255, data[i + 2]! / 255];
      brightness += (r + g + b) / 3;
      row.push(rgbToOklab(r, g, b));
    }
    if (brightness / width > 0.05) rows.push(row);
  }
  const frame = rows.length > height / 3 ? rows : [];
  const pixels = frame.flat();
  if (!pixels.length) throw new Error("Image too dark to read");

  const random = seededRandom(seed);
  const sample = pixels.length > 4000 ? pixels.filter(() => random() < 4000 / pixels.length) : pixels;
  const { centers, counts } = kmeans(sample, CLUSTERS, random);
  const total = counts.reduce((a, b) => a + b, 0);

  const merged: { lab: Lab; weight: number }[] = [];
  centers
    .map((lab, i) => ({ lab, weight: counts[i]! / total }))
    .sort((a, b) => b.weight - a.weight)
    .forEach((swatch) => {
      const twin = merged.find((m) => distance(m.lab, swatch.lab) < MERGE_DISTANCE);
      if (!twin) return void merged.push(swatch);
      const weight = twin.weight + swatch.weight;
      twin.lab = [0, 1, 2].map((a) => (twin.lab[a]! * twin.weight + swatch.lab[a]! * swatch.weight) / weight) as Lab;
      twin.weight = weight;
    });

  const palette = merged
    .filter((s) => s.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((s) => ({ hex: oklabToHex(s.lab), weight: s.weight, lab: s.lab }));

  const sliceWidth = width / STRIP_SLICES;
  const strip = Array.from({ length: STRIP_SLICES }, (_, slice) => {
    const sum: Lab = [0, 0, 0];
    let n = 0;
    for (const row of frame) {
      for (let x = Math.floor(slice * sliceWidth); x < Math.floor((slice + 1) * sliceWidth); x++) {
        const p = row[x]!;
        sum[0] += p[0];
        sum[1] += p[1];
        sum[2] += p[2];
        n++;
      }
    }
    return oklabToHex([sum[0] / n, sum[1] / n, sum[2] / n]);
  });

  return { palette, strip };
}
