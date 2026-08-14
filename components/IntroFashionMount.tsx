"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FRAMES = [
  {
    src: "/media/campaign-silver-portrait-1400.webp",
    alt: "Портрет модели в серебряном головном уборе и украшениях",
  },
  {
    src: "/media/campaign-beaded-dusk-1400.webp",
    alt: "Модель в расшитом образе в тёплом вечернем свете",
  },
  {
    src: "/media/campaign-palms-gold-1400.webp",
    alt: "Модель в золотых украшениях среди пальмовых листьев",
  },
  {
    src: "/media/campaign-silhouette-drapes-1400.webp",
    alt: "Модель среди тёмных сценических драпировок",
  },
  {
    src: "/media/campaign-sand-drape-1400.webp",
    alt: "Модель среди скульптурных тканевых драпировок",
  },
];

function formatMetric(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function RailGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="intro-fashion-group" aria-hidden={hidden || undefined}>
      {FRAMES.map((frame, index) => (
        <figure
          className={`intro-fashion-card intro-fashion-card-${index + 1}`}
          key={`${hidden ? "copy" : "main"}-${frame.src}`}
        >
          <img src={frame.src} alt={hidden ? "" : frame.alt} loading="lazy" />
        </figure>
      ))}
    </div>
  );
}

function IntroFashion() {
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [followers, setFollowers] = useState(60_218);
  const [views, setViews] = useState(10_482_824);

  useEffect(() => {
    const node = metricsRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setActive(Boolean(entry?.isIntersecting)),
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!active || reduceMotion) return;

    let cancelled = false;
    let followersTimer: number | undefined;
    let viewsTimer: number | undefined;

    const tickFollowers = () => {
      followersTimer = window.setTimeout(() => {
        if (cancelled) return;
        setFollowers((value) => value + (Math.random() > 0.82 ? 2 : 1));
        tickFollowers();
      }, 2400 + Math.random() * 3200);
    };

    const tickViews = () => {
      viewsTimer = window.setTimeout(() => {
        if (cancelled) return;
        setViews((value) => value + 9 + Math.floor(Math.random() * 34));
        tickViews();
      }, 320 + Math.random() * 260);
    };

    tickFollowers();
    tickViews();

    return () => {
      cancelled = true;
      if (followersTimer !== undefined) window.clearTimeout(followersTimer);
      if (viewsTimer !== undefined) window.clearTimeout(viewsTimer);
    };
  }, [active]);

  return (
    <div className="intro-fashion" aria-label="Кампания и STATUS TEAM в цифрах">
      <div className="intro-fashion-top intro-fashion-top-visual-only">
        <div className="intro-fashion-carousel" aria-label="Кампания Пульс Континента">
          <div className="intro-fashion-rail">
            <RailGroup />
            <RailGroup hidden />
          </div>
        </div>
      </div>

      <div
        className="intro-fashion-metrics"
        aria-label="STATUS TEAM в цифрах"
        ref={metricsRef}
      >
        <div className="intro-fashion-metric intro-fashion-metric-live">
          <strong className="living-number-simple" key={`followers-${followers}`}>
            {formatMetric(followers)}
          </strong>
          <span>в сообществе STATUS TEAM</span>
        </div>
        <div className="intro-fashion-metric intro-fashion-metric-gold intro-fashion-metric-live">
          <strong className="living-number-simple living-number-views" key={`views-${views}`}>
            {formatMetric(views)}
          </strong>
          <span>просмотров контента</span>
        </div>
        <div className="intro-fashion-metric intro-fashion-metric-wine">
          <strong>2</strong>
          <span>fashion-показ STATUS TEAM</span>
        </div>
      </div>
    </div>
  );
}

export default function IntroFashionMount() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.querySelector<HTMLElement>(".manifest");
    setTarget(node);
  }, []);

  if (!target) return null;
  return createPortal(<IntroFashion />, target);
}
