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
];

const STATS = [
  {
    value: 60,
    suffix: "K+",
    label: "человек в сообществе STATUS TEAM",
  },
  {
    value: 10,
    suffix: "M+",
    label: "просмотров контента каждый месяц",
  },
  {
    value: 2,
    suffix: "",
    label: "fashion-показ STATUS TEAM — после «Славянского взгляда»",
  },
  {
    value: 600,
    suffix: "+",
    label: "гостей на прошлом показе",
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

    video.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.18 },
    );

    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const watchVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted) void video.play().catch(() => {});
  };

  return (
    <div className="st2-video" ref={wrapRef} data-st2-impact-media>
      <video
        ref={videoRef}
        poster="/media/show-reel-poster.webp"
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label="Афтермуви показа «Славянский взгляд»"
      >
        <source src="/media/show-reel.webm" type="video/webm" />
        <source src="/media/show-reel.mp4" type="video/mp4" />
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
          {muted ? (
            <svg viewBox="0 0 20 20">
              <path d="m7.25 5.3 6.2 4.7-6.2 4.7V5.3Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20">
              <path d="M3.5 8.3v3.4h3l3.7 3V5.3l-3.7 3h-3Z" />
              <path d="M13 7.4c1.3 1.45 1.3 3.75 0 5.2" />
            </svg>
          )}
        </span>
        <span>Смотреть видео</span>
        <span className="sr-only">{muted ? "Звук выключен" : "Звук включён"}</span>
      </button>
    </div>
  );
}

export default function StatusTeamScene() {
  return (
    <section className="st st-page-two" id="statusteam" data-bg="ink">
      <section className="st2-impact" aria-labelledby="st2-impact-title">
        <ImpactVideo />

        <div className="st2-impact-copy" data-st2-impact-copy>
          <p className="st2-kicker">Status Team</p>
          <h2 id="st2-impact-title">
            Создаём fashion-события, которые выходят за рамки обычного показа.
          </h2>
          <p className="st2-lead">
            Объединяем дизайнеров, моделей, медиа и зрителей в одном пространстве,
            где показ становится культурным событием.
          </p>
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
            <h2 id="st2-vanguard-title">Среди гостей</h2>
            <p>VIP &amp; Front Row Attendees</p>
          </header>

          <GuestCarousel guests={GUESTS} />
        </section>
      )}

      <section className="st2-scale" aria-label="Масштаб STATUS TEAM в цифрах">
        <div className="st2-shell">
          <ul className="st2-stats">
            {STATS.map((stat) => (
              <li key={stat.label} data-st2-stat>
                <span className="st2-stat-number">
                  <span data-count={stat.value} data-suffix={stat.suffix}>
                    {stat.value}
                    {stat.suffix}
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
