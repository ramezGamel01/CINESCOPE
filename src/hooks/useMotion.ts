import { useEffect, useState, type RefObject } from "react";

const MOTION_KEY = "cinescope:motion";

/** Inline script for <head>: sets data-motion before first paint to avoid a flash. */
export const motionBootScript = `try{var m=localStorage.getItem("${MOTION_KEY}");document.documentElement.dataset.motion=m||(matchMedia("(prefers-reduced-motion: reduce)").matches?"off":"on")}catch(e){}`;

function readMotion(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.motion !== "off";
}

/** Motion is on unless the visitor (or their system setting) turned it off. */
export function useMotion(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(readMotion());
    const sync = () => setOn(readMotion());
    window.addEventListener("cinescope:motion", sync);
    return () => window.removeEventListener("cinescope:motion", sync);
  }, []);
  const set = (value: boolean) => {
    document.documentElement.dataset.motion = value ? "on" : "off";
    try {
      localStorage.setItem(MOTION_KEY, value ? "on" : "off");
    } catch {
      // Storage unavailable: the choice lasts until reload
    }
    window.dispatchEvent(new Event("cinescope:motion"));
  };
  return [on, set];
}

/**
 * Writes how far the element has scrolled out of view (0 to 1) into a CSS
 * variable on it, so CSS can drive 3D transforms from scroll position.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, variable = "--scroll") {
  const [motion] = useMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!motion) {
      element.style.setProperty(variable, "0");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      element.style.setProperty(variable, progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, motion, variable]);
}

/** Pointer handlers that tilt an element toward the cursor in 3D. */
export function tiltHandlers(strength = 10) {
  return {
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      if (event.pointerType !== "mouse") return;
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--ry", `${(x * strength).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-y * strength).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    },
    onPointerLeave(event: React.PointerEvent<HTMLElement>) {
      const el = event.currentTarget;
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--rx", "0deg");
    },
  };
}
