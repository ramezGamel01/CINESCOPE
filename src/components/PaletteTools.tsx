import { useState } from "react";
import { Check, Code2, Download, ImageDown, Wind } from "lucide-react";
import {
  downloadFile,
  paletteFileName,
  paletteToCss,
  paletteToSvg,
  paletteToTailwind,
} from "@/lib/exportPalette";
import { renderShareCard } from "@/lib/shareCard";
import type { Swatch } from "@/types/movie";

/** Export a film's palette for design tools, or download a share card. */
export function PaletteTools({
  title,
  year,
  posterUrl,
  palette,
}: {
  title: string;
  year: string | number;
  posterUrl: string;
  palette: Swatch[];
}) {
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (label: string) => {
    setDone(label);
    setTimeout(() => setDone(null), 1800);
  };
  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    flash(label);
  };

  const buttons = [
    {
      id: "css",
      label: "Copy CSS",
      Icon: Code2,
      run: () => copy("css", paletteToCss(title, palette)),
    },
    {
      id: "tailwind",
      label: "Copy Tailwind",
      Icon: Wind,
      run: () => copy("tailwind", paletteToTailwind(title, palette)),
    },
    {
      id: "svg",
      label: "SVG for Figma",
      Icon: Download,
      run: () => {
        downloadFile(paletteFileName(title, "svg"), paletteToSvg(title, palette), "image/svg+xml");
        flash("svg");
      },
    },
    {
      id: "card",
      label: busy ? "Drawing…" : "Share card",
      Icon: ImageDown,
      run: async () => {
        setBusy(true);
        try {
          const blob = await renderShareCard({ title, year, posterUrl, palette });
          downloadFile(paletteFileName(title, "png"), blob);
          flash("card");
        } finally {
          setBusy(false);
        }
      },
    },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {buttons.map(({ id, label, Icon, run }) => (
        <button
          key={id}
          type="button"
          onClick={() => void run()}
          disabled={busy && id === "card"}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-2 text-sm transition-colors hover:border-[var(--film)] hover:text-foreground disabled:opacity-60"
        >
          {done === id ? (
            <Check className="h-4 w-4 text-[var(--film)]" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {done === id ? (id === "svg" || id === "card" ? "Downloaded" : "Copied") : label}
        </button>
      ))}
    </div>
  );
}
