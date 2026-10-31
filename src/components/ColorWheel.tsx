import { useEffect, useRef } from "react";
import { oklabToRgb, oklch, type Lab } from "@/lib/color";

const SIZE = 260;
const MAX_CHROMA = 0.2;

export interface WheelValue {
  hue: number;
  chroma: number;
  lightness: number;
}

export const wheelToLab = (v: WheelValue): Lab => oklch(v.lightness, v.chroma, v.hue);

/**
 * A perceptual color wheel: hue around the circle, colorfulness from the
 * center out, lightness on the slider. Drawn in OKLCH so equal steps look equal.
 */
export function ColorWheel({ value, onChange }: { value: WheelValue; onChange: (v: WheelValue) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const image = context.createImageData(SIZE, SIZE);
    const r = SIZE / 2;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - r;
        const dy = y - r;
        const d = Math.hypot(dx, dy) / r;
        const i = (y * SIZE + x) * 4;
        if (d > 1) continue;
        const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const { rgb } = oklabToRgb(oklch(value.lightness, d * MAX_CHROMA, hue));
        image.data[i] = rgb[0] * 255;
        image.data[i + 1] = rgb[1] * 255;
        image.data[i + 2] = rgb[2] * 255;
        image.data[i + 3] = d > 0.985 ? (1 - d) * 255 * 60 : 255;
      }
    }
    context.putImageData(image, 0, 0);
  }, [value.lightness]);

  const pick = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const d = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
    onChange({ ...value, hue: ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360, chroma: d * MAX_CHROMA });
  };

  const angle = (value.hue * Math.PI) / 180;
  const radius = (value.chroma / MAX_CHROMA) * 50;
  const { rgb } = oklabToRgb(wheelToLab(value));

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="color-wheel relative" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="h-full w-full cursor-crosshair touch-none rounded-full"
          aria-label="Color wheel: drag to choose a color"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pick(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && pick(e)}
        />
        <span
          className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.4),0_6px_16px_rgba(0,0,0,.5)] transition-[left,top] duration-75"
          style={{
            left: `${50 + radius * Math.cos(angle)}%`,
            top: `${50 + radius * Math.sin(angle)}%`,
            backgroundColor: `rgb(${rgb.map((c) => Math.round(c * 255)).join(",")})`,
          }}
        />
      </div>
      <label className="flex w-full max-w-[260px] flex-col gap-2 text-xs text-muted-foreground">
        <span className="flex justify-between">
          <span>Darker</span>
          <span>Lightness</span>
          <span>Lighter</span>
        </span>
        <input
          type="range"
          min={0.25}
          max={0.9}
          step={0.01}
          value={value.lightness}
          onChange={(e) => onChange({ ...value, lightness: Number(e.target.value) })}
          className="lightness-slider w-full"
        />
      </label>
    </div>
  );
}
