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
      const teardown: Array<() => void> = [];
      const isRetired = (el: Element) =>
        Boolean(el.closest(".show, .materials, .world"));

      /* ---------- Hero entrance: LIVE CUT ---------------------------- */
      const curtain = document.querySelector<HTMLElement>("[data-curtain]");
      const heroTitle = document.querySelector<HTMLElement>(
        ".hero [data-pulse-title]",
      );

      if (curtain) {
        const tl = gsap.timeline({ defaults: { ease: EASE } });
        const width = curtain.getBoundingClientRect().width || 1;
        const sliver = gsap.utils.clamp(0, 96, (32 / width) * 100);

        gsap.set(curtain, { clipPath: `inset(0% ${100 - sliver}% 0% 0%)` });
        tl.to(
          curtain,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.6,
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

      /* ---------- Hero depth ---------------------------------------- */
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

      /* ---------- SIGNATURE: the breathing lock-up ------------------- */
      gsap.utils.toArray<HTMLElement>("[data-pulse-title]").forEach((el) => {
        if (isRetired(el)) return;

        const isFinal = el.hasAttribute("data-pulse-final");
        const isHero = Boolean(el.closest(".hero"));
        const state = { v: isFinal ? 1 : 0 };
        const write = () => el.style.setProperty("--pulse", String(state.v));
        if (!isHero) write();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: isHero ? ".hero-stage" : el,
            start: isHero ? "top top" : "top bottom",
            end: "bottom top",
            scrub: 1.1,
          },
          onUpdate: write,
        });

        if (isFinal) {
          tl.to(state, { v: 0, ease: "power2.inOut" });
        } else if (isHero) {
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
      gsap.utils.toArray<HTMLElement>('[data-reveal="mask"]').forEach((el) => {
        if (isRetired(el)) return;

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

      gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        if (isRetired(el)) return;

        gsap.from(el, {
          yPercent: 26,
          opacity: 0,
          duration: 1,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
        if (isRetired(el)) return;

        gsap.from(el, {
          y: 26,
          opacity: 0,
          duration: 0.8,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

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
