"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SiteMotion() {
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("pulse-preloader-seen") === "1";
      if (!seen) sessionStorage.setItem("pulse-preloader-seen", "1");
    } catch {
      // Storage may be unavailable in some in-app/private contexts.
    }

    if (seen) {
      setShowPreloader(false);
      return;
    }

    const timer = window.setTimeout(() => setShowPreloader(false), 880);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches && !coarse;

    gsap.registerPlugin(ScrollTrigger);

    const cleanup: Array<() => void> = [];
    const ctx = gsap.context(() => {
      if (!reduced) {
        const heroDelay = showPreloader ? 0.72 : 0.08;
        gsap.fromTo(
          ".hero-v4 .hero-curtain",
          { clipPath: "inset(0 50% 0 50%)" },
          { clipPath: "inset(0 0% 0 0%)", duration: 1.15, delay: heroDelay, ease: "power3.inOut" },
        );
        gsap.fromTo(
          ".hero-v4 .hero-title .reveal-mask > span, .hero-v4 .hero-statement, .hero-v4 .hero-where, .hero-v4 .hero-ticket-cta",
          { yPercent: 115, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.07, delay: heroDelay + 0.5, ease: "power3.out" },
        );

        gsap.to(".hero-v4 .hero-layer", {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-heading]").forEach((heading) => {
          const lines = heading.querySelectorAll<HTMLElement>(".reveal-mask > span");
          if (!lines.length) return;
          gsap.from(lines, {
            yPercent: 110,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 84%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-up]").forEach((element) => {
          gsap.from(element, {
            y: 34,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-bg]").forEach((section) => {
          const color = section.dataset.bg;
          if (!color) return;
          ScrollTrigger.create({
            trigger: section,
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => gsap.to(document.body, { backgroundColor: color, duration: 0.55 }),
            onEnterBack: () => gsap.to(document.body, { backgroundColor: color, duration: 0.55 }),
          });
        });

        if (desktop) {
          const videoShell = document.querySelector<HTMLElement>(".status-video-zoom");
          if (videoShell) {
            gsap.fromTo(
              videoShell,
              { scale: 0.72, borderRadius: 28 },
              {
                scale: 1,
                borderRadius: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: ".status-video-pin",
                  start: "top top",
                  end: "+=110%",
                  scrub: true,
                  pin: true,
                  anticipatePin: 1,
                },
              },
            );
          }
        }

        gsap.fromTo(
          ".next-chapter-copy",
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: ".next-chapter", start: "top 70%", end: "center 45%", scrub: true },
          },
        );

        const pin = document.querySelector<HTMLElement>(".pulse-pin-stage");
        const beats = gsap.utils.toArray<HTMLElement>(".pulse-beat");
        const dots = gsap.utils.toArray<HTMLElement>(".pulse-progress i");
        if (pin && beats.length) {
          gsap.set(beats, { autoAlpha: 0 });
          gsap.set(beats[0], { autoAlpha: 1 });
          gsap.set(dots, { opacity: 0.28, scale: 1 });
          if (dots[0]) gsap.set(dots[0], { opacity: 1, scale: 1.4 });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: ".pulse-pin-scroll",
              start: "top top",
              end: `+=${desktop ? 400 : 310}%`,
              scrub: 0.65,
              pin,
              anticipatePin: 1,
            },
          });

          for (let index = 1; index < beats.length; index += 1) {
            timeline
              .to(beats[index - 1], { autoAlpha: 0, yPercent: -8, duration: 0.35, ease: "power2.in" })
              .fromTo(
                beats[index],
                { autoAlpha: 0, yPercent: 10 },
                { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: "power3.out" },
                "<0.08",
              )
              .to(dots[index - 1], { opacity: 0.28, scale: 1, duration: 0.2 }, "<")
              .to(dots[index], { opacity: 1, scale: 1.4, duration: 0.2 }, "<");
          }
        }

        gsap.from(".ticket-posters figure", {
          opacity: 0,
          y: 70,
          rotate: (index) => [-3, 0, 3][index] ?? 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".ticket-posters", start: "top 82%", once: true },
        });
      }

      if (desktop && !reduced) {
        const cursor = document.querySelector<HTMLElement>(".site-cursor");
        if (cursor) {
          const xTo = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
          const yTo = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });
          const onMove = (event: PointerEvent) => {
            cursor.classList.add("is-visible");
            xTo(event.clientX);
            yTo(event.clientY);
          };
          const onLeaveWindow = () => cursor.classList.remove("is-visible");
          window.addEventListener("pointermove", onMove, { passive: true });
          document.documentElement.addEventListener("pointerleave", onLeaveWindow);
          cleanup.push(() => {
            window.removeEventListener("pointermove", onMove);
            document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
          });

          const interactive = document.querySelectorAll<HTMLElement>("a, button, [data-cursor]");
          interactive.forEach((element) => {
            const enter = () => {
              cursor.classList.add("is-active");
              const labelled = element.closest<HTMLElement>("[data-cursor]");
              cursor.dataset.label = element.dataset.cursor ?? labelled?.dataset.cursor ?? "";
            };
            const leave = () => {
              cursor.classList.remove("is-active");
              cursor.dataset.label = "";
            };
            element.addEventListener("pointerenter", enter);
            element.addEventListener("pointerleave", leave);
            cleanup.push(() => {
              element.removeEventListener("pointerenter", enter);
              element.removeEventListener("pointerleave", leave);
            });
          });
        }

        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((button) => {
          const move = (event: PointerEvent) => {
            const rect = button.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
            gsap.to(button, { x, y, duration: 0.35, ease: "power3.out" });
          };
          const leave = () => gsap.to(button, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, .45)" });
          button.addEventListener("pointermove", move);
          button.addEventListener("pointerleave", leave);
          cleanup.push(() => {
            button.removeEventListener("pointermove", move);
            button.removeEventListener("pointerleave", leave);
          });
        });

        document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
          const move = (event: PointerEvent) => {
            const rect = card.getBoundingClientRect();
            const nx = (event.clientX - rect.left) / rect.width - 0.5;
            const ny = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty("--mx", `${(nx + 0.5) * 100}%`);
            card.style.setProperty("--my", `${(ny + 0.5) * 100}%`);
            gsap.to(card, { rotateY: nx * 12, rotateX: ny * -12, duration: 0.32, transformPerspective: 800 });
          };
          const leave = () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.65, ease: "power3.out" });
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          cleanup.push(() => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          });
        });

        document.querySelectorAll<HTMLElement>(".experience-row").forEach((row) => {
          const media = row.querySelector<HTMLElement>(".experience-hover-media");
          if (!media) return;
          const xTo = gsap.quickTo(media, "x", { duration: 0.38, ease: "power3.out" });
          const yTo = gsap.quickTo(media, "y", { duration: 0.38, ease: "power3.out" });
          const enter = () => gsap.to(media, { autoAlpha: 1, scale: 1, duration: 0.35 });
          const move = (event: PointerEvent) => { xTo(event.clientX); yTo(event.clientY); };
          const leave = () => gsap.to(media, { autoAlpha: 0, scale: 0.94, duration: 0.3 });
          row.addEventListener("pointerenter", enter);
          row.addEventListener("pointermove", move);
          row.addEventListener("pointerleave", leave);
          cleanup.push(() => {
            row.removeEventListener("pointerenter", enter);
            row.removeEventListener("pointermove", move);
            row.removeEventListener("pointerleave", leave);
          });
        });
      }
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    cleanup.push(() => window.removeEventListener("load", refresh));

    return () => {
      cleanup.forEach((fn) => fn());
      ctx.revert();
    };
  }, [showPreloader]);

  return (
    <>
      {showPreloader && (
        <div className="site-preloader" aria-hidden="true">
          <div className="preloader-pulse">
            <svg viewBox="0 0 220 32" preserveAspectRatio="none">
              <path d="M0 16 H72 L82 16 L88 5 L96 27 L105 11 L112 16 H220" />
            </svg>
          </div>
        </div>
      )}
      <div className="site-cursor" aria-hidden="true" />
    </>
  );
}
