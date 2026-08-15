"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitLines } from "@/lib/split-lines";

/**
 * The page's motion pass.
 *
 * Nothing here is decorative: reveals carry hierarchy, the pinned chapter
 * carries sequence, the blackout carries the change of subject, and the
 * title's tracking carries the show's name. All initial states are set from
 * JS so the page stays fully readable with JS disabled or still loading —
 * and `prefers-reduced-motion` returns before a single tween is built.
 *
 * Layout that only makes sense while GSAP is driving (the pinned chapter, the
 * shared background field) is switched on from here with a class, so the
 * no-JS page is a plain, readable stack.
 */
export default function Motion() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;
    root.classList.add("js-motion");

    const ctx = gsap.context(() => {
      const EASE = "power3.out";
      const teardown: Array<() => void> = [];
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;

      /* The preloader owns the first ~1.9s. When it has been skipped (any
         visit after the first in this session) the hero starts immediately. */
      const held = !root.classList.contains("no-preload");
      const OPEN = held ? 1.72 : 0.12;

      /* ============================================================
         HERO — live cut, then a slow breath
         ============================================================ */

      const curtain = document.querySelector<HTMLElement>("[data-curtain]");
      const heroTitle = document.querySelector<HTMLElement>(
        ".hero [data-pulse-title]",
      );

      if (curtain) {
        const tl = gsap.timeline({ defaults: { ease: EASE }, delay: OPEN });

        /* Two shutters part from the centre line. inset() interpolates
           cleanly and stays on the compositor. */
        gsap.set(curtain, { clipPath: "inset(0% 50% 0% 50%)" });
        tl.to(
          curtain,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.2,
            /* inOut, not out: an out-ease front-loads so hard the frame is
               open before the draw reads. This one pulls like fabric. */
            ease: "power3.inOut",
          },
          0,
        );

        tl.from(
          ".hero .pulse-mask .pulse-line",
          { yPercent: 108, duration: 1.05, stagger: 0.15 },
          0.42,
        )
          .from(
            '[data-hero="statement"]',
            { opacity: 0, y: 18, duration: 0.7 },
            0.95,
          )
          .from('[data-hero="where"]', { opacity: 0, y: 16, duration: 0.6 }, 1.18)
          .from('[data-hero="cta"]', { opacity: 0, y: 16, duration: 0.6 }, 1.42);

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
            0.6,
          );
        }
      }

      /* Ken Burns. Slow enough that it is felt on the second glance, not the
         first — and it composes with the pointer offset because they are
         different properties on the same element. */
      gsap.to(".hero-layer[data-depth='bg']", {
        scale: 1.05,
        duration: 10,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      /* A single heartbeat on the title every six seconds. 1.5% — under the
         threshold of "animated", over the threshold of "alive". */
      if (heroTitle) {
        gsap.timeline({ repeat: -1, repeatDelay: 5.4, delay: OPEN + 3 })
          .to(heroTitle, {
            scale: 1.015,
            duration: 0.3,
            ease: "sine.inOut",
            transformOrigin: "left center",
          })
          .to(heroTitle, { scale: 1, duration: 0.3, ease: "sine.inOut" });
      }

      /* Pointer parallax, written straight to the layers with quickTo: no
         React state, no re-render, one rAF-driven tween per axis. */
      if (fine) {
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

      /* The photograph leaves at 60% of the page's speed. The layer is
         oversized by --bleed, so the travel never exposes an edge. */
      gsap.to(".hero [data-depth]", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-stage",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* The living edge on the black/image border. */
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

      /* ============================================================
         SIGNATURE — the breathing lock-up (hero → pulse → tickets)
         ============================================================ */

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

      /* ============================================================
         BACKGROUND FIELD — one ground for the whole page
         Sections go transparent under .js-motion and this fixed field
         interpolates between their colours as each boundary passes.
         ============================================================ */

      const field = document.querySelector<HTMLElement>("[data-bg-field]");
      const grounds = gsap.utils.toArray<HTMLElement>("[data-bg]");
      if (field && grounds.length) {
        const colourOf = (el: HTMLElement) =>
          getComputedStyle(el).getPropertyValue(
            `--${el.dataset.bg || "ink"}`,
          ).trim() || "#100d0c";

        /* The grounds as a table of scroll positions, measured once per
           refresh — after the pins have claimed their spacer height.
           Answering "which ground am I in?" from scrollY alone is what makes
           this survive a flung wheel, an anchor jump and a deep link alike;
           anything driven by *crossing* a boundary can be skipped over. */
        let bands: { top: number; colour: string }[] = [];
        let painted = "";

        const measure = () => {
          bands = grounds.map((sec) => ({
            top: sec.getBoundingClientRect().top + window.scrollY,
            colour: colourOf(sec),
          }));
        };

        const apply = (instant = false) => {
          const mid = window.scrollY + window.innerHeight * 0.5;
          let colour = bands[0]?.colour;
          for (const band of bands) if (band.top <= mid) colour = band.colour;
          if (!colour || colour === painted) return;
          painted = colour;
          if (instant) gsap.set(field, { backgroundColor: colour });
          else
            gsap.to(field, {
              backgroundColor: colour,
              duration: 0.7,
              ease: "power2.out",
              overwrite: "auto",
            });
        };

        measure();
        apply(true);

        const onScroll = () => apply();
        window.addEventListener("scroll", onScroll, { passive: true });
        teardown.push(() => window.removeEventListener("scroll", onScroll));

        ScrollTrigger.addEventListener("refresh", () => {
          measure();
          apply(true);
        });
      }

      /* ============================================================
         2 → 3 — the page goes dark before the next chapter is named
         ============================================================ */

      const blackout = document.querySelector<HTMLElement>("[data-blackout]");
      const pulseScene = document.querySelector<HTMLElement>("#pulse");
      if (blackout && pulseScene) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: pulseScene,
              start: "top bottom",
              end: "top 12%",
              scrub: true,
            },
          })
          .to(blackout, { opacity: 1, ease: "power2.in" })
          .to(blackout, { opacity: 0, ease: "power2.out" });
      }

      /* ============================================================
         PINNED CHAPTER — РИТМ → ДВИЖЕНИЕ → СИЛА → СВОБОДА
         ============================================================ */

      const tenets = document.querySelector<HTMLElement>("[data-tenets]");
      const beats = tenets
        ? gsap.utils.toArray<HTMLElement>(".tenet", tenets)
        : [];

      if (tenets && beats.length > 1) {
        /* The stacked layout only exists while this runs. Without it the four
           beats are an ordinary vertical sequence, which is what a reader
           with no JS gets. */
        tenets.classList.add("is-pinned");

        const dots = gsap.utils.toArray<HTMLElement>(".tenet-dot", tenets);
        const shot = (i: number) =>
          beats[i].querySelector<HTMLElement>(".tenet-shot")!;
        const word = (i: number) =>
          beats[i].querySelector<HTMLElement>(".tenet-in")!;

        beats.forEach((_, i) => {
          if (i === 0) return;
          gsap.set(shot(i), { autoAlpha: 0 });
          gsap.set(word(i), { yPercent: 110 });
          if (dots[i]) gsap.set(dots[i], { opacity: 0.3 });
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: tenets,
            start: "top top",
            end: () => `+=${window.innerHeight * beats.length}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            /* Pins add several screens of spacer. Everything below them
               measures against that, so they have to refresh first — without
               this the ground changes colour a chapter early. */
            refreshPriority: 1,
          },
        });

        for (let i = 1; i < beats.length; i++) {
          tl.to(word(i - 1), { yPercent: -110, duration: 0.5, ease: "power2.in" }, i)
            .to(word(i), { yPercent: 0, duration: 0.55, ease: EASE }, i + 0.08)
            .to(shot(i - 1), { autoAlpha: 0, duration: 0.5, ease: "none" }, i)
            .fromTo(
              shot(i),
              { autoAlpha: 0, scale: 1.05 },
              { autoAlpha: 1, scale: 1, duration: 0.62, ease: "power2.out" },
              i,
            );

          if (dots[i]) {
            tl.to(dots[i - 1], { opacity: 0.3, duration: 0.3 }, i)
              .to(dots[i], { opacity: 1, duration: 0.3 }, i);
          }
        }
        /* Hold the last beat for a beat before the pin releases. */
        tl.to({}, { duration: 0.6 });
      }

      /* ============================================================
         AFTERMOVIE — grows from a plate to the full width
         ============================================================ */

      const zoom = document.querySelector<HTMLElement>("[data-reel-zoom]");
      if (zoom && wide) {
        gsap.fromTo(
          zoom.querySelector(".reel"),
          { scale: 0.62 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: zoom,
              start: "top top",
              end: "+=70%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              refreshPriority: 1,
            },
          },
        );
      }

      /* ============================================================
         COUNTERS
         ============================================================ */

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count ?? 0);
        const suffix = el.dataset.suffix ?? "";
        const n = { v: 0 };
        gsap.to(n, {
          v: to,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(n.v) + suffix;
          },
          onComplete: () => {
            el.textContent = to + suffix;
          },
        });
      });

      /* ============================================================
         REVEALS
         ============================================================ */

      /* Headlines rise line by line from behind their own edge. The split
         measures rendered line boxes, so it has to wait for the real webfont
         metrics or it breaks the lines in the wrong places. */
      const splitReveals = () => {
        gsap.utils
          .toArray<HTMLElement>('[data-reveal="lines"]')
          .forEach((el) => {
            const split = splitLines(el);

            if (!split) {
              /* Plain fallback — the heading still arrives, just as a block. */
              gsap.from(el, {
                yPercent: 24,
                opacity: 0,
                duration: 1,
                ease: EASE,
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              });
              return;
            }

            gsap.from(split.lines, {
              yPercent: 112,
              duration: 0.95,
              stagger: 0.08,
              ease: EASE,
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
              /* Give the text back to the browser once it has arrived: a
                 split heading does not re-wrap on rotate. */
              onComplete: () => split.revert(),
            });
          });
        ScrollTrigger.refresh();
      };

      if (document.fonts?.status === "loaded") splitReveals();
      else document.fonts?.ready.then(splitReveals).catch(splitReveals);

      /* Masked media: the frame wipes open, the photograph settles back. */
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

      /* Everything else: a short, uniform lift, staggered by row where the
         markup gives us siblings. */
      gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
        gsap.from(el, {
          y: 26,
          opacity: 0,
          duration: 0.8,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* The posters arrive as a hand of cards. */
      gsap.utils.toArray<HTMLElement>("[data-poster]").forEach((el, i) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          rotate: [-3, 0, 3][i % 3],
          duration: 0.9,
          delay: i * 0.09,
          ease: EASE,
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top 88%", once: true },
        });
      });

      /* ============================================================
         MAGNETIC BUTTONS
         ============================================================ */

      if (fine && wide) {
        const magnets = gsap.utils
          .toArray<HTMLElement>("[data-magnetic]")
          .map((el) => ({
            el,
            x: gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" }),
          }));

        if (magnets.length) {
          const RADIUS = 80;
          const PULL = 8;
          const onMove = (e: PointerEvent) => {
            magnets.forEach((m) => {
              const b = m.el.getBoundingClientRect();
              if (!b.width) return;
              const cx = b.left + b.width / 2;
              const cy = b.top + b.height / 2;
              /* Distance to the button's edge, not its centre — otherwise a
                 wide button pulls from inside itself. */
              const dx = Math.max(Math.abs(e.clientX - cx) - b.width / 2, 0);
              const dy = Math.max(Math.abs(e.clientY - cy) - b.height / 2, 0);
              const dist = Math.hypot(dx, dy);
              if (dist > RADIUS) {
                m.x(0);
                m.y(0);
                return;
              }
              const force = 1 - dist / RADIUS;
              m.x(((e.clientX - cx) / (b.width / 2 + RADIUS)) * PULL * force * 2);
              m.y(((e.clientY - cy) / (b.height / 2 + RADIUS)) * PULL * force * 2);
            });
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          teardown.push(() =>
            window.removeEventListener("pointermove", onMove),
          );
        }
      }

      /* Late-loading media changes page height, and every pin above depends
         on that height being right. */
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      let pending = Array.from(document.images).filter((i) => !i.complete);
      pending.forEach((i) =>
        i.addEventListener(
          "load",
          () => {
            pending = pending.filter((p) => p !== i);
            if (!pending.length) ScrollTrigger.refresh();
          },
          { once: true },
        ),
      );
      teardown.push(() => window.removeEventListener("load", onLoad));

      return () => teardown.forEach((fn) => fn());
    });

    return () => {
      ctx.revert();
      root.classList.remove("js-motion");
    };
  }, []);

  return null;
}
