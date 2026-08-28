"use client";

import { useEffect } from "react";
import { jumpToElement, lockScroll, unlockScroll } from "@/lib/scroll";

const THRESHOLD = 64;
const DURATION = 900;

/**
 * Mobile-only hand-off for the first two scenes. It deliberately leaves the
 * document in normal flow before and after the move: the fixed positioning is
 * used only for the 900ms fashion-style transition, so the rest of the site
 * retains native vertical scroll and every existing section keeps its layout.
 */
export default function MobileScreenSwipe() {
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>(".hero-stage");
    const status = document.querySelector<HTMLElement>(".st-page-two");

    if (!hero || !status) return;

    let startY = 0;
    let startX = 0;
    let locked = false;
    let gestureTransitioned = false;
    let transitionPlayed = false;
    let timer = 0;
    let frame = 0;

    const enabled = () => query.matches && !reducedMotion.matches;
    const heroIsAtTop = () => window.scrollY <= 2;
    const statusIsAtTop = () => Math.abs(status.getBoundingClientRect().top) <= 2;

    const clearTransition = () => {
      root.classList.remove(
        "mobile-screen-swap",
        "mobile-screen-swap--arming",
        "mobile-screen-swap--from-hero",
        "mobile-screen-swap--from-status",
        "mobile-screen-swap--to-status",
        "mobile-screen-swap--to-hero",
      );
    };

    const finish = (direction: "forward" | "back") => {
      if (!locked) return;
      if (timer) window.clearTimeout(timer);
      timer = 0;
      hero.removeEventListener("transitionend", onTravelEnd);

      /* Return the planes to normal flow first: while they are fixed their
         box sits at the viewport top whatever the scroll position, so the
         landing would be measured as zero. Nothing repaints between the two
         statements, so the reader never sees the untranslated document. */
      clearTransition();
      if (direction === "forward") jumpToElement(status);
      else window.scrollTo({ top: 0, behavior: "auto" });

      unlockScroll();
      locked = false;
    };

    function onTravelEnd(event: TransitionEvent) {
      if (event.target !== hero || event.propertyName !== "transform") return;
      finish(
        root.classList.contains("mobile-screen-swap--to-status")
          ? "forward"
          : "back",
      );
    }

    const transition = (direction: "forward" | "back") => {
      if (locked || transitionPlayed || !enabled()) return;

      locked = true;
      transitionPlayed = true;
      lockScroll();

      /* Arm the two planes in their start positions with transitions
         suppressed. Without `--arming` the start state is itself animated —
         the class change that positions screen two at translateY(100%) also
         installs the 900ms transition, so the browser transitions *into* the
         start state and `--to-status` merely reverses it after three pixels.
         Screen two then never travels: it is simply there, and the whole
         hand-off reads as a hard cut. */
      root.classList.add(
        "mobile-screen-swap",
        "mobile-screen-swap--arming",
        direction === "forward"
          ? "mobile-screen-swap--from-hero"
          : "mobile-screen-swap--from-status",
      );
      void status.offsetHeight;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        /* Two separate style changes with a reflow between them: the start
           state becomes the before-change style, and only then does the
           travel get a transition to run on. */
        root.classList.remove("mobile-screen-swap--arming");
        void status.offsetHeight;
        root.classList.add(
          direction === "forward"
            ? "mobile-screen-swap--to-status"
            : "mobile-screen-swap--to-hero",
        );

        hero.addEventListener("transitionend", onTravelEnd);
        /* The travel starts a frame after the gesture, so the clock has to
           start here rather than at the touch. `transitionend` normally lands
           first; this is the net for a backgrounded tab or a dropped event. */
        timer = window.setTimeout(() => finish(direction), DURATION + 120);
      });
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!enabled() || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      gestureTransitioned = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!enabled()) return;
      if (locked) {
        event.preventDefault();
        return;
      }
      if (transitionPlayed) return;

      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = startY - touch.clientY;
      const deltaX = startX - touch.clientX;

      /* A carousel or an intentional horizontal drag remains untouched. */
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;

      const forward = deltaY > 0 && heroIsAtTop();
      const back = deltaY < 0 && statusIsAtTop();
      if (!forward && !back) return;

      /* Do this from the first vertical pixel: native scrolling must never
         leak through before the threshold is reached. */
      event.preventDefault();

      if (!gestureTransitioned && Math.abs(deltaY) >= THRESHOLD) {
        gestureTransitioned = true;
        transition(forward ? "forward" : "back");
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      if (timer) window.clearTimeout(timer);
      if (frame) window.cancelAnimationFrame(frame);
      hero.removeEventListener("transitionend", onTravelEnd);
      clearTransition();
      if (locked) unlockScroll();
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
