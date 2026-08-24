"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Mobile-only gesture gate for the pinned РИТМ → ДВИЖЕНИЕ → СИЛА → СВОБОДА
 * chapter. Motion.tsx still owns the visuals and pinning; this component only
 * changes how a finger advances through that already-existing timeline.
 *
 * One vertical touch gesture advances exactly one beat. Native touch scrolling
 * is left untouched everywhere else on the page.
 */
export default function TenetStepLock() {
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 899px) and (pointer: coarse)");
    if (!mobile.matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tenets = document.querySelector<HTMLElement>("[data-tenets]");
    if (!tenets) return;

    const beats = Array.from(tenets.querySelectorAll<HTMLElement>(".tenet"));
    if (beats.length < 2) return;

    /* These stops match the stable moments in Motion.tsx's current timeline:
       transition 2 finishes at ~39%, transition 3 at ~63%, transition 4 at
       ~86%, with the remaining tail intentionally holding the last image. */
    const fourBeatStops = [0, 0.39, 0.63, 0.86];
    const stops =
      beats.length === fourBeatStops.length
        ? fourBeatStops
        : beats.map((_, i) => i / Math.max(1, beats.length - 1));

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let captured = false;
    let locked = false;
    let scrollTween: gsap.core.Tween | null = null;

    const chapterTrigger = () =>
      ScrollTrigger.getAll().find(
        (trigger) => trigger.trigger === tenets && Boolean(trigger.vars.pin),
      );

    const withinChapter = () => {
      const trigger = chapterTrigger();
      if (!trigger) return false;
      const y = window.scrollY;
      return y >= trigger.start - 2 && y <= trigger.end + 2;
    };

    const nearestStop = (progress: number) => {
      let best = 0;
      let distance = Infinity;
      stops.forEach((stop, index) => {
        const nextDistance = Math.abs(stop - progress);
        if (nextDistance < distance) {
          distance = nextDistance;
          best = index;
        }
      });
      return best;
    };

    const animateScroll = (targetY: number, onComplete?: () => void) => {
      scrollTween?.kill();
      const state = { y: window.scrollY };
      locked = true;
      scrollTween = gsap.to(state, {
        y: targetY,
        duration: 0.52,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          window.scrollTo(0, state.y);
          ScrollTrigger.update();
        },
        onComplete: () => {
          window.scrollTo(0, targetY);
          ScrollTrigger.update();
          locked = false;
          onComplete?.();
        },
        onInterrupt: () => {
          locked = false;
        },
      });
    };

    const advance = (direction: 1 | -1) => {
      const trigger = chapterTrigger();
      if (!trigger || locked) return;

      const current = nearestStop(trigger.progress);
      const next = current + direction;

      /* At either edge the next gesture releases the pinned chapter instead
         of feeling like a dead swipe. */
      if (next < 0) {
        animateScroll(trigger.start - 3);
        return;
      }
      if (next >= stops.length) {
        animateScroll(trigger.end + 3);
        return;
      }

      const span = trigger.end - trigger.start;
      animateScroll(trigger.start + span * stops[next]);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = lastX = touch.clientX;
      startY = lastY = touch.clientY;
      captured = withinChapter();
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      lastX = touch.clientX;
      lastY = touch.clientY;

      const dx = lastX - startX;
      const dy = lastY - startY;
      const isVertical = Math.abs(dy) > Math.abs(dx) * 1.15;

      /* A gesture may begin immediately above/below the pin and enter it with
         momentum. Capture it as soon as the chapter becomes active so that the
         same finger movement cannot consume several beats. */
      if (!captured && isVertical && withinChapter()) captured = true;

      if (captured && isVertical) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!captured) return;
      captured = false;

      const dx = lastX - startX;
      const dy = lastY - startY;
      if (Math.abs(dy) <= Math.abs(dx) * 1.15) return;
      if (Math.abs(dy) < 34) return;

      /* Finger up = continue down the page; finger down = go back one beat. */
      advance(dy < 0 ? 1 : -1);
    };

    const onTouchCancel = () => {
      captured = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      scrollTween?.kill();
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  return null;
}
