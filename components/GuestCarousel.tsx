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

/* Three copies of the list live in the DOM and the viewer sits on the middle
   one. When a scroll settles into a neighbouring copy the strip is shifted by
   exactly one set-width, which lands on the identical frame — so the seam
   between «Гость 10» and «Гость 01» never exists to be seen. The correction
   happens only after motion stops, so it can never fight a smooth scroll. */
const SETS = 3;
const SETTLE_MS = 140;

export default function GuestCarousel({ guests }: GuestCarouselProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* One set is a third of the scrollable content. The trailing margin on every
     frame — rather than a flex gap, which is dropped after the last item —
     is what keeps that division exact: the pitch is uniform across the seam. */
  const measure = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return 0;
    setWidthRef.current = strip.scrollWidth / SETS;
    return setWidthRef.current;
  }, []);

  const recenter = useCallback(() => {
    const strip = stripRef.current;
    const width = setWidthRef.current;
    if (!strip || width <= 0) return;

    /* Outside the middle set, hop back into it. scrollBehavior is forced to
       auto so a smooth setting in CSS cannot animate the correction. */
    const drift =
      strip.scrollLeft < width * 0.5
        ? width
        : strip.scrollLeft > width * 1.5
          ? -width
          : 0;
    if (!drift) return;

    const previous = strip.style.scrollBehavior;
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft += drift;
    strip.style.scrollBehavior = previous;
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const start = () => {
      const width = measure();
      if (width > 0) strip.scrollLeft = width;
    };

    /* Frames are lazy-loaded, so the first measurement can precede the layout
       that gives them width. Re-measure whenever the box actually changes. */
    const observer = new ResizeObserver(() => {
      const before = setWidthRef.current;
      const width = measure();
      if (width > 0 && Math.abs(width - before) > 1) strip.scrollLeft = width;
    });
    observer.observe(strip);

    const onScroll = () => {
      if (settleRef.current) clearTimeout(settleRef.current);
      settleRef.current = setTimeout(recenter, SETTLE_MS);
    };

    start();
    strip.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      strip.removeEventListener("scroll", onScroll);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, [measure, recenter]);

  const step = useCallback(
    (direction: -1 | 1) => {
      const strip = stripRef.current;
      if (!strip || !guests.length) return;

      const pitch = (setWidthRef.current || measure()) / guests.length;
      if (pitch <= 0) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      strip.scrollBy({
        left: direction * pitch,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [guests.length, measure],
  );

  /* The middle set is the real one; the outer two are scenery and are hidden
     from assistive technology so the ten frames are announced once. */
  const sets = Array.from({ length: SETS }, (_, set) => set);

  return (
    <div className="st2-guest-stage" data-st2-guest-stage>
      <div
        className="st2-guest-strip"
        ref={stripRef}
        role="region"
        aria-label="Кадры предыдущего показа «Славянский взгляд»"
        tabIndex={0}
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
        <ul className="st2-guest-row">
          {sets.map((set) =>
            guests.map((guest) => (
              <li
                className="st2-guest"
                key={`${set}-${guest.label}`}
                data-st2-guest
                aria-hidden={set === 1 ? undefined : true}
              >
                <img
                  src={`/media/${guest.img}-${guest.widths[1]}.webp`}
                  srcSet={`/media/${guest.img}-${guest.widths[0]}.webp ${guest.widths[0]}w, /media/${guest.img}-${guest.widths[1]}.webp ${guest.widths[1]}w`}
                  sizes="(min-width: 900px) 34vw, 50vw"
                  alt={set === 1 ? guest.alt : ""}
                  loading="lazy"
                  draggable={false}
                />
              </li>
            )),
          )}
        </ul>
      </div>

      <div className="st2-guest-nav" aria-label="Навигация по кадрам">
        <button
          className="st2-guest-nav-button is-prev"
          type="button"
          onClick={() => step(-1)}
          aria-label="Предыдущий кадр"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <button
          className="st2-guest-nav-button is-next"
          type="button"
          onClick={() => step(1)}
          aria-label="Следующий кадр"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
