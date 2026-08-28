"use client";

import { useEffect } from "react";

/**
 * The phone hand-off between screen 1 and screen 2.
 *
 * The whole effect is one animated document scroll, and that is deliberate:
 * the hero occupies exactly the first 100svh and STATUS starts exactly at
 * 100svh, so travelling the document from 0 to that offset *is* the hero
 * leaving at translateY(0 → -100%) while the second screen arrives at
 * translateY(100% → 0), locked together, with no transform of our own to
 * drift out of sync with the layout. Nothing fades, blurs or scales — the two
 * planes are rigid and move as one.
 *
 * What this component adds on top of the document is a gate: at the top of
 * the page the finger cannot scroll at all, it can only *commit*. Past ~60px
 * of travel the transition plays to completion and hands the page back to
 * the platform. The gate closes again from the other side: at the exact top
 * of screen 2 a downward swipe returns to the hero, while an upward one is
 * released to the browser mid-gesture and scrolls the site normally.
 *
 * Only on a phone. Requires a coarse pointer, which is also the condition
 * under which SmoothScroll leaves Lenis switched off — so the scroll this
 * animates is the platform's own, with no smoothing loop to fight. Reduced
 * motion never reaches any of it: there the page is one plain document.
 */

const TRIGGER_PX = 60;
const DURATION_MS = 900;
const AT_EDGE_PX = 2;

/** cubic-bezier(0.76, 0, 0.24, 1) — heavy at both ends, fast through the middle. */
const easing = (() => {
  const [x1, y1, x2, y2] = [0.76, 0, 0.24, 1];
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-5) break;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    return ((ay * t + by) * t + cy) * t;
  };
})();

export default function HeroGate() {
  useEffect(() => {
    const media = window.matchMedia(
      "(max-width: 899px) and (pointer: coarse) and (prefers-reduced-motion: no-preference)",
    );

    let teardown: (() => void) | null = null;

    const attach = () => {
      const stage = document.querySelector<HTMLElement>(".hero-stage");
      if (!stage) return;

      /* The document offset of screen 2's top edge, read live: svh, the URL
         bar and an orientation change all move it, and a stale copy would
         leave the transition a few pixels short of the seam. */
      const gateY = () =>
        stage.getBoundingClientRect().bottom + window.scrollY;

      let frame = 0;
      let busy = false;
      let armed: "intro" | "gate" | null = null;
      let startY = 0;

      const travel = (to: number, done: () => void) => {
        const from = window.scrollY;
        const distance = to - from;
        if (Math.abs(distance) < 1) {
          window.scrollTo(0, to);
          done();
          return;
        }

        const started = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - started) / DURATION_MS);
          window.scrollTo(0, from + distance * easing(progress));
          if (progress < 1) {
            frame = requestAnimationFrame(step);
          } else {
            frame = 0;
            done();
          }
        };
        frame = requestAnimationFrame(step);
      };

      const commit = (to: number) => {
        busy = true;
        armed = null;
        document.documentElement.classList.add("is-gated");
        travel(to, () => {
          busy = false;
          document.documentElement.classList.remove("is-gated");
        });
      };

      const onStart = (event: TouchEvent) => {
        if (busy || event.touches.length !== 1) {
          armed = null;
          return;
        }
        startY = event.touches[0].clientY;

        /* Which side of the seam the gesture begins on decides everything:
           a browser will not hand back a gesture it has already claimed as a
           scroll, so the choice cannot be deferred to the first move. */
        if (window.scrollY <= AT_EDGE_PX) armed = "intro";
        else if (Math.abs(window.scrollY - gateY()) <= AT_EDGE_PX) armed = "gate";
        else armed = null;
      };

      const onMove = (event: TouchEvent) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        if (!armed) return;

        /* Positive is a swipe up — the finger travelling toward the top of
           the screen, which pulls the page forward. */
        const delta = startY - event.touches[0].clientY;

        if (armed === "intro") {
          /* Screen 1 does not move under the finger. It either holds or it
             commits; there is no partial state to leave it in. */
          event.preventDefault();
          if (delta > TRIGGER_PX) commit(gateY());
          return;
        }

        if (delta < 0) {
          event.preventDefault();
          if (delta < -TRIGGER_PX) commit(0);
          return;
        }

        /* Upward at the seam is just the site continuing: release the
           gesture and let the platform scroll it. */
        armed = null;
      };

      const onEnd = () => {
        armed = null;
      };

      /* Non-passive: preventDefault is the whole mechanism. */
      const options: AddEventListenerOptions = { passive: false };
      window.addEventListener("touchstart", onStart, options);
      window.addEventListener("touchmove", onMove, options);
      window.addEventListener("touchend", onEnd);
      window.addEventListener("touchcancel", onEnd);

      teardown = () => {
        if (frame) cancelAnimationFrame(frame);
        document.documentElement.classList.remove("is-gated");
        window.removeEventListener("touchstart", onStart, options);
        window.removeEventListener("touchmove", onMove, options);
        window.removeEventListener("touchend", onEnd);
        window.removeEventListener("touchcancel", onEnd);
      };
    };

    const sync = () => {
      teardown?.();
      teardown = null;
      if (media.matches) attach();
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      teardown?.();
    };
  }, []);

  return null;
}
