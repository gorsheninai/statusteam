"use client";

import { useCallback, useEffect, useRef } from "react";

export type GuestCarouselItem = {
  img: string;
  /* Ascending, and every entry must exist in public/media. The largest is the
     src fallback; the browser picks the rest against `sizes`. */
  widths: number[];
  label: string;
  alt: string;
};

type GuestCarouselProps = {
  guests: GuestCarouselItem[];
};

const COPIES = [0, 1, 2];

/**
 * A flat contact-sheet rail. Three equal runs let the row wrap from frame 10
 * to frame 1 without a visible edge; only its scroll position is corrected.
 */
export default function GuestCarousel({ guests }: GuestCarouselProps) {
  const stripRef = useRef<HTMLUListElement>(null);
  const correctingRef = useRef(false);

  const runWidth = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return 0;
    const frame = strip.querySelector<HTMLElement>(".st2-guest");
    const gap = Number.parseFloat(getComputedStyle(strip).gap) || 0;
    return ((frame?.getBoundingClientRect().width ?? 0) + gap) * guests.length;
  }, [guests.length]);

  const centreRail = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || !guests.length) return;
    strip.scrollLeft = runWidth();
  }, [guests.length, runWidth]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || !guests.length) return;
    const frame = window.requestAnimationFrame(centreRail);
    const observer = new ResizeObserver(centreRail);
    observer.observe(strip);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [centreRail, guests.length]);

  const keepLooping = () => {
    const strip = stripRef.current;
    if (!strip || correctingRef.current) return;
    const run = runWidth();
    if (!run) return;

    if (strip.scrollLeft < run * 0.22) {
      correctingRef.current = true;
      strip.scrollLeft += run;
      correctingRef.current = false;
    } else if (strip.scrollLeft > run * 1.78) {
      correctingRef.current = true;
      strip.scrollLeft -= run;
      correctingRef.current = false;
    }
  };

  const step = (direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;

    // Advance by one editorial frame, not by the visible viewport. Moving by
    // two or three frames made the controls feel disconnected from the image
    // directly under the arrow.
    const frame = strip.querySelector<HTMLElement>(".st2-guest");
    const gap = Number.parseFloat(getComputedStyle(strip).gap) || 0;
    const distance = (frame?.getBoundingClientRect().width ?? strip.clientWidth) + gap;

    strip.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <div className="st2-guest-stage" data-st2-guest-stage>
      <ul
        className="st2-guest-strip"
        ref={stripRef}
        role="region"
        aria-label="Кадры предыдущего показа «Славянский взгляд»"
        tabIndex={0}
        onScroll={keepLooping}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
        }}
      >
        {COPIES.flatMap((copy) =>
          guests.map((guest, index) => (
            <li
              className="st2-guest"
              key={`${copy}-${guest.label}`}
              aria-hidden={copy !== 1}
              data-carousel-copy={copy}
              data-carousel-slide={index + 1}
            >
              <img
                src={`/media/${guest.img}-${guest.widths[guest.widths.length - 1]}.webp`}
                srcSet={guest.widths
                  .map((w) => `/media/${guest.img}-${w}.webp ${w}w`)
                  .join(", ")}
                /* Must track .st2-guest's flex-basis, min() and all. The
                   browser budgets resolution from this value, not from the
                   rendered box: when it said 50vw against a 62vw frame it
                   under-asked by a quarter and only escaped a soft image
                   because the ladder's next rung happened to be close enough.

                   `vh` rather than the rule's `svh`, on purpose. The preload
                   scanner reads this before layout, and the two differ only
                   while the URL bar is showing — where vh is the larger of
                   the pair, so the miss is an over-ask. Where min() is not
                   understood the whole entry is dropped and the fallback is
                   100vw, which over-asks as well. */
                sizes="(min-width: 768px) 33vw, min(88vw, 41.33vh)"
                alt={copy === 1 ? guest.alt : ""}
                loading="lazy"
                draggable={false}
              />
            </li>
          )),
        )}
      </ul>

      <div className="st2-guest-nav" aria-label="Навигация по кадрам">
        <button className="st2-guest-nav-button is-prev" type="button" onClick={() => step(-1)} aria-label="Предыдущие кадры">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
        </button>
        <button className="st2-guest-nav-button is-next" type="button" onClick={() => step(1)} aria-label="Следующие кадры">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
