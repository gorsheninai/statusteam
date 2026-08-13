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

      /* ---------- PULSE BUS -----------------------------------------
         The show is called Пульс Континента, so the site has one: a
         single document-level number, 0 → 1, derived from scroll speed
         and smoothed so it lags the reader — it rises slower than you
         scroll and takes longer to settle than you do.

         Everything subscribes through CSS. The two hairline tokens and
         the sand accent are defined in terms of --pulse-live, so every
         rule already using them breathes without being touched.

         Deliberately colour and opacity only. Breathing the *tracking*
         of every heading would read beautifully and cost a full layout
         pass per frame, so that stays where it already is: the three
         lock-ups, which are `white-space: nowrap` and cheap to reflow. */
      {
        const root = document.documentElement;
        let last = window.scrollY;
        let stamp = performance.now();
        let value = 0;
        let painted = -1;
        let frame = 0;

        const tick = (now: number) => {
          /* Measured per millisecond, not per frame, so the pulse reads the
             same on a 60Hz laptop and a 120Hz phone. */
          const dt = Math.max(now - stamp, 1);
          stamp = now;
          const y = window.scrollY;
          const speed = Math.min(Math.abs(y - last) / dt / 1.4, 1);
          last = y;

          /* A peak follower, not a lerp: it rises readily and falls slowly.
             The other way round — which is what a plain lerp gives — the
             pulse never catches a flick of the wheel and reads as lag. */
          value = speed > value ? value + (speed - value) * 0.3 : value * 0.955;

          /* Repaint only on a visible change. Idle costs one comparison
             per frame and no style recalculation at all. */
          const next = Math.round(value * 100) / 100;
          if (next !== painted) {
            painted = next;
            root.style.setProperty("--pulse-live", String(next));
          }
          frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        teardown.push(() => {
          cancelAnimationFrame(frame);
          root.style.removeProperty("--pulse-live");
        });
      }

      /* ---------- Hero entrance: LIVE CUT ----------------------------
         Two finished frames, two different reveals. Everything below sets
         its own start state here, never in CSS, so a hero with no JS is a
         hero that is simply already open.

         Budget: the whole first screen is assembled by ~2.3s.          */
      const curtain = document.querySelector<HTMLElement>("[data-curtain]");
      const heroTitle = document.querySelector<HTMLElement>(
        ".hero [data-pulse-title]",
      );
      const heroImg = document.querySelector<HTMLElement>(".hero .hero-layer");
      const wide = window.matchMedia("(min-width: 900px)").matches;

      if (curtain) {
        const tl = gsap.timeline({ defaults: { ease: EASE } });

        if (wide) {
          /* Landscape: the picture is already full-bleed and its left half
             is open dark space, so there is nothing to reveal there. The
             draw starts where the models begin and the scene resolves out
             of the darkness to the right, behind a soft mask edge.

             power2, not power3: with the left half empty, a harder inOut
             spends most of a second revealing black before anything reads. */
          tl.fromTo(
            curtain,
            { "--curtain": 0.5 },
            { "--curtain": 1, duration: 1.5, ease: "power2.inOut" },
            0,
          );
        } else {
          /* Portrait: a vertical slit on a 9:16 frame reads as a glitch,
             not as a curtain. Top-down instead, with the faces arriving
             early — they are what the screen is for. */
          gsap.set(curtain, { clipPath: "inset(0% 0% 42% 0%)" });
          tl.to(
            curtain,
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.35,
              ease: "power3.inOut",
            },
            0,
          ).from(
            curtain,
            { opacity: 0, duration: 0.8, ease: "power2.out" },
            0,
          );
        }

        /* A living photograph, not a zoom: the frame settles by ~3%. */
        if (heroImg) {
          tl.from(
            heroImg,
            { scale: 1.035, duration: 2.1, ease: "power2.out" },
            0,
          );
        }

        tl.from(
          ".hero .pulse-mask .pulse-line",
          { yPercent: 108, duration: 1.05, stagger: 0.15 },
          0.4,
        )
          .from(
            '[data-hero="statement"]',
            { opacity: 0, y: 18, duration: 0.7 },
            1.05,
          )
          .from(
            '[data-hero="where"]',
            { opacity: 0, y: 16, duration: 0.6 },
            1.32,
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

      /* ---------- Hero motion ---------------------------------------
         One photograph, not a stack of fake layers: the models are not
         cut out and nothing pretends to be 3D. The image drifts a few
         pixels against the pointer — a frame that is alive, not a card
         that tilts. Written straight to the node with quickTo, so no
         React state and no re-render per event.                        */
      if (heroImg && window.matchMedia("(pointer: fine)").matches) {
        const TRAVEL = 3;
        const px = gsap.quickTo(heroImg, "x", {
          duration: 0.9,
          ease: "power3.out",
        });
        const py = gsap.quickTo(heroImg, "y", {
          duration: 0.9,
          ease: "power3.out",
        });
        const onMove = (e: PointerEvent) => {
          px(-(e.clientX / window.innerWidth - 0.5) * 2 * TRAVEL);
          py(-(e.clientY / window.innerHeight - 0.5) * 2 * TRAVEL);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        teardown.push(() => window.removeEventListener("pointermove", onMove));
      }

      /* THE CAMERA STEPS BACK.
         The hero does not scroll away — the next chapter rises over it. So
         instead of sliding out, the frame recedes: a little smaller, a
         little darker, as though the camera pulled back to let the next
         scene through. yPercent, scale and the pointer's x/y are separate
         transform components in GSAP, so none of them fight. */
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 5,
          scale: 0.96,
          ease: "none",
          /* The entrance also tweens scale (1.035 → 1). Without this the
             scrub would capture 1.035 as its start value at creation time
             and the two would fight over the same property; deferred, it
             reads the settled value on first render instead. */
          immediateRender: false,
          scrollTrigger: {
            trigger: ".hero-stage",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
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

      /* ---------- 02 МАСШТАБ: the numerals settle --------------------
         The same idea as the month in the hero, so the roller reads as a
         device of the site rather than a one-off trick. Each digit spins
         through a short strip of numerals and lands on its real value;
         letters and signs (K, M, +) never move.

         The strip is built here, not in the markup, so the DOM React
         renders — and anything a crawler or a JS-less browser sees — is
         the plain number. Restored on teardown. */
      const SPIN = 6; /* digits that pass before the real one lands */
      gsap.utils.toArray<HTMLElement>("[data-roll]").forEach((el) => {
        const text = el.textContent ?? "";
        if (!/\d/.test(text)) return;

        const original = el.innerHTML;
        teardown.push(() => {
          el.innerHTML = original;
        });

        el.textContent = "";
        const strips: HTMLElement[] = [];

        for (const ch of text) {
          if (!/\d/.test(ch)) {
            el.append(ch);
            continue;
          }
          const target = Number(ch);
          const window_ = document.createElement("span");
          window_.className = "roll";
          const strip = document.createElement("span");
          strip.className = "roll-strip";

          /* Built the same way as the month in the hero: the real digit is
             the only cell in flow, so the resting state — transform zero —
             already shows the right number. The digits that spin past are
             stacked above it, outside the clip, and are only seen while the
             strip is pushed down. */
          const real = document.createElement("span");
          real.textContent = ch;
          strip.append(real);
          for (let i = 1; i <= SPIN; i++) {
            const ghost = document.createElement("span");
            ghost.className = "roll-ghost";
            ghost.style.bottom = `${i * 100}%`;
            ghost.setAttribute("aria-hidden", "true");
            ghost.textContent = String((target - i + 10) % 10);
            strip.append(ghost);
          }

          window_.append(strip);
          el.append(window_);
          strips.push(strip);
        }

        if (!strips.length) return;
        gsap.from(strips, {
          yPercent: 100 * SPIN,
          duration: 1.15,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* QUIET chapters — 01 Манифест, 04 Материалы, 08 Партнёрам.
         These three are deliberately the least active screens on the site:
         no mask, no travel, only a slow settle of opacity. Without them
         nothing else reads as a peak, because a page where every chapter
         works equally hard has no dynamics at all. Photographs in these
         chapters carry no reveal whatsoever — they are simply there. */
      gsap.utils.toArray<HTMLElement>('[data-reveal="quiet"]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          duration: 1.1,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
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
