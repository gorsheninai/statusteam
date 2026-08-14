"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Choreography for the hand-off between the opening campaign frame and the
 * first editorial chapter. Kept separate from the global motion pass so the
 * hero rebuild can evolve without making Motion.tsx carry section-specific
 * layout assumptions.
 */
export default function IntroMotion() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const manifest = document.querySelector<HTMLElement>(".manifest");
      const figure = document.querySelector<HTMLElement>(".manifest-figure img");
      const scale = document.querySelector<HTMLElement>(".scale");

      if (manifest) {
        gsap.fromTo(
          manifest,
          {
            y: 84,
            scale: 0.988,
            transformOrigin: "center top",
          },
          {
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero-stage",
              start: "bottom 92%",
              end: "bottom 32%",
              scrub: 0.75,
            },
          },
        );
      }

      if (figure) {
        gsap.fromTo(
          figure,
          { yPercent: -2.5, scale: 1.055 },
          {
            yPercent: 3.5,
            scale: 1.015,
            ease: "none",
            scrollTrigger: {
              trigger: ".manifest",
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (scale) {
        gsap.fromTo(
          scale,
          { y: 64 },
          {
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: scale,
              start: "top 96%",
              end: "top 68%",
              scrub: 0.8,
            },
          },
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return null;
}
