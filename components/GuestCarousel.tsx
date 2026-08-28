"use client";

import { useCallback, useEffect, useRef } from "react";

export type GuestCarouselItem = {
  img: string;
  widths: [number, number];
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
  const stripRef = useRef<HTMLDivElement>(null);
  const correctingRef = useRef(false);

  const runWidth = () => {
    const strip = stripRef.current;
    if (!strip) return 0;
    const gap = Number.parseFloat(getComputedStyle(strip).gap) || 0;
    return strip.clientWidth + gap;
  };

  const centreRail = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || !guests.length) return;
    strip.scrollLeft = runWidth();
  }, [guests.length]);

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
    strip.scrollBy({
      left: direction * strip.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <div className="st2-guest-stage" data-st2-guest-stage>
      <div
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
        {COPIES.map((copy) => (
          <ul className="st2-guest-row" key={copy} aria-hidden={copy !== 1}>
            {guests.map((guest) => (
              <li className="st2-guest" key={`${copy}-${guest.label}`}>
                <img
                  src={`/media/${guest.img}-${guest.widths[1]}.webp`}
                  srcSet={`/media/${guest.img}-${guest.widths[0]}.webp ${guest.widths[0]}w, /media/${guest.img}-${guest.widths[1]}.webp ${guest.widths[1]}w`}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  alt={copy === 1 ? guest.alt : ""}
                  loading={copy === 1 ? "lazy" : undefined}
                  draggable={false}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>

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
