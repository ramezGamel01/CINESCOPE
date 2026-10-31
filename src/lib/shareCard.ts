import { textOn } from "@/lib/color";
import type { Swatch } from "@/types/movie";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5, the portrait size Instagram and LinkedIn show in full

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Poster failed to load"));
    // A separate cache entry: the copy the page already shows may have been
    // cached without the CORS header a canvas needs
    img.src = url.startsWith("http") ? `${url}${url.includes("?") ? "&" : "?"}canvas` : url;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws a shareable card: the poster, the title and the film's palette. */
export async function renderShareCard(film: {
  title: string;
  year: string | number;
  posterUrl: string;
  palette: Swatch[];
}): Promise<Blob> {
  await Promise.all([
    document.fonts.load('96px "Bebas Neue"'),
    document.fonts.load('600 28px "Inter"'),
  ]);
  const poster = await loadImage(film.posterUrl);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // Background: the film's two largest colors, darkened
  const [first, second] = film.palette;
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, first?.hex ?? "#111");
  bg.addColorStop(1, second?.hex ?? "#222");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgb(8 8 12 / 0.62)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Poster with a soft shadow
  const posterW = 520;
  const posterH = 780;
  const px = (WIDTH - posterW) / 2;
  const py = 90;
  ctx.save();
  ctx.shadowColor = "rgb(0 0 0 / 0.6)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  roundedRect(ctx, px, py, posterW, posterH, 28);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundedRect(ctx, px, py, posterW, posterH, 28);
  ctx.clip();
  ctx.drawImage(poster, px, py, posterW, posterH);
  ctx.restore();

  // Title and year
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = '96px "Bebas Neue", Impact, sans-serif';
  ctx.fillText(film.title.toUpperCase(), WIDTH / 2, py + posterH + 120, WIDTH - 120);
  ctx.font = '600 28px "Inter", sans-serif';
  ctx.fillStyle = "rgb(255 255 255 / 0.7)";
  ctx.fillText(String(film.year), WIDTH / 2, py + posterH + 165);

  // Palette bar sized by share of the frame
  const barX = 90;
  const barY = HEIGHT - 175;
  const barW = WIDTH - 180;
  ctx.save();
  roundedRect(ctx, barX, barY, barW, 70, 35);
  ctx.clip();
  let x = barX;
  const total = film.palette.reduce((s, sw) => s + sw.weight, 0);
  for (const swatch of film.palette) {
    const w = (swatch.weight / total) * barW;
    ctx.fillStyle = swatch.hex;
    ctx.fillRect(x, barY, w + 1, 70);
    if (w > 110) {
      ctx.fillStyle = textOn(swatch.hex);
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillText(swatch.hex.toUpperCase(), x + w / 2, barY + 43);
    }
    x += w;
  }
  ctx.restore();

  ctx.font = '600 22px "Inter", sans-serif';
  ctx.fillStyle = "rgb(255 255 255 / 0.55)";
  ctx.fillText("CineScope · search films by color", WIDTH / 2, HEIGHT - 45);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/png",
    ),
  );
}
