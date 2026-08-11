"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The page's motion pass.
 *
 * Nothing here is decorative: reveals carry hierarchy, the sticky chapter
 * carries sequence, and the title's tracking carries the show's name.
 * All initial states are set from JS so the page stays fully readable
 * with JS disabled or still loading.
 */
export default function Motion() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const EASE = "power3.out";

      /* ---------- Hero entrance -------------------------------------
         One orchestrated moment on load, then the page stays calm.    */
      const heroBits = gsap.utils.toArray<HTMLElement>("[data-hero]");
      if (heroBits.length) {
        const tl = gsap.timeline({ defaults: { ease: EASE } });

        tl.from(".pulse-mask .pulse-line", {
          yPercent: 108,
          duration: 1.15,
          stagger: 0.09,
        })
          .from(
            '[data-hero="1"]',
            { opacity: 0, y: 14, duration: 0.7 },
            0.15,
          )
          .from(
            ['[data-hero="4"]', '[data-hero="5"]', '[data-hero="6"]'],
            { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 },
            0.55,
          );
      }

      /* Slow camera drift on the hero frame. */
      gsap.to(".hero-media img", {
        scale: 1.12,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* ---------- SIGNATURE: the breathing lock-up -------------------
         Tracking opens and closes once as each instance passes. The
         final instance settles compressed — the pulse resolves.       */
      gsap.utils.toArray<HTMLElement>("[data-pulse-title]").forEach((el) => {
        const isFinal = el.hasAttribute("data-pulse-final");
        const state = { v: isFinal ? 1 : 0 };
        const write = () => el.style.setProperty("--pulse", String(state.v));
        write();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.1,
          },
          onUpdate: write,
        });

        if (isFinal) {
          tl.to(state, { v: 0, ease: "power2.inOut" });
        } else {
          tl.to(state, { v: 1, ease: "sine.inOut" }).to(state, {
            v: 0,
            ease: "sine.inOut",
          });
        }
      });

      /* ---------- Reveals -------------------------------------------- */

      // Masked media: the frame wipes open, the photograph settles back.
      gsap.utils.toArray<HTMLElement>('[data-reveal="mask"]').forEach((el) => {
        const frame = el.querySelector(".media");
        const img = el.querySelector("img");
        if (!frame) return;

        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        });
        tl.from(frame, {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 1.15,
          ease: "power3.inOut",
        });
        if (img) tl.from(img, { scale: 1.22, duration: 1.4, ease: EASE }, 0);
      });

      // Headlines rise from behind their own edge.
      gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        gsap.from(el, {
          yPercent: 26,
          opacity: 0,
          duration: 1,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      // Everything else: a short, uniform lift.
      gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
        gsap.from(el, {
          y: 26,
          opacity: 0,
          duration: 0.8,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* Late-loading media changes page height. */
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      const imgs = Array.from(document.images);
      let pending = imgs.filter((i) => !i.complete).length;
      imgs
        .filter((i) => !i.complete)
        .forEach((i) =>
          i.addEventListener(
            "load",
            () => --pending === 0 && ScrollTrigger.refresh(),
            { once: true },
          ),
        );

      return () => window.removeEventListener("load", onLoad);
    });

    return () => ctx.revert();
  }, []);

  return null;
}
