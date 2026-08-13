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
      const root = document.documentElement;
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

      /* ---------- Hero entrance: NO-FLASH REVEAL ----------------------
         Used to open with a mask "curtain" sweeping the photograph into
         view. The mask's starting value could only be applied once React
         hydrated — tens to hundreds of ms after the browser's first paint
         of the plain, fully-open CSS state — so visitors saw the hero
         fully bright, then watched roughly half of it get masked back out
         and slowly re-open. Loads bright, then visibly darkens: exactly
         the bug this rewrite removes.

         The fix has two halves. First, index.html itself already paints
         every element below in its hidden starting position — see
         .pre-hero in globals.css, set by a synchronous script in the
         document head before first paint. Second, everything here tweens
         FROM those exact values, so GSAP's mount-time render matches what
         is already on screen and there is nothing left to jump. The photo
         itself only ever moves through opacity and a 1.5% scale — never
         a mask, never a brightness change of the frame as a whole.

         Budget: the whole first screen is assembled by ~1.55s.          */
      const heroTitle = document.querySelector<HTMLElement>(
        ".hero [data-pulse-title]",
      );
      const heroImg = document.querySelector<HTMLElement>(".hero .hero-layer");

      if (heroImg || heroTitle) {
        const tl = gsap.timeline({
          defaults: { ease: EASE },
          onComplete: () => root.classList.remove("pre-hero"),
        });
        teardown.push(() => root.classList.remove("pre-hero"));

        /* fromTo, not from: .pre-hero has already set these exact opacity/
           transform values via CSS, so a plain .from() would read them
           back as the CURRENT computed style and treat that as both ends
           of the tween — a silent no-op. The "to" side has to be spelled
           out explicitly. */
        if (heroImg) {
          tl.fromTo(
            heroImg,
            { opacity: 0.94, scale: 1.015 },
            { opacity: 1, scale: 1, duration: 0.85, ease: "power2.out" },
            0.05,
          );
        }

        /* .pre-hero hides the title with opacity, not a matching
           translateY(108%) — a percentage transform already sitting on an
           element GSAP has never touched gets parsed into a fixed pixel
           baseline and composed alongside the incoming yPercent tween
           instead of being replaced by it, which left the title
           permanently offset by its own "from" position: two stacked
           translations where GSAP thought it was writing one. Animating
           opacity here, in step with the mask slide, is what actually
           reveals it — yPercent starts from a clean slate now, but
           nothing else makes the title visible. */
        tl.fromTo(
          ".hero .pulse-mask .pulse-line",
          { yPercent: 108, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
          },
          0.35,
        )
          .fromTo(
            '[data-hero="statement"]',
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.65 },
            0.75,
          )
          .fromTo(
            '[data-hero="where"]',
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.55 },
            0.9,
          )
          .fromTo(
            '[data-hero="links"]',
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5 },
            1.0,
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
              duration: 1.3,
              ease: "power2.out",
              onUpdate: () =>
                heroTitle.style.setProperty("--pulse", String(open.v)),
            },
            0.5,
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
            { yPercent: 100, duration: 0.3, ease: "power2.inOut" },
            1.05,
          ).to(
            monthInner,
            { yPercent: 0, duration: 0.4, ease: "power3.out" },
            1.4,
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

      /* THE CAMERA PUSHES IN.
         The hero does not scroll away — the next chapter rises over it —
         so the hand-off reads as the camera moving deeper into the frame,
         not backing out of the scene. The photograph keeps living for the
         full pin, drifting a further 1.5svh over the scroll; the type
         leaves first, over a shorter span, so by the time the manifest
         card is fully over the hero, the words are already gone and only
         the photograph is still visibly moving underneath it. */
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 3,
          scale: 1.05,
          ease: "none",
          /* The entrance also tweens scale (1.015 → 1). Without this the
             scrub would capture 1.015 as its start value at creation time
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

      const heroInner = document.querySelector<HTMLElement>(".hero-inner");
      if (heroInner) {
        gsap.to(heroInner, {
          opacity: 0,
          y: -28,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: ".hero-stage",
            start: "top top",
            end: "+=65%",
            scrub: true,
          },
        });
      }

      /* The two lines drift apart at slightly different rates as the
         type leaves — barely enough to feel, never enough to risk the
         reveal mask clipping a letter (rightward only: the mask box has
         ample room there, unlike the flush-left edge). */
      const pulseLines = gsap.utils.toArray<HTMLElement>(
        ".hero .pulse-mask .pulse-line",
      );
      if (pulseLines.length) {
        gsap.to(pulseLines, {
          x: (i) => 6 + i * 8,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: ".hero-stage",
            start: "top top",
            end: "+=65%",
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
