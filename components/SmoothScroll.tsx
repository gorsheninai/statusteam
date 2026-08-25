"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerLenis, scrollToAnchor } from "@/lib/scroll";

/**
 * Inertial scroll.
 *
 * Two rules keep this from becoming the usual smooth-scroll tax:
 *
 *   1. Touch keeps the platform's own scrolling. Lenis smooths the wheel only
 *      (`syncTouch: false`) — hijacking a finger is what makes these sites
 *      feel broken on a phone, and iOS momentum is already better than
 *      anything we would write.
 *   2. One rAF loop for the whole page. Lenis is driven by GSAP's ticker
 *      rather than its own, so scroll smoothing and every ScrollTrigger read
 *      happen in the same frame instead of racing.
 *
 * With reduced motion this component never runs and the page scrolls
 * natively — which is the point.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* iOS/Android already provide high-quality inertial touch scrolling.
       Keeping Lenis' ticker and ScrollTrigger bridge alive there adds work to
       every frame even though syncTouch is disabled. */
    if (window.matchMedia("(pointer: coarse)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      /* A long, flat tail: the page keeps travelling after the wheel stops
         without the rubbery overshoot of a spring. */
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
    });

    registerLenis(lenis);
    document.documentElement.classList.add("lenis-on");

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    /* Lag smoothing pauses the ticker after a long frame, which strands the
       scroll mid-travel. */
    gsap.ticker.lagSmoothing(0);

    /* Anchors: Lenis does not intercept them, and native smooth scrolling
       would fight the loop. One delegated listener covers nav, menu, footer
       and every in-page link added later. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.("a");
      const href = link?.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;
      if (scrollToAnchor(href)) e.preventDefault();
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      registerLenis(null);
      document.documentElement.classList.remove("lenis-on");
    };
  }, []);

  return null;
}
