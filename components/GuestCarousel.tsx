"use client";

import gsap from "gsap";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
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

const FULL_CYCLE_SECONDS = 21;
const FOCUS_DURATION_SECONDS = 0.7;

const wrapIndex = (index: number, length: number) =>
  ((index % length) + length) % length;

const wrapPosition = (position: number, length: number) =>
  ((position % length) + length) % length;

const shortestOffset = (index: number, position: number, length: number) => {
  let offset = index - wrapPosition(position, length);
  while (offset > length / 2) offset -= length;
  while (offset < -length / 2) offset += length;
  return offset;
};

const closestPositionForIndex = (
  index: number,
  position: number,
  length: number,
) => position + shortestOffset(index, position, length);

const interpolateDepth = (distance: number) => {
  const abs = Math.min(Math.abs(distance), 3);
  const direction = Math.sign(distance);
  const x = direction * (abs <= 1 ? abs * 93 : 93 + (abs - 1) * 68);
  const rotate = -direction * (abs <= 1 ? abs * 25 : 25 + (abs - 1) * 20);
  const z = abs <= 1 ? abs * -200 : -200 - (abs - 1) * 180;
  const scale = abs <= 1 ? 1.1 - abs * 0.2 : 0.9 - (abs - 1) * 0.15;
  const opacity = abs <= 1 ? 1 - abs * 0.55 : 0.45 - (abs - 1) * 0.25;
  const grayscale = abs <= 1 ? abs * 30 : 30 + (abs - 1) * 40;
  const brightness = abs <= 1 ? 1 - abs * 0.2 : 0.8 - (abs - 1) * 0.12;
  const zIndex =
    abs <= 1
      ? 40 - abs * 20
      : abs <= 2
        ? 20 - (abs - 1) * 10
        : 10 - (abs - 2) * 9;

  return {
    transform: `translate3d(calc(-50% + ${x}%), 0, ${z}px) rotateY(${rotate}deg) scale(${Math.max(scale, 0.58)})`,
    opacity: Math.max(opacity, 0),
    filter: `grayscale(${Math.min(grayscale, 100)}%) brightness(${Math.max(brightness, 0.5)})`,
    zIndex: Math.max(Math.round(zIndex), 1),
    pointerEvents: abs > 2.15 ? "none" : "auto",
    visibility: abs > 2.6 ? "hidden" : "visible",
  } satisfies CSSProperties;
};

export default function GuestCarousel({ guests }: GuestCarouselProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const focusTweenRef = useRef<gsap.core.Tween | null>(null);
  const positionRef = useRef(0);
  const activeIndexRef = useRef(0);
  const rotatingRef = useRef(true);
  const wasRotatingOnPointerDownRef = useRef(false);
  const pointerRef = useRef({
    id: -1,
    startX: 0,
    startY: 0,
    startPosition: 0,
    startedOnCard: false,
    axis: "" as "" | "x" | "y",
  });
  const didDragRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [isFocusing, setIsFocusing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const renderPosition = useCallback(
    (position: number) => {
      if (!guests.length) return;

      const normalized = wrapPosition(position, guests.length);
      const nextActive = wrapIndex(Math.round(normalized), guests.length);

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const depth = interpolateDepth(
          shortestOffset(index, normalized, guests.length),
        );
        Object.assign(card.style, depth);
        card.setAttribute(
          "aria-hidden",
          depth.visibility === "hidden" ? "true" : "false",
        );
        const button = card.querySelector<HTMLButtonElement>("button");
        if (button) {
          button.tabIndex = depth.visibility === "hidden" ? -1 : 0;
        }
      });

      const stage = stageRef.current;
      if (stage) {
        stage.dataset.rotationAngle = String(
          (normalized / guests.length) * 360,
        );
      }

      if (nextActive !== activeIndexRef.current) {
        activeIndexRef.current = nextActive;
        setActiveIndex(nextActive);
      }
    },
    [guests.length],
  );

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const setRotating = useCallback((next: boolean) => {
    rotatingRef.current = next;
    setIsRotating(next);
  }, []);

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
    const updateVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    renderPosition(positionRef.current);
  }, [renderPosition]);

  useEffect(() => {
    stopFrame();
    if (
      !isRotating ||
      reducedMotion ||
      !inView ||
      !pageVisible ||
      guests.length < 2
    ) {
      return;
    }

    let previousTime = performance.now();
    const cardsPerMillisecond =
      guests.length / (FULL_CYCLE_SECONDS * 1000);

    const tick = (time: number) => {
      const elapsed = Math.min(time - previousTime, 64);
      previousTime = time;
      positionRef.current += elapsed * cardsPerMillisecond;

      if (Math.abs(positionRef.current) > guests.length * 100) {
        positionRef.current = wrapPosition(positionRef.current, guests.length);
      }

      renderPosition(positionRef.current);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return stopFrame;
  }, [
    guests.length,
    inView,
    isRotating,
    pageVisible,
    reducedMotion,
    renderPosition,
    stopFrame,
  ]);

  useEffect(
    () => () => {
      stopFrame();
      focusTweenRef.current?.kill();
    },
    [stopFrame],
  );

  const cardStep = () => {
    const viewportWidth = viewportRef.current?.clientWidth ?? 390;
    return Math.max(
      210,
      Math.min(380, viewportWidth * (viewportWidth < 700 ? 0.72 : 0.28)),
    );
  };

  const focusPosition = useCallback(
    (targetPosition: number) => {
      stopFrame();
      focusTweenRef.current?.kill();
      setRotating(false);

      if (reducedMotion) {
        positionRef.current = targetPosition;
        renderPosition(targetPosition);
        setIsFocusing(false);
        return;
      }

      setIsFocusing(true);
      const proxy = { value: positionRef.current };
      focusTweenRef.current = gsap.to(proxy, {
        value: targetPosition,
        duration: FOCUS_DURATION_SECONDS,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => {
          positionRef.current = proxy.value;
          renderPosition(proxy.value);
        },
        onComplete: () => {
          positionRef.current = targetPosition;
          renderPosition(targetPosition);
          setIsFocusing(false);
          focusTweenRef.current = null;
        },
      });
    },
    [reducedMotion, renderPosition, setRotating, stopFrame],
  );

  const focusIndex = useCallback(
    (index: number) => {
      focusPosition(
        closestPositionForIndex(index, positionRef.current, guests.length),
      );
    },
    [focusPosition, guests.length],
  );

  const resume = useCallback(() => {
    focusTweenRef.current?.kill();
    setIsFocusing(false);
    setRotating(true);
  }, [setRotating]);

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    wasRotatingOnPointerDownRef.current = rotatingRef.current;
    stopFrame();
    focusTweenRef.current?.kill();
    setIsFocusing(false);
    setRotating(false);
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: positionRef.current,
      startedOnCard:
        event.target instanceof Element &&
        Boolean(event.target.closest(".st2-guest-card")),
      axis: "",
    };
    didDragRef.current = false;
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
    if (pointer.axis === "y") {
      didDragRef.current = true;
      return;
    }
    if (pointer.axis !== "x") return;

    didDragRef.current = Math.abs(dx) > 8;
    positionRef.current = pointer.startPosition - dx / cardStep();
    renderPosition(positionRef.current);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (pointer.id !== event.pointerId) return;

    setDragging(false);
    pointerRef.current.id = -1;

    if (pointer.axis === "x" && didDragRef.current) {
      focusPosition(Math.round(positionRef.current));
    } else if (
      wasRotatingOnPointerDownRef.current &&
      (pointer.axis === "y" || !pointer.startedOnCard)
    ) {
      resume();
    }

    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const autoRunning =
    isRotating && !reducedMotion && inView && pageVisible && guests.length > 1;

  return (
    <div
      className={`st2-guest-stage${dragging ? " is-dragging" : ""}${autoRunning ? " is-rotating" : ""}${isFocusing ? " is-focusing" : ""}`}
      ref={stageRef}
      data-st2-guest-stage
      data-active-index={activeIndex}
      data-rotating={autoRunning ? "true" : "false"}
      data-cycle-seconds={FULL_CYCLE_SECONDS}
      role="region"
      aria-roledescription="carousel"
      aria-label="Гости STATUS TEAM"
      aria-describedby="st2-guest-instructions"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          focusIndex(activeIndex - 1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          focusIndex(activeIndex + 1);
        }
      }}
    >
      <p className="sr-only" id="st2-guest-instructions">
        Карусель вращается автоматически. Выберите гостя, чтобы остановить его в центре.
        Повторное нажатие на центральную карточку возобновит вращение.
      </p>

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
            const isActive = index === activeIndex;
            const guestNumber = String(index + 1).padStart(2, "0");
            const currentDepth = interpolateDepth(
              shortestOffset(index, positionRef.current, guests.length),
            );
            const isFrozenActive = !isRotating && !isFocusing && isActive;

            return (
              <div
                className={`st2-guest${isActive ? " is-active" : ""}`}
                key={guest.label}
                ref={(card) => {
                  cardRefs.current[index] = card;
                }}
                role="listitem"
                style={currentDepth}
                aria-hidden={currentDepth.visibility === "hidden"}
                data-st2-guest
              >
                <button
                  className="st2-guest-card"
                  type="button"
                  aria-label={
                    isFrozenActive
                      ? `${guest.label}. Возобновить вращение`
                      : `${guest.label}. Показать в центре и остановить`
                  }
                  aria-current={isActive ? "true" : undefined}
                  tabIndex={currentDepth.visibility === "hidden" ? -1 : 0}
                  onClick={() => {
                    if (didDragRef.current) return;

                    if (
                      isFrozenActive &&
                      !wasRotatingOnPointerDownRef.current
                    ) {
                      resume();
                    } else {
                      focusIndex(index);
                    }
                    wasRotatingOnPointerDownRef.current = false;
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
