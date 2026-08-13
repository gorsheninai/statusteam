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
      /* Listeners GSAP does not own, torn down with the context. */
      const teardown: Array<() => void> = [];

      /* ---------- Hero entrance: LIVE CUT ----------------------------
         The photograph opens from a narrow strip on the black/image
         border, and the type follows it out. Everything below sets its
         own start state here, never in CSS, so a hero with no JS is a
         hero that is simply already open.

         Budget: the whole first screen is assembled by ~2.1s.          */
      const curtain = document.querySelector<HTMLElement>("[data-curtain]");
      const heroTitle = document.querySelector<HTMLElement>(
        ".hero [data-pulse-title]",
      );

      if (curtain) {
        const tl = gsap.timeline({ defaults: { ease: EASE } });

        /* The visible sliver is a fixed 32px, so it reads the same on a
           phone as on a wide desktop — expressed as a percentage because
           that is what clip-path interpolates cleanly. */
        const width = curtain.getBoundingClientRect().width || 1;
        const sliver = gsap.utils.clamp(0, 96, (32 / width) * 100);

        gsap.set(curtain, { clipPath: `inset(0% ${100 - sliver}% 0% 0%)` });
        tl.to(
          curtain,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.6,
            /* inOut, not expo.out: an out-ease front-loads so hard that the
               frame is 80% open in the first 400ms and the draw is over
               before it reads. This one pulls like fabric. */
            ease: "power3.inOut",
          },
          0,
        );

        tl.from(
          ".hero .pulse-mask .pulse-line",
          { yPercent: 108, duration: 1.05, stagger: 0.15 },
          0.45,
        )
          .from(
            '[data-hero="statement"]',
            { opacity: 0, y: 18, duration: 0.7 },
            1.05,
          )
          .from(
            '[data-hero="where"]',
            { opacity: 0, y: 16, duration: 0.6 },
            1.3,
          )
          .from(
            '[data-hero="links"]',
            { opacity: 0, y: 16, duration: 0.6 },
            1.62,
          );

        /* The lock-up arrives a touch open and settles. This is the only
           "breath" on load — no scale, no beat, no blink. */
        if (heroTitle) {
          const open = { v: 0.5 };
          heroTitle.style.setProperty("--pulse", "0.5");
          tl.to(
            open,
            {
              v: 0,
              duration: 1.5,
              ease: "power2.out",
              onUpdate: () =>
                heroTitle.style.setProperty("--pulse", String(open.v)),
            },
            0.65,
          );
        }

        /* ROLLING MONTH — сентябрь → октябрь → ноябрь, once, on entrance.
           Not a countdown: no days, no timer, and it never repeats. */
        const monthInner = document.querySelector<HTMLElement>(
          "[data-month] .month-inner",
        );
        if (monthInner) {
          gsap.set(monthInner, { yPercent: 200 });
          tl.to(
            monthInner,
            { yPercent: 100, duration: 0.34, ease: "power2.inOut" },
            1.42,
          ).to(
            monthInner,
            { yPercent: 0, duration: 0.44, ease: "power3.out" },
            1.8,
          );
        }
      }

      /* ---------- Hero depth ----------------------------------------
         Pointer parallax, written straight to the layers with quickTo:
         no React state, no re-render, one rAF-driven tween per axis.
         Travel is per-layer and small — depth, not tilt.               */
      const fine = window.matchMedia("(pointer: fine)");
      if (fine.matches) {
        const TRAVEL: Record<string, number> = { bg: 3, model: 6.5, fg: 10 };
        const layers = gsap.utils
          .toArray<HTMLElement>(".hero [data-depth]")
          .map((el) => ({
            travel: TRAVEL[el.dataset.depth ?? "bg"] ?? 3,
            x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
          }));

        if (layers.length) {
          const onMove = (e: PointerEvent) => {
            const nx = (e.clientX / window.innerWidth - 0.5) * 2;
            const ny = (e.clientY / window.innerHeight - 0.5) * 2;
            layers.forEach((l) => {
              l.x(-nx * l.travel);
              l.y(-ny * l.travel);
            });
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          teardown.push(() =>
            window.removeEventListener("pointermove", onMove),
          );
        }
      }

      /* Very slow vertical drift as the hero leaves. yPercent composes with
         the pointer's px offset instead of fighting it. */
      gsap.to(".hero [data-depth]", {
        yPercent: 6,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-stage",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* The living edge: a band of light on the seam, drifting well below
         the threshold of notice. Opacity and transform only. */
      const seam = document.querySelector<HTMLElement>("[data-seam]");
      if (seam && getComputedStyle(seam).display !== "none") {
        gsap.to(seam, {
          opacity: 0.55,
          scaleX: 1.18,
          transformOrigin: "left center",
          duration: 5.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      /* ---------- SIGNATURE: the breathing lock-up -------------------
         Tracking opens and closes once as each instance passes. The
         final instance settles compressed — the pulse resolves.       */
      gsap.utils.toArray<HTMLElement>("[data-pulse-title]").forEach((el) => {
        const isFinal = el.hasAttribute("data-pulse-final");
        const isHero = Boolean(el.closest(".hero"));
        const state = { v: isFinal ? 1 : 0 };
        const write = () => el.style.setProperty("--pulse", String(state.v));
        /* The hero instance is written by the entrance timeline instead —
           overwriting it here would cancel the settle. */
        if (!isHero) write();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: isHero ? ".hero-stage" : el,
            /* The hero is already on screen at load, so its scrub starts at
               the top of the page and reads 0 at rest — the same value the
               entrance settles on. Anything else and the two fight. */
            start: isHero ? "top top" : "top bottom",
            end: "bottom top",
            scrub: 1.1,
          },
          onUpdate: write,
        });

        if (isFinal) {
          tl.to(state, { v: 0, ease: "power2.inOut" });
        } else if (isHero) {
          /* A third of the amplitude the later instances get: on the first
             screen the breath should be felt, not watched. */
          tl.to(state, { v: 0.35, ease: "sine.inOut" }).to(state, {
            v: 0,
            ease: "sine.inOut",
          });
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

      teardown.push(() => window.removeEventListener("load", onLoad));

      return () => teardown.forEach((fn) => fn());
    });

    return () => ctx.revert();
  }, []);

  return null;
}
