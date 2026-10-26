"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const INTERACTIVE = "a,button,input,textarea,select,summary,[role='button']";

/**
 * The pointer, redrawn.
 *
 * A sand dot that opens into a ring over anything clickable and names the
 * gesture where the gesture is not obvious — PLAY over the aftermovie, DRAG
 * over the guest carousel. Both states are pure transform and opacity, so the
 * element never repaints on move.
 *
 * It exists only where it can be an improvement: a fine pointer on a desktop
 * viewport, with motion allowed. Everywhere else the platform cursor is
 * better than anything drawn in a div, and this component renders nothing.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOn(ok);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!on || !el) return;

    document.documentElement.classList.add("has-cursor");

    /* Two speeds read as weight: the point tracks almost exactly, the ring
       trails it. quickTo is a lerp that GSAP already runs on its ticker. */
    const x = gsap.quickTo(el, "x", { duration: 0.16, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.16, ease: "power3.out" });

    const label = el.querySelector<HTMLElement>(".cursor-label");
    let shown = false;

    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to(el, { autoAlpha: 1, duration: 0.25 });
      }
      x(e.clientX);
      y(e.clientY);

      const target = e.target as HTMLElement | null;
      const named = target?.closest?.("[data-cursor]") as HTMLElement | null;
      const hot = named ?? (target?.closest?.(INTERACTIVE) as HTMLElement | null);

      const text = named?.dataset.cursor ?? "";
      el.classList.toggle("is-open", Boolean(hot));
      el.classList.toggle("is-labelled", Boolean(text));
      if (label && label.textContent !== text) label.textContent = text;
    };

    const onLeave = () => {
      shown = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.2 });
    };

    /* Buttons that move under the pointer (magnetic ones) can leave the ring
       stuck open; a press always resets it. */
    const onDown = () => el.classList.add("is-down");
    const onUp = () => el.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [on]);

  if (!on) return null;

  return (
    <div className="cursor" ref={ref} aria-hidden="true">
      <span className="cursor-dot" />
      <span className="cursor-ring" />
      <span className="cursor-label" />
    </div>
  );
}
