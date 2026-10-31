import type { Swatch } from "@/types/movie";

/** A film's palette as one bar: each color as wide as the share of the frame it covers. */
export function PaletteBar({
  palette,
  className = "h-3",
  showHex = false,
}: {
  palette: Swatch[];
  className?: string;
  showHex?: boolean;
}) {
  return (
    <div className={`flex w-full overflow-hidden rounded-full ${className}`} role="img" aria-label={`Colors: ${palette.map((s) => s.hex).join(", ")}`}>
      {palette.map((swatch) => (
        <span
          key={swatch.hex}
          title={`${swatch.hex} · ${Math.round(swatch.weight * 100)}%`}
          className="palette-swatch relative h-full"
          style={{ backgroundColor: swatch.hex, flexGrow: swatch.weight }}
        >
          {showHex && swatch.weight > 0.12 && (
            <span className="absolute inset-x-0 bottom-1 text-center font-mono text-[10px] uppercase opacity-80 mix-blend-difference">
              {swatch.hex}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** The average color of vertical slices of a still, left to right. */
export function ColorStrip({ strip, className = "h-10" }: { strip: string[]; className?: string }) {
  return (
    <div className={`flex w-full overflow-hidden rounded-xl ${className}`} aria-hidden="true">
      {strip.map((hex, i) => (
        <span key={i} className="h-full flex-1" style={{ backgroundColor: hex }} />
      ))}
    </div>
  );
}
