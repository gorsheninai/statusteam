"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT } from "@/lib/config";

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

const GUESTS = [
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

function LogoGrid({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className="st2-logo-grid" aria-label={label} data-st2-logo-grid>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
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

  const toggleSound = () => {
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
        src="/media/show-reel.mp4"
        poster="/media/show-reel-poster.webp"
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label="Афтермуви показа «Славянский взгляд»"
      />
      <button
        className="st2-sound"
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Включить звук афтермуви" : "Выключить звук афтермуви"}
        aria-pressed={!muted}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10v4h4l5 4V6L8 10H4Z" />
          {!muted && (
            <path d="M16 9.2c1.1 1.55 1.1 4.05 0 5.6M18.6 6.8c2.45 2.9 2.45 7.5 0 10.4" />
          )}
          {muted && <path d="m16.2 9.2 4.6 5.6m0-5.6-4.6 5.6" />}
        </svg>
        <span className="sr-only">{muted ? "Звук выключен" : "Звук включён"}</span>
      </button>
    </div>
  );
}

export default function StatusTeamScene() {
  return (
    <section className="st st-page-two" id="statusteam" data-bg="ink">
      <section className="st2-impact st2-shell" aria-labelledby="st2-impact-title">
        <div className="st2-impact-media">
          <ImpactVideo />
        </div>

        <div className="st2-impact-copy" data-st2-impact-copy>
          <p className="st2-kicker">Status Team</p>
          <h2 id="st2-impact-title">
            Создаём fashion-события, которые выходят за рамки обычного показа.
          </h2>
          <p className="st2-lead">
            Объединяем дизайнеров, моделей, медиа и зрителей в одном пространстве,
            где показ становится культурным событием.
          </p>

          <div className="st2-proof-groups">
            {CONTENT.pressLogos && (
              <div className="st2-proof-group" data-st2-proof>
                <h3>О нас говорили</h3>
                <LogoGrid items={PRESS_LOGOS} label="СМИ о STATUS TEAM" />
              </div>
            )}

            {CONTENT.brandLogos && (
              <div className="st2-proof-group" data-st2-proof>
                <h3>Вместе с нами</h3>
                <LogoGrid items={BRAND_LOGOS} label="Бренды, работавшие со STATUS TEAM" />
              </div>
            )}
          </div>
        </div>
      </section>

      {CONTENT.guests && (
        <section className="st2-vanguard st2-shell" aria-labelledby="st2-vanguard-title">
          <h2 id="st2-vanguard-title" data-st2-section-title>
            Среди гостей
          </h2>

          <div className="st2-guests" role="list" aria-label="Гости STATUS TEAM">
            {GUESTS.map((guest) => (
              <figure className="st2-guest" key={guest.label} role="listitem" data-st2-guest>
                <div className="st2-guest-media">
                  <img
                    src={`/media/${guest.img}-${guest.widths[1]}.webp`}
                    srcSet={`/media/${guest.img}-${guest.widths[0]}.webp ${guest.widths[0]}w, /media/${guest.img}-${guest.widths[1]}.webp ${guest.widths[1]}w`}
                    sizes="(min-width: 900px) 22vw, 46vw"
                    width={guest.widths[1]}
                    height={Math.round((guest.widths[1] * 4) / 3)}
                    alt={guest.alt}
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <figcaption>{guest.label}</figcaption>
              </figure>
            ))}
          </div>
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
