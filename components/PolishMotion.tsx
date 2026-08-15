"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Final motion polish. This intentionally does not own layout or content.
 * card-stack.css still owns the Hero -> STATUS geometry; this pass only adds
 * depth while those two existing screens overlap and removes expensive pinning
 * from the phone presentation.
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

    /* On a phone the pinned four-beat chapter costs several synthetic
       viewports and fights the browser chrome. Motion.tsx builds it for every
       width, so after all React effects have mounted we revert only that one
       ScrollTrigger and give the exact same four beats back to normal flow.
       This changes no markup or copy; final-polish.css gives that flow its
       mobile editorial treatment. */
    mm.add("(max-width: 767px)", () => {
      let cancelled = false;
      let raf1 = 0;
      let raf2 = 0;

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return;
          const tenets = document.querySelector<HTMLElement>("[data-tenets]");
          if (!tenets) return;

          ScrollTrigger.getAll().forEach((st) => {
            if (st.trigger === tenets) st.kill(true);
          });

          tenets.classList.remove("is-pinned");
          gsap.set(tenets, { clearProps: "height,transform,position,top,left,width" });
          gsap.set(tenets.querySelectorAll(".tenet"), {
            clearProps: "position,inset,transform,opacity,visibility",
          });
          gsap.set(tenets.querySelectorAll(".tenet-shot,.tenet-in,.tenet-dot"), {
            clearProps: "transform,opacity,visibility",
          });
          ScrollTrigger.refresh();
        });
      });

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
