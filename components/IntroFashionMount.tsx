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

const numberRu = new Intl.NumberFormat("ru-RU");

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

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    let followersTimer: ReturnType<typeof setTimeout> | undefined;
    let viewsTimer: ReturnType<typeof setTimeout> | undefined;

    const tickFollowers = () => {
      followersTimer = setTimeout(
        () => {
          if (cancelled) return;
          setFollowers((value) => value + (Math.random() > 0.82 ? 2 : 1));
          tickFollowers();
        },
        2400 + Math.random() * 3200,
      );
    };

    const tickViews = () => {
      viewsTimer = setTimeout(
        () => {
          if (cancelled) return;
          setViews((value) => value + 7 + Math.floor(Math.random() * 29));
          tickViews();
        },
        180 + Math.random() * 360,
      );
    };

    tickFollowers();
    tickViews();

    return () => {
      cancelled = true;
      if (followersTimer) clearTimeout(followersTimer);
      if (viewsTimer) clearTimeout(viewsTimer);
    };
  }, [active]);

  return (
    <div className="intro-fashion" aria-label="О концепции показа">
      <div className="intro-fashion-top">
        <div className="intro-fashion-copy">
          <h2>
            В центре —
            <br />
            женщина
          </h2>
          <p className="intro-fashion-lead">Сильная. Чувственная. Свободная.</p>
          <p className="intro-fashion-note">Она сама определяет правила.</p>
        </div>

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
          <strong>{numberRu.format(followers)}</strong>
          <span>в сообществе STATUS TEAM</span>
        </div>
        <div className="intro-fashion-metric intro-fashion-metric-gold intro-fashion-metric-live">
          <strong>{numberRu.format(views)}</strong>
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
    setTarget(document.querySelector<HTMLElement>(".manifest"));
  }, []);

  if (!target) return null;
  return createPortal(<IntroFashion />, target);
}
