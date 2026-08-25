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

const STATS: Array<{
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  pad?: number;
  inlineLabel?: boolean;
}> = [
  {
    value: 60000,
    label: "Сообщество STATUS TEAM",
  },
  {
    value: 10000000,
    label: "Ежемесячный охват",
  },
  {
    value: 600,
    label: "Гостей на предыдущем шоу",
  },
  {
    value: 2,
    label: "Масштабных шоу",
    inlineLabel: true,
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
        void attempt.catch(() => undefined);
      }
    };

    const syncPlayback = () => {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
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
          className={`st2-watch st2-watch-icon-only${muted ? "" : " is-active"}`}
          type="button"
          onClick={watchVideo}
          aria-label={muted ? "Включить звук афтермуви" : "Выключить звук афтермуви"}
          aria-pressed={!muted}
          data-st2-watch
        >
          <span className="st2-watch-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4.5 9.3v5.4h4.2l4.6 3.6V5.7L8.7 9.3H4.5Z" />
              {muted ? (
                <path d="m16.6 9 4.1 6m0-6-4.1 6" />
              ) : (
                <>
                  <path d="M16.4 9.1c1.35 1.6 1.35 4.2 0 5.8" />
                  <path d="M19.1 6.9c2.5 2.8 2.5 7.4 0 10.2" />
                </>
              )}
            </svg>
          </span>
          <span className="sr-only">{muted ? "Звук выключен" : "Звук включён"}</span>
        </button>
      </div>

      <style>{`
        .st-page-two .st2-watch.st2-watch-icon-only {
          inline-size: 3rem !important;
          block-size: 3rem !important;
          min-inline-size: 3rem !important;
          min-block-size: 3rem !important;
          padding: 0 !important;
          gap: 0 !important;
          border-radius: 999px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .st-page-two .st2-watch.st2-watch-icon-only .st2-watch-icon {
          inline-size: 100% !important;
          block-size: 100% !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
        }

        .st-page-two .st2-watch.st2-watch-icon-only svg {
          inline-size: 1.15rem !important;
          block-size: 1.15rem !important;
        }

        @media (max-width: 899px) {
          .st-page-two .st2-watch.st2-watch-icon-only {
            inset-block-start: calc(env(safe-area-inset-top) + 3.25rem);
            inline-size: 2.75rem !important;
            block-size: 2.75rem !important;
            min-inline-size: 2.75rem !important;
            min-block-size: 2.75rem !important;
          }

          .st-page-two .st2-watch.st2-watch-icon-only svg {
            inline-size: 1rem !important;
            block-size: 1rem !important;
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
          <header className="st2-scale-head">
            <h2 className="st2-scale-title">
              Масштаб в цифрах
            </h2>
          </header>

          <ul className="st2-stats">
            {STATS.map((stat) => (
              <li
                className={stat.inlineLabel ? "is-sentence" : undefined}
                key={stat.label}
                data-st2-stat
              >
                <span className="st2-stat-number">
                  {stat.prefix && (
                    <span className="st2-stat-prefix">{stat.prefix}</span>
                  )}
                  <span className="st2-stat-figure">
                    <span data-count={stat.value} data-pad={stat.pad} data-st2-count>
                      {stat.pad
                        ? String(stat.value).padStart(stat.pad, "0")
                        : stat.value.toLocaleString("ru-RU")}
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
                  {stat.inlineLabel && (
                    <span className="st2-stat-inline-label">{stat.label}</span>
                  )}
                </span>
                {!stat.inlineLabel && (
                  <span className="st2-stat-label">{stat.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
