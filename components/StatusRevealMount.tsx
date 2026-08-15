"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

export default function StatusRevealMount() {
  useEffect(() => {
    const status = document.querySelector<HTMLElement>("#statusteam");
    if (!status || document.querySelector(".status-transition")) return;

    /* Fixed overlay: it owns the entire Hero -> STATUS hand-off. The real
       second page moves underneath, but is NOT exposed until its top edge is
       exactly at the viewport top. This guarantees that no strip of the Hero
       can remain visible above page two when the reveal finishes. */
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

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm) {
      overlay.remove();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const stage = overlay.querySelector<HTMLElement>(".status-transition-stage");
    const backdrop = overlay.querySelector<HTMLElement>(".status-transition-backdrop");
    const mark = overlay.querySelector<HTMLElement>(".status-transition-mark");
    const sheen = overlay.querySelector<HTMLElement>(".status-transition-sheen");
    const ambient = overlay.querySelector<HTMLElement>(".status-transition-ambient");
    const left = gsap.utils.toArray<HTMLElement>(
      ".status-transition-palm-left",
      overlay,
    );
    const right = gsap.utils.toArray<HTMLElement>(
      ".status-transition-palm-right",
      overlay,
    );

    if (!stage || !backdrop || !mark || !sheen || !ambient) {
      overlay.remove();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(overlay, { autoAlpha: 0 });
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

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: status,
          /* Progress 0 = page two just touches the viewport bottom.
             Progress 1 = page two is perfectly aligned at top: 100% of the
             viewport is STATUS, 0% is Hero. Only at that exact endpoint do
             we remove the black transition overlay. */
          start: "top bottom",
          end: "top top",
          scrub: 0.72,
          invalidateOnRefresh: true,
        },
      });

      tl.to(overlay, { autoAlpha: 1, duration: 0.035, ease: "none" }, 0)
        .to(mark, {
          autoAlpha: 1,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          z: 0,
          duration: 0.24,
          ease: "power3.out",
        }, 0.04)
        .to(
          sheen,
          {
            xPercent: 155,
            opacity: 0.82,
            duration: 0.2,
            ease: "power2.inOut",
          },
          0.16,
        )
        .to(
          mark,
          {
            rotateY: 7,
            rotateX: -2,
            scale: 1.035,
            duration: 0.12,
            ease: "sine.inOut",
          },
          0.27,
        )
        .to(
          left,
          {
            xPercent: (i) => (i === 0 ? -26 : -12),
            autoAlpha: 1,
            rotate: (i) => (i === 0 ? -4 : 0),
            duration: 0.25,
            stagger: 0.02,
            ease: "power3.out",
          },
          0.34,
        )
        .to(
          right,
          {
            xPercent: (i) => (i === 0 ? 26 : 12),
            autoAlpha: 1,
            rotate: (i) => (i === 0 ? 4 : 0),
            duration: 0.25,
            stagger: 0.02,
            ease: "power3.out",
          },
          0.35,
        )
        .to(
          ambient,
          { opacity: 0.7, scale: 1.04, duration: 0.2, ease: "sine.out" },
          0.39,
        )
        .to(
          mark,
          {
            rotateY: 0,
            scale: 1.08,
            autoAlpha: 0.42,
            duration: 0.13,
            ease: "power2.inOut",
          },
          0.52,
        )
        .to(
          left,
          {
            xPercent: (i) => (i === 0 ? -9 : 3),
            scale: (i) => (i === 0 ? 1 : 1.04),
            duration: 0.12,
            ease: "power2.inOut",
          },
          0.54,
        )
        .to(
          right,
          {
            xPercent: (i) => (i === 0 ? 9 : -3),
            scale: (i) => (i === 0 ? 1 : 1.04),
            duration: 0.12,
            ease: "power2.inOut",
          },
          0.54,
        )
        .to(
          mark,
          {
            autoAlpha: 0,
            scale: 1.15,
            z: 120,
            duration: 0.1,
            ease: "power2.in",
          },
          0.62,
        )
        .to(
          ambient,
          { opacity: 0.08, scale: 1.18, duration: 0.2, ease: "power2.out" },
          0.66,
        )
        .to(
          left,
          {
            xPercent: (i) => (i === 0 ? -104 : -126),
            rotate: (i) => (i === 0 ? -8 : -12),
            autoAlpha: 0,
            duration: 0.29,
            ease: "power2.inOut",
          },
          0.68,
        )
        .to(
          right,
          {
            xPercent: (i) => (i === 0 ? 104 : 126),
            rotate: (i) => (i === 0 ? 8 : 12),
            autoAlpha: 0,
            duration: 0.29,
            ease: "power2.inOut",
          },
          0.68,
        )
        /* Keep the curtain 100% opaque for the whole travel. At progress 1
           STATUS is fully occupying the viewport, so this final micro-fade
           can reveal it without ever exposing a piece of the Hero above it. */
        .to(overlay, { autoAlpha: 0, duration: 0.002, ease: "none" }, 0.998);
    }, overlay);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      overlay.remove();
      ScrollTrigger.refresh();
    };
  }, []);

  return null;
}
