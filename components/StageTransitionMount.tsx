"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * HERO -> STATUS TEAM as a fashion-stage reveal.
 *
 * Scroll geometry still belongs to card-stack.css: Hero is the pinned rear
 * screen and STATUS rises over it in normal document flow. This component
 * only adds art direction on top of that geometry, so it cannot create an
 * extra page, jump the scroll position, or leak Hero underneath screen 3.
 *
 * The timeline is scrubbed and reversible. Scrolling back from STATUS to Hero
 * reconstructs the stage in reverse; scrolling down opens it again.
 */
export default function StageTransitionMount() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add(
      "(min-width: 1200px) and (prefers-reduced-motion: no-preference)",
      () => {
        const track = document.querySelector<HTMLElement>(".hero-stage");
        const hero = track?.querySelector<HTMLElement>(".hero");
        const heroInner = track?.querySelector<HTMLElement>(".hero-inner");
        const status = document.querySelector<HTMLElement>("#statusteam");

        if (!track || !hero || !status) return;

        const overlay = document.createElement("div");
        overlay.className = "stage-proscenium";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
          <div class="stage-wing stage-wing-left"><span></span></div>
          <div class="stage-wing stage-wing-right"><span></span></div>
          <div class="stage-apron"></div>
          <div class="stage-light-sweep"></div>
        `;
        document.body.appendChild(overlay);

        const left = overlay.querySelector<HTMLElement>(".stage-wing-left");
        const right = overlay.querySelector<HTMLElement>(".stage-wing-right");
        const apron = overlay.querySelector<HTMLElement>(".stage-apron");
        const light = overlay.querySelector<HTMLElement>(".stage-light-sweep");

        if (!left || !right || !apron || !light) {
          overlay.remove();
          return;
        }

        const ctx = gsap.context(() => {
          gsap.set(overlay, { autoAlpha: 0 });
          gsap.set(left, {
            xPercent: -112,
            rotateY: -12,
            transformOrigin: "0% 50%",
          });
          gsap.set(right, {
            xPercent: 112,
            rotateY: 12,
            transformOrigin: "100% 50%",
          });
          gsap.set(apron, { yPercent: 110, autoAlpha: 0 });
          gsap.set(light, { xPercent: -145, autoAlpha: 0 });

          /* CSS custom properties keep the STATUS transform independent from
             every existing motion pass. The card narrows into a central stage
             opening, then expands to the full second screen. */
          gsap.set(status, {
            "--stage-clip-x": "44%",
            "--stage-radius": "34px",
            "--stage-shadow": "0.54",
          });

          gsap.set(hero, { filter: "brightness(1) saturate(1)" });
          if (heroInner) gsap.set(heroInner, { opacity: 1, y: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: track,
              start: "top top",
              /* card-stack.css gives hero-stage 200svh. `bottom bottom`
                 therefore resolves exactly one viewport later: the instant
                 STATUS reaches top:0 and becomes screen two. */
              end: "bottom bottom",
              scrub: 0.65,
              invalidateOnRefresh: true,
            },
          });

          /* Stage floor appears first: a 1px champagne edge with a dark apron
             underneath, as if the runway is rising out of the bottom. */
          tl.to(overlay, { autoAlpha: 1, duration: 0.02 }, 0.015)
            .to(apron, { yPercent: 0, autoAlpha: 1, duration: 0.16 }, 0.035)

            /* Hero recedes like a rear projection / LED wall. No blur-heavy
               gimmick: only a small luminance and depth change. */
            .to(
              hero,
              {
                filter: "brightness(0.68) saturate(0.82)",
                duration: 0.68,
              },
              0.06,
            )
            .to(
              heroInner,
              heroInner
                ? { opacity: 0.42, y: -18, duration: 0.62 }
                : { duration: 0 },
              0.08,
            )

            /* Abstract fashion curtains enter from the wings and briefly
               compress the view into a central vertical opening. */
            .to(
              left,
              { xPercent: -54, rotateY: -5, duration: 0.25 },
              0.08,
            )
            .to(
              right,
              { xPercent: 54, rotateY: 5, duration: 0.25 },
              0.08,
            )
            .to(
              left,
              { xPercent: -18, rotateY: 0, duration: 0.18 },
              0.31,
            )
            .to(
              right,
              { xPercent: 18, rotateY: 0, duration: 0.18 },
              0.31,
            )

            /* STATUS itself is the stage behind them. It expands from a slim
               centre opening while the real section continues rising in flow. */
            .to(
              status,
              {
                "--stage-clip-x": "31%",
                "--stage-radius": "30px",
                duration: 0.22,
              },
              0.20,
            )
            .to(
              status,
              {
                "--stage-clip-x": "15%",
                "--stage-radius": "22px",
                duration: 0.22,
              },
              0.42,
            )

            /* Curtains now open hard to the sides. The second page is already
               behind them, so this reads as a real stage reveal rather than an
               interstitial animation. */
            .to(
              left,
              { xPercent: -116, rotateY: -15, duration: 0.34 },
              0.50,
            )
            .to(
              right,
              { xPercent: 116, rotateY: 15, duration: 0.34 },
              0.50,
            )
            .to(
              status,
              {
                "--stage-clip-x": "0%",
                "--stage-radius": "0px",
                "--stage-shadow": "0",
                duration: 0.34,
              },
              0.54,
            )

            /* One restrained stage-light pass across the newly revealed page. */
            .to(light, { autoAlpha: 0.14, xPercent: -20, duration: 0.12 }, 0.55)
            .to(light, { autoAlpha: 0, xPercent: 145, duration: 0.28 }, 0.67)
            .to(apron, { autoAlpha: 0, yPercent: 35, duration: 0.18 }, 0.66)
            .to(overlay, { autoAlpha: 0, duration: 0.08 }, 0.90);
        }, overlay);

        ScrollTrigger.refresh();

        return () => {
          ctx.revert();
          overlay.remove();
          status.style.removeProperty("--stage-clip-x");
          status.style.removeProperty("--stage-radius");
          status.style.removeProperty("--stage-shadow");
          ScrollTrigger.refresh();
        };
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
