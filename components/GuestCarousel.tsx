"use client";

import gsap from "gsap";
import {
  type CSSProperties,
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

const FOCUS_DURATION_SECONDS = 0.52;

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
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const focusTweenRef = useRef<gsap.core.Tween | null>(null);
  const positionRef = useRef(0);
  const activeIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocusing, setIsFocusing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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
        if (button) button.tabIndex = depth.visibility === "hidden" ? -1 : 0;
      });

      if (nextActive !== activeIndexRef.current) {
        activeIndexRef.current = nextActive;
        setActiveIndex(nextActive);
      }
    },
    [guests.length],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    renderPosition(positionRef.current);
  }, [renderPosition]);

  useEffect(
    () => () => {
      focusTweenRef.current?.kill();
    },
    [],
  );

  const focusPosition = useCallback(
    (targetPosition: number) => {
      focusTweenRef.current?.kill();

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
    [reducedMotion, renderPosition],
  );

  const focusIndex = useCallback(
    (index: number) => {
      if (!guests.length) return;
      focusPosition(
        closestPositionForIndex(index, positionRef.current, guests.length),
      );
    },
    [focusPosition, guests.length],
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      if (isFocusing || guests.length < 2) return;
      focusIndex(activeIndexRef.current + direction);
    },
    [focusIndex, guests.length, isFocusing],
  );

  return (
    <>
      <div
        className={`st2-guest-stage${isFocusing ? " is-focusing" : ""}`}
        ref={stageRef}
        data-st2-guest-stage
        data-active-index={activeIndex}
        data-rotating="false"
        role="region"
        aria-roledescription="carousel"
        aria-label="Кадры предыдущего показа «Славянский взгляд»"
        aria-describedby="st2-guest-instructions"
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
        <p className="sr-only" id="st2-guest-instructions">
          Карусель не вращается автоматически. Используйте стрелки слева и справа,
          чтобы посмотреть следующий или предыдущий кадр.
        </p>

        <div className="st2-guest-viewport">
          <div className="st2-guest-track" role="list">
            {guests.map((guest, index) => {
              const isActive = index === activeIndex;
              const currentDepth = interpolateDepth(
                shortestOffset(index, positionRef.current, guests.length),
              );

              return (
                <div
                  className={`st2-guest${isActive ? " is-active" : ""}`}
                  key={guest.label}
                  ref={(card) => {
                    cardRefs.current[index] = card;
                  }}
                  role="listitem"
                  data-st2-guest-index={index}
                  style={currentDepth}
                  aria-hidden={currentDepth.visibility === "hidden"}
                  data-st2-guest
                >
                  <button
                    className="st2-guest-card"
                    type="button"
                    aria-label={`${guest.label}. Показать в центре`}
                    aria-current={isActive ? "true" : undefined}
                    tabIndex={currentDepth.visibility === "hidden" ? -1 : 0}
                    onClick={() => focusIndex(index)}
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

        <div className="st2-guest-nav" aria-label="Навигация по кадрам">
          <button
            className="st2-guest-nav-button is-prev"
            type="button"
            onClick={() => step(-1)}
            disabled={isFocusing}
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
            disabled={isFocusing}
            aria-label="Следующий кадр"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        /* One continuous archive chapter: previous-show imagery first, then
           the scale metrics, with no hard colour seam between the two. */
        .st-page-two .st2-vanguard::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inset-inline-start: 50%;
          z-index: -2;
          inline-size: 100vw;
          transform: translateX(-50%);
          pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 44%, rgba(104, 11, 38, 0.62) 0%, rgba(65, 8, 26, 0.48) 30%, rgba(38, 7, 18, 0.32) 56%, transparent 78%),
            linear-gradient(180deg, #090707 0%, #16080d 16%, #2c0914 43%, #220910 68%, #19080d 86%, #16080d 100%);
        }

        .st-page-two .st2-scale {
          margin-block-start: 0 !important;
          padding-block: 0 !important;
          background:
            linear-gradient(180deg, #16080d 0%, #13090c 36%, #0f090a 66%, #090909 100%) !important;
        }

        .st-page-two .st2-scale-shell {
          border: 0 !important;
          background: transparent !important;
        }

        .st-page-two .st2-guest-stage {
          isolation: isolate;
        }

        .st-page-two .st2-guest-viewport {
          cursor: default !important;
          touch-action: pan-y !important;
        }

        .st-page-two .st2-guest-nav {
          position: absolute;
          inset: 0;
          z-index: 90;
          pointer-events: none;
        }

        .st-page-two .st2-guest-nav-button {
          position: absolute;
          inset-block-start: 50%;
          display: grid;
          place-items: center;
          inline-size: 3rem;
          block-size: 3rem;
          padding: 0;
          border: 1px solid rgba(198, 168, 124, 0.72);
          border-radius: 2px;
          color: rgba(255, 255, 255, 0.94);
          background: rgba(45, 8, 19, 0.72);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          transform: translateY(-50%);
          pointer-events: auto;
          cursor: pointer;
          transition: color 220ms ease, background-color 220ms ease, border-color 220ms ease, opacity 220ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .st-page-two .st2-guest-nav-button.is-prev {
          inset-inline-start: max(0.35rem, env(safe-area-inset-left));
        }

        .st-page-two .st2-guest-nav-button.is-next {
          inset-inline-end: max(0.35rem, env(safe-area-inset-right));
        }

        .st-page-two .st2-guest-nav-button svg {
          inline-size: 1.25rem;
          block-size: 1.25rem;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.35;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .st-page-two .st2-guest-nav-button:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .st-page-two .st2-guest-nav-button:focus-visible {
          outline: 1px solid var(--st2-champagne);
          outline-offset: 3px;
        }

        @media (hover: hover) and (pointer: fine) {
          .st-page-two .st2-guest-nav-button:not(:disabled):hover {
            color: var(--st2-ink);
            border-color: var(--st2-champagne);
            background: var(--st2-champagne);
          }
        }

        @media (max-width: 899px) {
          .st-page-two .st2-vanguard {
            padding-block-end: 0 !important;
          }

          /* The mobile heading remains one deliberate editorial line. */
          .st-page-two .st2-vanguard-head h2 {
            font-size: clamp(2.05rem, 9vw, 2.35rem) !important;
            line-height: 1 !important;
            letter-spacing: -0.055em !important;
            white-space: nowrap !important;
            text-wrap: nowrap !important;
          }

          /* Compact the technical viewport without reintroducing the clipped
             top-border bug: 1.6rem remains larger than the active card's
             scale bleed on current mobile widths. */
          .st-page-two .st2-guest-viewport {
            block-size: min(30.4rem, calc(106vw + 1.8rem)) !important;
          }

          .st-page-two .st2-guest {
            inset-block-start: 1.6rem !important;
          }

          .st-page-two .st2-guest-nav-button {
            inline-size: 2.875rem;
            block-size: 2.875rem;
          }

          .st-page-two .st2-guest-nav-button.is-prev {
            inset-inline-start: 0.2rem;
          }

          .st-page-two .st2-guest-nav-button.is-next {
            inset-inline-end: 0.2rem;
          }

          /* Pull the metrics directly into the archive chapter instead of
             leaving a large empty technical tail under the carousel. */
          .st-page-two .st2-scale-shell {
            padding-block-start: 1.6rem !important;
            padding-block-end: 3rem !important;
            border: 0 !important;
          }

          .st-page-two .st2-stats {
            row-gap: 0.75rem !important;
          }

          .st-page-two .st2-stats li {
            padding-block: 0.5rem !important;
          }
        }
      `}</style>
    </>
  );
}
