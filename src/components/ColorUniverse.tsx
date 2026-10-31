import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { chroma, oklabToRgb, oklch, type Lab } from "@/lib/color";
import { accentSwatch } from "@/lib/colorSearch";
import { useMotion } from "@/hooks/useMotion";
import { posterUrl } from "@/services/tmdb";
import type { CatalogFilm } from "@/types/movie";
import { PaletteBar } from "./PaletteBar";

/**
 * Every film as a glowing point in 3D color space (OKLab): hue around the
 * circle, colorfulness out from the center, lightness up the axis. Drag to
 * orbit, scroll to zoom, hover for details, click to open the film.
 */

const SPREAD = 15; // chroma -> distance from the axis
const HEIGHT = 4.2; // lightness -> height

function signature(film: CatalogFilm): Lab {
  const vivid = accentSwatch(film.palette);
  const total = film.palette.reduce((s, sw) => s + sw.weight, 0);
  const lightness = film.palette.reduce((s, sw) => s + sw.lab[0] * sw.weight, 0) / total;
  return vivid && chroma(vivid.lab) > 0.03
    ? [lightness, vivid.lab[1], vivid.lab[2]]
    : [lightness, 0, 0];
}

function glowTexture(THREE: typeof import("three")) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.95)");
  g.addColorStop(0.42, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function ColorUniverse({
  films,
  highlight,
}: {
  films: CatalogFilm[];
  highlight: Set<number> | null;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const spritesRef = useRef<Map<number, import("three").Sprite>>(new Map());
  const [hovered, setHovered] = useState<{ film: CatalogFilm; x: number; y: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [motion] = useMotion();
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const navigate = useNavigate();

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(4.6, 1.9, 5.6);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.minDistance = 2;
      controls.maxDistance = 12;
      controls.target.set(0, -0.25, 0);

      // Hue ring at the base and a lightness axis
      const ringPoints: number[] = [];
      const ringColors: number[] = [];
      for (let i = 0; i <= 180; i++) {
        const hue = (i / 180) * 360;
        const lab = oklch(0.72, 0.15, hue);
        ringPoints.push(lab[1] * SPREAD, -HEIGHT / 2 - 0.15, lab[2] * SPREAD);
        ringColors.push(...oklabToRgb(lab).rgb);
      }
      const ring = new THREE.BufferGeometry();
      ring.setAttribute("position", new THREE.Float32BufferAttribute(ringPoints, 3));
      ring.setAttribute("color", new THREE.Float32BufferAttribute(ringColors, 3));
      scene.add(
        new THREE.Line(
          ring,
          new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 }),
        ),
      );
      const axis = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -HEIGHT / 2 - 0.15, 0),
        new THREE.Vector3(0, HEIGHT / 2 + 0.2, 0),
      ]);
      scene.add(
        new THREE.Line(
          axis,
          new THREE.LineBasicMaterial({ color: 0x777788, transparent: true, opacity: 0.5 }),
        ),
      );

      // One glowing sprite per film
      const texture = glowTexture(THREE);
      const sprites: import("three").Sprite[] = [];
      for (const film of films) {
        const lab = signature(film);
        const [r, g, b] = oklabToRgb(lab).rgb;
        const material = new THREE.SpriteMaterial({
          map: texture,
          color: new THREE.Color(r, g, b),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(lab[1] * SPREAD, (lab[0] - 0.5) * HEIGHT, lab[2] * SPREAD);
        const size = 0.2 + (film.vote_average || 6) * 0.022;
        sprite.scale.setScalar(size);
        sprite.userData = { film, size };
        sprites.push(sprite);
        spritesRef.current.set(film.id, sprite);
        scene.add(sprite);
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let hoverSprite: import("three").Sprite | null = null;

      const onMove = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(sprites)[0]?.object as
          import("three").Sprite | undefined;
        if (hoverSprite && hoverSprite !== hit)
          hoverSprite.scale.setScalar(hoverSprite.userData.size);
        hoverSprite = hit ?? null;
        renderer.domElement.style.cursor = hit ? "pointer" : "grab";
        if (hit) {
          hit.scale.setScalar(hit.userData.size * 1.8);
          setHovered({
            film: hit.userData.film,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        } else {
          setHovered(null);
        }
      };
      let downAt = { x: 0, y: 0 };
      const onDown = (event: PointerEvent) => (downAt = { x: event.clientX, y: event.clientY });
      const onUp = (event: PointerEvent) => {
        // A click, not the end of a drag
        if (hoverSprite && Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) < 5) {
          navigate({ to: "/movie/$id", params: { id: String(hoverSprite.userData.film.id) } });
        }
      };
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointerleave", () => setHovered(null));

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      let frame = 0;
      const tick = () => {
        controls.autoRotate = motionRef.current && !hoverSprite;
        controls.autoRotateSpeed = 0.7;
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        sprites.forEach((s) => s.material.dispose());
        texture.dispose();
        ring.dispose();
        axis.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        spritesRef.current.clear();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [films, navigate]);

  // Dim the films outside the highlighted style
  useEffect(() => {
    for (const [id, sprite] of spritesRef.current) {
      sprite.material.opacity = !highlight || highlight.has(id) ? 1 : 0.12;
    }
  }, [highlight]);

  if (failed) {
    return (
      <div className="grid h-full place-items-center p-8 text-center text-muted-foreground">
        Your browser can&apos;t show 3D graphics here. Try the color spectrum on the Colors page
        instead.
      </div>
    );
  }

  return (
    <div ref={mount} className="universe-canvas relative h-full w-full">
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 flex w-64 gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(hovered.x + 16, (mount.current?.clientWidth ?? 600) - 272),
            top: Math.max(8, hovered.y - 40),
          }}
        >
          <img
            src={posterUrl(hovered.film.poster_path, "w185")}
            alt=""
            className="h-24 w-16 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{hovered.film.title}</p>
            <p className="text-xs text-muted-foreground">
              {hovered.film.release_date?.slice(0, 4)}
            </p>
            <PaletteBar palette={hovered.film.palette} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">Click to open</p>
          </div>
        </div>
      )}
    </div>
  );
}
