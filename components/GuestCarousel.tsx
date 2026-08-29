"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

export type GuestCarouselItem = {
  img: string;
  widths: number[];
  label: string;
  alt: string;
};

type GuestCarouselProps = {
  guests: GuestCarouselItem[];
};

const DESKTOP_QUERY = "(min-width: 768px)";

export default function GuestCarousel({ guests }: GuestCarouselProps) {
  const stripRef = useRef<HTMLUListElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [firstVisible, setFirstVisible] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  const updatePosition = useCallback(() => {
    const strip = stripRef.current;
    const firstCard = strip?.querySelector<HTMLElement>(".st2-guest");
    if (!strip || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(strip).columnGap) || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const nextVisibleCount = window.matchMedia(DESKTOP_QUERY).matches ? 3 : 1;
    const lastStart = Math.max(guests.length - nextVisibleCount, 0);
    const nextIndex = Math.min(Math.max(Math.round(strip.scrollLeft / step), 0), lastStart);

    setVisibleCount(nextVisibleCount);
    setFirstVisible(nextIndex);
  }, [guests.length]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const observer = new ResizeObserver(updatePosition);
    observer.observe(strip);
    updatePosition();

    return () => observer.disconnect();
  }, [updatePosition]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const handleScroll = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(updatePosition);
  };

  const goTo = (index: number) => {
    const strip = stripRef.current;
    const firstCard = strip?.querySelector<HTMLElement>(".st2-guest");
    if (!strip || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(strip).columnGap) || 0;
    const lastStart = Math.max(guests.length - visibleCount, 0);
    const nextIndex = Math.min(Math.max(index, 0), lastStart);

    strip.scrollTo({
      left: nextIndex * (firstCard.getBoundingClientRect().width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const lastVisible = Math.min(firstVisible + visibleCount, guests.length);
  const lastStart = Math.max(guests.length - visibleCount, 0);
  const progress = guests.length === 0 ? 1 : lastVisible / guests.length;
  const format = (value: number) => String(value).padStart(2, "0");

  return (
    <div
      className="st2-guest-stage"
      data-st2-guest-stage
      data-active-index={firstVisible}
      role="region"
      aria-roledescription="carousel"
      aria-label="Кадры предыдущего показа «Славянский взгляд»"
    >
      <p className="sr-only" id="st2-guest-instructions">
        Листайте фотографии. На широком экране одновременно показаны три кадра.
      </p>

      <ul
        className="st2-guest-strip"
        ref={stripRef}
        aria-describedby="st2-guest-instructions"
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(firstVisible - 1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(firstVisible + 1);
          }
        }}
      >
        {guests.map((guest, index) => (
          <li
            className="st2-guest"
            key={guest.label}
            data-carousel-slide={index + 1}
          >
            <img
              src={`/media/${guest.img}-${guest.widths[guest.widths.length - 1]}.webp`}
              srcSet={guest.widths
                .map((width) => `/media/${guest.img}-${width}.webp ${width}w`)
                .join(", ")}
              sizes="(min-width: 768px) 32vw, 82vw"
              alt={guest.alt}
              loading="lazy"
              draggable={false}
            />
          </li>
        ))}
      </ul>

      <div className="st2-guest-nav" aria-label="Навигация по кадрам">
        <button
          className="st2-guest-nav-button is-prev"
          type="button"
          onClick={() => goTo(firstVisible - 1)}
          disabled={firstVisible === 0}
          aria-label="Предыдущий кадр"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <button
          className="st2-guest-nav-button is-next"
          type="button"
          onClick={() => goTo(firstVisible + 1)}
          disabled={firstVisible === lastStart}
          aria-label="Следующий кадр"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="st2-guest-footer">
        <div className="st2-guest-progress" aria-hidden="true">
          <span style={{ "--st2-progress": progress } as CSSProperties} />
        </div>
        <p className="st2-guest-counter" aria-live="polite">
          <span>{format(firstVisible + 1)}</span>
          {visibleCount > 1 && <span>–{format(lastVisible)}</span>}
          <span className="st2-guest-counter-total"> / {format(guests.length)}</span>
        </p>
      </div>
    </div>
  );
}
