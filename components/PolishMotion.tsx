"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Final motion polish. This intentionally does not own layout or content.
 * card-stack.css still owns the Hero -> STATUS geometry; this pass only adds
 * depth while those two existing screens overlap.
 */
export default function PolishMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1200px)", () => {
      const track = document.querySelector<HTMLElement>(".hero-stage");
      const hero = track?.querySelector<HTMLElement>(".hero");
      const heroInner = track?.querySelector<HTMLElement>(".hero-inner");
      const status = document.querySelector<HTMLElement>("#statusteam");
      if (!track || !hero || !status) return;

      const ctx = gsap.context(() => {
        gsap.set(hero, {
          transformOrigin: "50% 42%",
          willChange: "transform, filter",
        });
        gsap.set(status, { willChange: "border-radius, box-shadow" });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: track,
            start: "top top",
            // card-stack.css gives the track 200svh. At bottom bottom the
            // STATUS card is exactly flush with the top of the viewport.
            end: "bottom bottom",
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        });

        // The rear screen recedes by only a few percent. It reads as depth,
        // not as a new transition effect.
        tl.to(
          hero,
          {
            scale: 0.976,
            filter: "brightness(0.72) saturate(0.86)",
            duration: 1,
          },
          0,
        );

        if (heroInner) {
          tl.to(
            heroInner,
            { y: -12, opacity: 0.76, duration: 0.82 },
            0.08,
          );
        }

        // The foreground begins as a physical card and becomes an ordinary
        // full-screen page by the time it reaches top:0.
        tl.fromTo(
          status,
          {
            borderTopLeftRadius: 34,
            borderTopRightRadius: 34,
            boxShadow:
              "0 -1px 0 rgba(213,180,123,.18), 0 -32px 88px rgba(0,0,0,.52)",
          },
          {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            boxShadow:
              "0 -1px 0 rgba(213,180,123,.05), 0 -4px 18px rgba(0,0,0,.08)",
            duration: 0.36,
          },
          0.64,
        );
      }, track);

      return () => {
        ctx.revert();
        gsap.set(hero, { clearProps: "willChange" });
        gsap.set(status, { clearProps: "willChange" });
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
