import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { extractPalette } from "@/lib/palette";
import type { Swatch } from "@/types/movie";

export interface PhotoPalette {
  url: string;
  palette: Swatch[];
}

/**
 * Drop or pick any photo; its palette is extracted right here in the browser
 * (nothing is uploaded) and used to find films that look like it.
 */
export function PhotoMatch({ onPhoto }: { onPhoto: (photo: PhotoPalette) => void }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const read = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    setError(null);
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const { palette } = await extractPalette(url, file.size);
      onPhoto({ url, palette });
    } catch {
      setError("Couldn't read colors from that image.");
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      className={`photo-drop ${dragging ? "is-dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void read(e.dataTransfer.files[0]);
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void read(e.target.files?.[0])}
      />
      <ImagePlus className="h-6 w-6" />
      <span className="font-medium text-foreground">
        {busy ? "Reading colors…" : "Match a photo"}
      </span>
      <span className="text-xs">Drop an image or choose one. It stays on your device.</span>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
