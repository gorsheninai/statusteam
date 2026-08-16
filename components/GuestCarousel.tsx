"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type GuestCarouselItem = {
  img: string;
  widths: [number, number];
  label: string;
  alt: string;
};

type GuestCarouselProps = {
  guests: GuestCarouselItem[];
};

const wrapIndex = (index: number, length: number) =>
  ((index % length) + length) % length;

const shortestOffset = (index: number, activeIndex: number, length: number) => {
  let offset = index - activeIndex;
  while (offset > length / 2) offset -= length;
  while (offset < -length / 2) offset += length;
  return offset;
};

const interpolateDepth = (distance: number) => {
  const abs = Math.min(Math.abs(distance), 3);
  const direction = Math.sign(distance);
  const x = direction * (abs <= 1 ? abs * 93 : 93 + (abs - 1) * 68);
  const rotate = -direction * (abs <= 1 ? abs * 25 : 25 + (abs - 1) * 20);
  const z = abs <= 1 ? abs * -200 : -200 - (abs - 1) * 180;
  const scale = abs <= 1 ? 1.1 - abs * 0.2 : 0.9 - (abs - 1) * 0.15;
  const opacity = abs <= 1 ? 1 - abs * 0.55 : 0.45 - (abs - 1) * 0.25;
  const grayscale = abs <= 1 ? abs * 40 : 40 + (abs - 1) * 40;
  const brightness = abs <= 1 ? 1 - abs * 0.2 : 0.8 - (abs - 1) * 0.12;

  return {
    transform: `translate3d(calc(-50% + ${x}%), 0, ${z}px) rotateY(${rotate}deg) scale(${Math.max(scale, 0.58)})`,
    opacity: Math.max(opacity, 0),
    filter: `grayscale(${Math.min(grayscale, 100)}%) brightness(${Math.max(brightness, 0.5)})`,
    zIndex: Math.max(30 - Math.round(abs * 10), 1),
    pointerEvents: abs > 2.15 ? "none" : "auto",
    visibility: abs > 2.6 ? "hidden" : "visible",
  } satisfies CSSProperties;
};

export default function GuestCarousel({ guests }: GuestCarouselProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({
    id: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    axis: "" as "" | "x" | "y",
  });
  const didDragRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (
      reducedMotion ||
      hovered ||
      touching ||
      focusPaused ||
      dragging ||
      !inView ||
      !pageVisible ||
      guests.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(current + 1, guests.length));
      setDragX(0);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [dragging, focusPaused, guests.length, hovered, inView, pageVisible, reducedMotion, touching]);

  const cardStep = () => {
    const viewportWidth = viewportRef.current?.clientWidth ?? 390;
    return Math.max(210, Math.min(380, viewportWidth * (viewportWidth < 700 ? 0.72 : 0.28)));
  };

  const goTo = (index: number) => {
    setActiveIndex(wrapIndex(index, guests.length));
    setDragX(0);
  };

  const move = (direction: -1 | 1) => goTo(activeIndex + direction);

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      axis: "",
    };
    didDragRef.current = false;
    if (event.pointerType !== "mouse") setTouching(true);
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!dragging || pointer.id !== event.pointerId) return;

    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    if (!pointer.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 7) {
      pointer.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (pointer.axis !== "x") return;

    const elapsed = Math.max(event.timeStamp - pointer.lastTime, 1);
    pointer.velocity = (event.clientX - pointer.lastX) / elapsed;
    pointer.lastX = event.clientX;
    pointer.lastTime = event.timeStamp;
    didDragRef.current = Math.abs(dx) > 8;
    setDragX(dx);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (pointer.id !== event.pointerId) return;

    const step = cardStep();
    const projected = dragX + pointer.velocity * 190;
    const slideCount = Math.max(-2, Math.min(2, Math.round(-projected / step)));

    if (pointer.axis === "x" && (Math.abs(projected) > step * 0.18 || slideCount !== 0)) {
      goTo(activeIndex + (slideCount || (projected < 0 ? 1 : -1)));
    } else {
      setDragX(0);
    }

    setDragging(false);
    if (event.pointerType !== "mouse") setTouching(false);
    pointerRef.current.id = -1;
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const dragProgress = reducedMotion ? 0 : dragX / cardStep();
  const positions = useMemo(
    () =>
      guests.map((_, index) =>
        shortestOffset(index, activeIndex, guests.length) + dragProgress,
      ),
    [activeIndex, dragProgress, guests],
  );

  return (
    <div
      className={`st2-guest-stage${dragging ? " is-dragging" : ""}`}
      ref={stageRef}
      data-st2-guest-stage
      data-active-index={activeIndex}
      role="region"
      aria-roledescription="carousel"
      aria-label="Гости STATUS TEAM"
      tabIndex={0}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
      onFocusCapture={(event) => {
        if ((event.target as HTMLElement).matches(":focus-visible")) setFocusPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
    >
      <div
        className="st2-guest-viewport"
        ref={viewportRef}
        onPointerDown={beginDrag}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="st2-guest-track" role="list">
          {guests.map((guest, index) => {
            const distance = positions[index];
            const isActive = index === activeIndex && Math.abs(dragProgress) < 0.12;
            const hidden = Math.abs(distance) > 2.6;
            const guestNumber = String(index + 1).padStart(2, "0");

            return (
              <div
                className={`st2-guest${isActive ? " is-active" : ""}`}
                key={guest.label}
                role="listitem"
                style={interpolateDepth(distance)}
                aria-hidden={hidden}
                data-st2-guest
              >
                <button
                  className="st2-guest-card"
                  type="button"
                  aria-label={`${guest.label}. Показать в центре`}
                  aria-current={isActive ? "true" : undefined}
                  tabIndex={Math.abs(distance) <= 1.15 ? 0 : -1}
                  onClick={() => {
                    if (!didDragRef.current) goTo(index);
                  }}
                >
                  <span className="st2-guest-media">
                    <img
                      src={`/media/${guest.img}-${guest.widths[1]}.webp`}
                      srcSet={`/media/${guest.img}-${guest.widths[0]}.webp ${guest.widths[0]}w, /media/${guest.img}-${guest.widths[1]}.webp ${guest.widths[1]}w`}
                      sizes="(min-width: 900px) 24vw, 74vw"
                      width={guest.widths[1]}
                      height={Math.round((guest.widths[1] * 4) / 3)}
                      alt={guest.alt}
                      loading="lazy"
                      draggable={false}
                    />
                  </span>

                  <span className="st2-guest-badge" aria-hidden="true">
                    Guest {guestNumber}
                  </span>

                  <span className="st2-guest-shade" aria-hidden="true" />
                  <span className="st2-guest-copy">
                    <strong>{guest.label}</strong>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
