"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { jumpToElement, lockScroll, unlockScroll } from "@/lib/scroll";

const PALM = `
<svg viewBox="0 0 620 900" aria-hidden="true" focusable="false">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M38 916C82 727 153 534 306 311" stroke-width="16"/>
    <path d="M305 311C214 251 116 205 5 188" stroke-width="8"/>
    <path d="M309 309C229 210 164 133 81 73" stroke-width="8"/>
    <path d="M312 310C296 196 294 104 309 16" stroke-width="8"/>
    <path d="M316 314C367 208 425 129 512 64" stroke-width="8"/>
    <path d="M318 318C412 257 508 224 611 217" stroke-width="8"/>
  </g>
  <g fill="currentColor">
    <ellipse cx="245" cy="273" rx="73" ry="16" transform="rotate(24 245 273)"/>
    <ellipse cx="186" cy="244" rx="65" ry="15" transform="rotate(20 186 244)"/>
    <ellipse cx="126" cy="217" rx="58" ry="14" transform="rotate(14 126 217)"/>
    <ellipse cx="257" cy="240" rx="67" ry="15" transform="rotate(52 257 240)"/>
    <ellipse cx="216" cy="190" rx="61" ry="14" transform="rotate(48 216 190)"/>
    <ellipse cx="171" cy="142" rx="54" ry="13" transform="rotate(43 171 142)"/>
    <ellipse cx="306" cy="245" rx="65" ry="15" transform="rotate(83 306 245)"/>
    <ellipse cx="306" cy="181" rx="59" ry="14" transform="rotate(87 306 181)"/>
    <ellipse cx="309" cy="120" rx="52" ry="13" transform="rotate(90 309 120)"/>
    <ellipse cx="355" cy="252" rx="67" ry="15" transform="rotate(-51 355 252)"/>
    <ellipse cx="397" cy="201" rx="61" ry="14" transform="rotate(-47 397 201)"/>
    <ellipse cx="445" cy="154" rx="54" ry="13" transform="rotate(-42 445 154)"/>
    <ellipse cx="379" cy="282" rx="73" ry="16" transform="rotate(-24 379 282)"/>
    <ellipse cx="442" cy="254" rx="65" ry="15" transform="rotate(-19 442 254)"/>
    <ellipse cx="508" cy="232" rx="58" ry="14" transform="rotate(-13 508 232)"/>
  </g>
</svg>`;

const logoLayers = Array.from({ length: 6 }, (_, i) =>
  `<span class="status-transition-logo-depth" style="--depth:${i + 1}"><img src="/media/brand-status-team-640.webp" alt="" /></span>`,
).join("");

/**
 * One-shot Hero → STATUS hand-off.
 *
 * The previous version tied the reveal to the same scroll range that moved
 * page two into the viewport. That made it possible to expose a strip of the
 * Hero or, after over-correcting, to hide page two until too late.
 *
 * This version separates the two jobs completely:
 *  1) the first downward gesture is detected;
 *  2) an opaque fixed layer covers the viewport immediately;
 *  3) underneath that cover we jump STATUS to EXACTLY top:0;
 *  4) the logo/palm animation plays in time, not against scroll;
 *  5) the black curtain opens only onto a page that already fills 100% of the
 *     viewport;
 *  6) the trigger and overlay are destroyed after that first run, so scrolling
 *     back up and down later is completely normal and never replays it.
 */
export default function StatusRevealMount() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero-stage");
    const status = document.querySelector<HTMLElement>("#statusteam");
    if (!hero || !status || document.querySelector(".status-transition")) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm) return;

    /* Browser restoration / a deep link should never yank somebody back into
       the intro. The cinematic hand-off is exclusively for the first descent
       from the first screen. */
    if (window.scrollY > 12) return;

    const overlay = document.createElement("div");
    overlay.className = "status-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="status-transition-stage">
        <div class="status-transition-backdrop"></div>
        <div class="status-transition-ambient"></div>

        <div class="status-transition-mark">
          ${logoLayers}
          <img class="status-transition-logo-main" src="/media/brand-status-team-640.webp" alt="" />
          <span class="status-transition-sheen"></span>
        </div>

        <div class="status-transition-palm status-transition-palm-left status-transition-palm-back">${PALM}</div>
        <div class="status-transition-palm status-transition-palm-left status-transition-palm-front">${PALM}</div>
        <div class="status-transition-palm status-transition-palm-right status-transition-palm-back">${PALM}</div>
        <div class="status-transition-palm status-transition-palm-right status-transition-palm-front">${PALM}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    gsap.registerPlugin(ScrollTrigger);

    const mark = overlay.querySelector<HTMLElement>(".status-transition-mark");
    const sheen = overlay.querySelector<HTMLElement>(".status-transition-sheen");
    const backdrop = overlay.querySelector<HTMLElement>(".status-transition-backdrop");
    const ambient = overlay.querySelector<HTMLElement>(".status-transition-ambient");
    const left = gsap.utils.toArray<HTMLElement>(
      ".status-transition-palm-left",
      overlay,
    );
    const right = gsap.utils.toArray<HTMLElement>(
      ".status-transition-palm-right",
      overlay,
    );

    if (!mark || !sheen || !backdrop || !ambient) {
      overlay.remove();
      return;
    }

    let started = false;
    let locked = false;
    let intro: ScrollTrigger | null = null;
    let timeline: gsap.core.Timeline | null = null;

    const finish = () => {
      overlay.remove();
      if (locked) {
        locked = false;
        unlockScroll();
      }
      /* The first-pass detector is gone permanently for this page load. */
      intro?.kill();
      intro = null;
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const run = () => {
      if (started) return;
      started = true;
      intro?.kill();
      intro = null;

      /* Cover FIRST. Only after there is zero chance of seeing the document
         move do we place page two underneath at its exact top edge. */
      gsap.set(overlay, { autoAlpha: 1 });
      gsap.set(backdrop, { opacity: 1 });
      gsap.set(mark, {
        autoAlpha: 0,
        scale: 0.58,
        rotateX: 14,
        rotateY: -13,
        z: -420,
        transformOrigin: "50% 50%",
      });
      gsap.set(sheen, { xPercent: -145, opacity: 0 });
      gsap.set(left, { xPercent: -132, autoAlpha: 0, rotate: -7 });
      gsap.set(right, { xPercent: 132, autoAlpha: 0, rotate: 7 });
      gsap.set(ambient, { opacity: 0.22, scale: 0.88 });

      jumpToElement(status);
      lockScroll();
      locked = true;
      ScrollTrigger.update();

      timeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: finish,
      });

      timeline
        .to(mark, {
          autoAlpha: 1,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          z: 0,
          duration: 0.48,
          ease: "power3.out",
        }, 0.04)
        .to(sheen, {
          xPercent: 155,
          opacity: 0.82,
          duration: 0.42,
          ease: "power2.inOut",
        }, 0.22)
        .to(mark, {
          rotateY: 6,
          rotateX: -2,
          scale: 1.035,
          duration: 0.28,
          ease: "sine.inOut",
        }, 0.48)
        .to(left, {
          xPercent: (i) => (i === 0 ? -25 : -11),
          autoAlpha: 1,
          rotate: (i) => (i === 0 ? -4 : 0),
          duration: 0.5,
          stagger: 0.035,
          ease: "power3.out",
        }, 0.55)
        .to(right, {
          xPercent: (i) => (i === 0 ? 25 : 11),
          autoAlpha: 1,
          rotate: (i) => (i === 0 ? 4 : 0),
          duration: 0.5,
          stagger: 0.035,
          ease: "power3.out",
        }, 0.58)
        .to(ambient, {
          opacity: 0.7,
          scale: 1.04,
          duration: 0.42,
          ease: "sine.out",
        }, 0.62)
        .to(mark, {
          rotateY: 0,
          scale: 1.08,
          autoAlpha: 0,
          z: 100,
          duration: 0.32,
          ease: "power2.in",
        }, 0.95)
        /* Page two has been sitting at top:0 underneath since the first frame.
           We can now expose it progressively without ever exposing Hero. */
        .to(backdrop, {
          opacity: 0,
          duration: 0.42,
          ease: "power2.inOut",
        }, 1.08)
        .to(left, {
          xPercent: (i) => (i === 0 ? -108 : -130),
          rotate: (i) => (i === 0 ? -8 : -12),
          autoAlpha: 0,
          duration: 0.48,
          ease: "power2.inOut",
        }, 1.08)
        .to(right, {
          xPercent: (i) => (i === 0 ? 108 : 130),
          rotate: (i) => (i === 0 ? 8 : 12),
          autoAlpha: 0,
          duration: 0.48,
          ease: "power2.inOut",
        }, 1.08)
        .to(ambient, {
          opacity: 0,
          scale: 1.16,
          duration: 0.38,
          ease: "power2.out",
        }, 1.12)
        .to(overlay, {
          autoAlpha: 0,
          duration: 0.1,
          ease: "none",
        }, 1.5);
    };

    /* One or two pixels of downward travel are enough to prove intent. The
       overlay then takes over and the actual document position is corrected
       invisibly underneath it. Keyboard/PageDown and inertial wheel input are
       covered as well because this watches scroll position, not one event type. */
    intro = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "+=2",
      onLeave: run,
    });

    ScrollTrigger.refresh();

    return () => {
      intro?.kill();
      timeline?.kill();
      overlay.remove();
      if (locked) unlockScroll();
    };
  }, []);

  return null;
}
