"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Choreography for the hand-off from the opening hero into the single-screen
 * fashion intro. The intro itself stays calm: only the whole burgundy field
 * rises into place while its image rail supplies the continuous motion.
 */
export default function IntroMotion() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const manifest = document.querySelector<HTMLElement>(".manifest");
      if (!manifest) return;

      gsap.fromTo(
        manifest,
        {
          y: 64,
          scale: 0.992,
          transformOrigin: "center top",
        },
        {
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-stage",
            start: "bottom 94%",
            end: "bottom 40%",
            scrub: 0.75,
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return null;
}
