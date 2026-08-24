"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT } from "@/lib/config";
import GuestCarousel, { type GuestCarouselItem } from "@/components/GuestCarousel";

const PRESS_LOGOS = [
  "MEDIA 01",
  "MEDIA 02",
  "MEDIA 03",
  "MEDIA 04",
  "MEDIA 05",
  "MEDIA 06",
];

const BRAND_LOGOS = [
  "PARTNER 01",
  "PARTNER 02",
  "PARTNER 03",
  "PARTNER 04",
  "PARTNER 05",
  "PARTNER 06",
];

const GUESTS: GuestCarouselItem[] = [
  {
    img: "archive-flower-crown",
    widths: [700, 1200],
    label: "Гость 01",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "archive-black-wings",
    widths: [700, 1200],
    label: "Гость 02",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "archive-backstage-bw",
    widths: [700, 1200],
    label: "Гость 03",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "archive-lineup",
    widths: [640, 1000],
    label: "Гость 04",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "runway-walk",
    widths: [700, 1200],
    label: "Гость 05",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "campaign-silver-portrait",
    widths: [800, 1400],
    label: "Гость 06",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "detail-profile",
    widths: [500, 900],
    label: "Гость 07",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
  {
    img: "poster-duo-dusk",
    widths: [600, 1000],
    label: "Гость 08",
    alt: "Временный кадр из предыдущего показа для будущего портрета гостя",
  },
];

const STATS = [
  {
    value: 60,
    suffix: "K+",
    label: "Комьюнити бренда",
  },
  {
    value: 10,
    suffix: "M+",
    label: "Ежемесячный охват",
  },
  {
    value: 2,
    suffix: "-й",
    label: "Масштабное шоу",
  },
  {
    value: 600,
    suffix: "+",
    label: "Избранных гостей",
  },
];

function LogoMarquee({
  items,
  label,
  reverse = false,
}: {
  items: string[];
  label: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`st2-marquee${reverse ? " is-reverse" : ""}`}
      role="group"
      aria-label={label}
      data-st2-marquee
    >
      <div className="st2-marquee-track">
        {[0, 1].map((copy) => (
          <ul className="st2-marquee-set" aria-hidden={copy === 1} key={copy}>
            {items.map((item) => (
              <li key={`${copy}-${item}`}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function ImpactVideo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const section = wrap.closest<HTMLElement>(".st2-impact") ?? wrap;

    /* Safari/iOS only grants hands-free playback when the element is already
       muted + inline at the instant play() is requested. Keep both the DOM
       attributes and JS properties in sync before any scroll-triggered call. */
    video.defaultMuted = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    if (video.readyState === 0) video.load();

    let active = false;
    let raf = 0;

    const requestPlay = () => {
      if (!active || document.visibilityState === "hidden") return;
      if (!video.paused && !video.ended) return;

      const attempt = video.play();
      if (attempt) {
        void attempt.catch(() => {
          /* iOS can reject an early request while the file is still moving
             from HAVE_NOTHING/HAVE_METADATA to HAVE_FUTURE_DATA. Scroll and
             readiness listeners below retry automatically. */
        });
      }
    };

    const syncPlayback = () => {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;

      /* Start slightly BEFORE page two reaches the viewport, so when the user
         scrolls the hero away the first visible frame is already moving rather
         than the poster sitting there for a beat. Keep it alive until page two
         has actually left the viewport. */
      const shouldRun = rect.top <= viewport * 1.15 && rect.bottom >= -viewport * 0.12;
      active = shouldRun;

      if (active) requestPlay();
      else video.pause();
    };

    const scheduleSync = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        syncPlayback();
      });
    };

    const observer = new IntersectionObserver(scheduleSync, {
      threshold: [0, 0.01, 0.08],
      rootMargin: "18% 0px 18% 0px",
    });

    const onReady = () => {
      syncPlayback();
      requestPlay();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncPlayback();
      else video.pause();
    };
    const onPageShow = () => syncPlayback();

    observer.observe(section);
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("canplaythrough", onReady);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    /* Resolve the initial state immediately as well as after layout settles. */
    syncPlayback();
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      syncPlayback();
    });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("canplaythrough", onReady);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const watchVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    /* This click is a real user gesture, so also resume the film here if iOS
       happened to suspend it while the page was settling. The button remains
       sound-only from the user's point of view: it never pauses the video. */
    if (video.paused) void video.play().catch(() => undefined);
  };

  return (
    <>
      <div className="st2-video" ref={wrapRef} data-st2-impact-media>
        <video
          ref={videoRef}
          poster="/media/show-reel-poster.webp"
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
          aria-label="Афтермуви показа «Славянский взгляд»"
        >
          <source src="/media/show-reel.mp4" type="video/mp4" />
          <source src="/media/show-reel.webm" type="video/webm" />
        </video>
        <button
          className={`st2-watch${muted ? "" : " is-active"}`}
          type="button"
          onClick={watchVideo}
          aria-label={muted ? "Включить звук афтермуви" : "Выключить звук афтермуви"}
          aria-pressed={!muted}
          data-st2-watch
        >
          <span className="st2-watch-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20">
              <path d="M3.5 8.3v3.4h3l3.7 3V5.3l-3.7 3h-3Z" />
              {muted ? (
                <path d="m12.8 7.5 3.7 5m0-5-3.7 5" />
              ) : (
                <path d="M13 7.4c1.3 1.45 1.3 3.75 0 5.2" />
              )}
            </svg>
          </span>
          <span>{muted ? "Включить звук" : "Выключить звук"}</span>
          <span className="sr-only">{muted ? "Звук выключен" : "Звук включён"}</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 899px) {
          .st-page-two .st2-watch {
            inset-block-start: calc(env(safe-area-inset-top) + 3.25rem);
            gap: 0.5rem;
            min-block-size: 2.5rem;
            padding: 0.42rem 0.75rem 0.42rem 0.5rem;
            font-size: 0.625rem;
            letter-spacing: 0.08em;
          }

          .st-page-two .st2-watch-icon {
            inline-size: 1.65rem;
            block-size: 1.65rem;
          }

          .st-page-two .st2-watch svg {
            inline-size: 0.82rem;
            block-size: 0.82rem;
          }
        }
      `}</style>
    </>
  );
}

export default function StatusTeamScene() {
  return (
    <section className="st st-page-two" id="statusteam" data-bg="ink">
      <section className="st2-impact" aria-labelledby="st2-impact-title">
        <ImpactVideo />

        <div className="st2-impact-copy" data-st2-impact-copy>
          <h2 id="st2-impact-title">
            <span className="st2-impact-primary">
              <span>Создаём fashion-события</span>
            </span>
            <span className="st2-impact-subgroup">
              <span className="st2-impact-tier2a">
                за рамками
                <span className="st2-impact-hairline" aria-hidden="true" />
              </span>
              <span className="st2-impact-tier2b">обычного показа</span>
            </span>
          </h2>
        </div>

        <div className="st2-proof-groups" data-st2-proof>
          {CONTENT.pressLogos && (
            <div className="st2-proof-group">
              <h3>О нас говорили</h3>
              <LogoMarquee items={PRESS_LOGOS} label="СМИ о STATUS TEAM" />
            </div>
          )}

          {CONTENT.brandLogos && (
            <div className="st2-proof-group">
              <h3>Вместе с нами</h3>
              <LogoMarquee
                items={BRAND_LOGOS}
                label="Бренды, работавшие со STATUS TEAM"
                reverse
              />
            </div>
          )}
        </div>
      </section>

      {CONTENT.guests && (
        <section className="st2-vanguard st2-shell" aria-labelledby="st2-vanguard-title">
          <header className="st2-vanguard-head" data-st2-section-title>
            <h2 id="st2-vanguard-title">Предыдущий показ</h2>
            <span className="st2-vanguard-tag">«Славянский взгляд»</span>
          </header>

          <GuestCarousel guests={GUESTS} />
        </section>
      )}

      <section className="st2-scale" aria-label="Масштаб STATUS TEAM в цифрах">
        <div className="st2-shell st2-scale-shell" data-st2-stats-band>
          <ul className="st2-stats">
            {STATS.map((stat) => (
              <li key={stat.label} data-st2-stat>
                <span className="st2-stat-number">
                  <span className="st2-stat-figure">
                    <span data-count={stat.value} data-st2-count>
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="st2-stat-suffix" data-st2-stat-suffix>
                        {stat.suffix}
                      </span>
                    )}
                    <span
                      className="st2-stat-sheen"
                      data-st2-stat-sheen
                      aria-hidden="true"
                    />
                  </span>
                </span>
                <span className="st2-stat-label">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
