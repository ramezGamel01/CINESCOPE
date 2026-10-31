"""Builds the color index behind CineScope's search by color.

For every film in films.json it downloads the backdrop still from TMDB's image
CDN, trims letterbox bars, converts the pixels to OKLab (a color space where
distances match how different colors look to people) and groups them with
k-means++. Each film gets:

- palette: up to 6 dominant colors with the share of the frame they cover
- strip:   the average color of 16 vertical slices, left to right

Usage:
    pip install -r requirements.txt
    python build_palettes.py films.json ../../src/data/catalog.json
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
import urllib.request
from datetime import date

import numpy as np
from PIL import Image

IMAGE_BASE = "https://image.tmdb.org/t/p/w780"
CLUSTERS = 6
STRIP_SLICES = 16
MERGE_DISTANCE = 0.045  # OKLab distance below which two colors read as the same


# --- Color conversion (Björn Ottosson's OKLab) ---------------------------------

def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)


def rgb_to_oklab(rgb: np.ndarray) -> np.ndarray:
    """rgb: (..., 3) sRGB in 0..1 -> (..., 3) OKLab."""
    lin = srgb_to_linear(rgb)
    lms = lin @ np.array([
        [0.4122214708, 0.2119034982, 0.0883024619],
        [0.5363325363, 0.6806995451, 0.2817188376],
        [0.0514459929, 0.1073969566, 0.6299787005],
    ])
    lms = np.cbrt(lms)
    return lms @ np.array([
        [0.2104542553, 1.9779984951, 0.0259040371],
        [0.7936177850, -2.4285922050, 0.7827717662],
        [-0.0040720468, 0.4505937099, -0.8086757660],
    ])


def oklab_to_rgb(lab: np.ndarray) -> np.ndarray:
    lms = lab @ np.array([
        [1.0, 1.0, 1.0],
        [0.3963377774, -0.1055613458, -0.0894841775],
        [0.2158037573, -0.0638541728, -1.2914855480],
    ])
    lin = (lms ** 3) @ np.array([
        [4.0767416621, -1.2684380046, -0.0041960863],
        [-3.3077115913, 2.6097574011, -0.7034186147],
        [0.2309699292, -0.3413193965, 1.7076147010],
    ])
    return linear_to_srgb(lin)


def to_hex(lab: np.ndarray) -> str:
    r, g, b = (np.round(oklab_to_rgb(lab) * 255)).astype(int)
    return f"#{r:02x}{g:02x}{b:02x}"


# --- Image handling ------------------------------------------------------------

def fetch_image(path: str) -> Image.Image:
    with urllib.request.urlopen(IMAGE_BASE + path, timeout=30) as response:
        return Image.open(io.BytesIO(response.read())).convert("RGB")


def trim_letterbox(rgb: np.ndarray, threshold: float = 0.05) -> np.ndarray:
    """Drops near-black bars at the top and bottom of a still."""
    rows = rgb.mean(axis=(1, 2))
    keep = np.where(rows > threshold)[0]
    return rgb[keep[0]:keep[-1] + 1] if len(keep) > rgb.shape[0] // 3 else rgb


# --- Clustering ----------------------------------------------------------------

def kmeans_pp(points: np.ndarray, k: int, rng: np.random.Generator, iterations: int = 30):
    """k-means with k-means++ seeding. Returns (centers, labels)."""
    centers = [points[rng.integers(len(points))]]
    for _ in range(1, k):
        dist = np.min([np.sum((points - c) ** 2, axis=1) for c in centers], axis=0)
        centers.append(points[rng.choice(len(points), p=dist / dist.sum())])
    centers = np.array(centers)
    for _ in range(iterations):
        labels = np.argmin(((points[:, None, :] - centers[None]) ** 2).sum(-1), axis=1)
        moved = np.array([
            points[labels == i].mean(axis=0) if np.any(labels == i) else centers[i]
            for i in range(k)
        ])
        if np.allclose(moved, centers, atol=1e-5):
            break
        centers = moved
    return centers, labels


def palette_for(image: Image.Image, seed: int) -> tuple[list[dict], list[str]]:
    small = image.resize((192, round(192 * image.height / image.width)), Image.LANCZOS)
    rgb = trim_letterbox(np.asarray(small, dtype=np.float64) / 255.0)
    lab = rgb_to_oklab(rgb)

    rng = np.random.default_rng(seed)
    points = lab.reshape(-1, 3)
    if len(points) > 12000:
        points = points[rng.choice(len(points), 12000, replace=False)]
    centers, labels = kmeans_pp(points, CLUSTERS, rng)
    weights = np.bincount(labels, minlength=CLUSTERS) / len(labels)

    # Merge clusters that look the same, then sort by how much of the frame they cover
    swatches: list[tuple[np.ndarray, float]] = []
    for center, weight in sorted(zip(centers, weights), key=lambda cw: -cw[1]):
        for i, (other, other_weight) in enumerate(swatches):
            if np.linalg.norm(center - other) < MERGE_DISTANCE:
                total = other_weight + weight
                swatches[i] = ((other * other_weight + center * weight) / total, total)
                break
        else:
            swatches.append((center, weight))

    palette = []
    for center, weight in sorted(swatches, key=lambda cw: -cw[1]):
        L, a, b = center
        palette.append({
            "hex": to_hex(center),
            "weight": round(float(weight), 4),
            "lab": [round(float(L), 4), round(float(a), 4), round(float(b), 4)],
        })

    columns = np.array_split(lab, STRIP_SLICES, axis=1)
    strip = [to_hex(column.reshape(-1, 3).mean(axis=0)) for column in columns]
    return palette, strip


# --- Visual styles: unsupervised clustering of palettes -------------------------

# Hue bands in OKLCH degrees, named by the color people would call them
HUES = [(0, "red"), (40, "orange"), (80, "gold"), (120, "green"), (165, "teal"),
        (215, "blue"), (285, "violet"), (330, "pink")]
NEUTRAL_CHROMA = 0.04


def hue_band(a: float, b: float) -> int:
    hue = np.degrees(np.arctan2(b, a)) % 360
    return max(i for i, (start, _) in enumerate(HUES) if hue >= start)


def fingerprint(palette: list[dict]) -> np.ndarray:
    """Share of the frame in each (hue band x dark/light) bin, plus 3 grey bins."""
    bins = np.zeros(len(HUES) * 2 + 3)
    for swatch in palette:
        L, a, b = swatch["lab"]
        if np.hypot(a, b) < NEUTRAL_CHROMA:
            bins[len(HUES) * 2 + min(2, int(L * 3))] += swatch["weight"]
        else:
            bins[hue_band(a, b) * 2 + (L >= 0.55)] += swatch["weight"]
    return np.sqrt(bins / bins.sum())  # Hellinger: euclidean k-means on sqrt shares


def style_name(members: list[dict]) -> str:
    swatches = [s for film in members for s in film["palette"]]
    weights = np.array([s["weight"] for s in swatches])
    labs = np.array([s["lab"] for s in swatches])
    lightness = float(np.average(labs[:, 0], weights=weights))
    chroma = float(np.average(np.hypot(labs[:, 1], labs[:, 2]), weights=weights))

    hue_share = np.zeros(len(HUES))
    for (L, a, b), w in zip(labs, weights):
        if np.hypot(a, b) >= NEUTRAL_CHROMA:
            hue_share[hue_band(a, b)] += w * np.hypot(a, b)
    if lightness < 0.4:
        tone = "Dark"
    elif lightness > 0.68:
        tone = "Pale"
    elif chroma < 0.05:
        tone = "Muted"
    elif chroma > 0.09:
        tone = "Vivid"
    else:
        warm = hue_share[[0, 1, 2]].sum() > hue_share[[4, 5, 6]].sum()
        tone = "Warm" if warm else "Cool"
    if hue_share.sum() == 0 or chroma < 0.025:
        return f"{tone} monochrome"
    order = np.argsort(-hue_share)
    name = f"{tone} {HUES[order[0]][1]}"
    if hue_share[order[1]] > 0.45 * hue_share[order[0]]:
        name += f" & {HUES[order[1]][1]}"
    return name


def cluster_styles(catalog: list[dict]) -> list[dict]:
    features = np.array([fingerprint(film["palette"]) for film in catalog])
    k = int(np.clip(round(np.sqrt(len(catalog) / 2)), 3, 8))
    centers, labels = kmeans_pp(features, k, np.random.default_rng(7))
    styles, used = [], set()
    for index in range(k):
        members = [film for film, label in zip(catalog, labels) if label == index]
        if not members:
            continue
        name = style_name(members)
        while name in used:
            name += " II"
        used.add(name)
        style_id = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        # Typical palette: the members' swatches merged by hue band
        merged: dict[int, list] = {}
        for film in members:
            for s in film["palette"]:
                L, a, b = s["lab"]
                band = -1 - min(2, int(L * 3)) if np.hypot(a, b) < NEUTRAL_CHROMA else hue_band(a, b) * 2 + (L >= 0.55)
                merged.setdefault(band, []).append((np.array(s["lab"]), s["weight"]))
        typical = sorted(
            ((sum(lab * w for lab, w in items) / sum(w for _, w in items), sum(w for _, w in items)) for items in merged.values()),
            key=lambda lw: -lw[1],
        )[:5]
        total = sum(w for _, w in typical)
        styles.append({
            "id": style_id,
            "name": name,
            "palette": [{"hex": to_hex(lab), "weight": round(float(w / total), 4)} for lab, w in typical],
            "films": [film["id"] for film in members],
        })
        for film in members:
            film["style"] = style_id
    return sorted(styles, key=lambda s: -len(s["films"]))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("films", help="films.json with TMDB metadata")
    parser.add_argument("output", help="catalog JSON to write")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    films = json.load(open(args.films, encoding="utf-8"))
    catalog = []
    for film in films:
        film["title"] = re.sub(r"[\u200b-\u200f\ufeff]", "", film["title"]).strip()
        image = fetch_image(film["backdrop_path"])
        palette, strip = palette_for(image, seed=film["id"])
        catalog.append({**film, "palette": palette, "strip": strip})
        print(f"{film['title']:<40} {' '.join(s['hex'] for s in palette)}")
        time.sleep(0.1)  # be gentle with the image CDN

    styles = cluster_styles(catalog)
    for style in styles:
        print(f"Style: {style['name']:<28} {len(style['films'])} films")

    payload = {
        "generated": date.today().isoformat(),
        "source": "The Movie Database (TMDB)",
        "styles": styles,
        "films": catalog,
    }
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(catalog)} films to {args.output}")


if __name__ == "__main__":
    main()
