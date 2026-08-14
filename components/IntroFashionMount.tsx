"use client";

import { useEffect, useState } from "react";
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

      <div className="intro-fashion-metrics" aria-label="STATUS TEAM в цифрах">
        <div className="intro-fashion-metric">
          <strong>60K+</strong>
          <span>сообщество STATUS TEAM</span>
        </div>
        <div className="intro-fashion-metric intro-fashion-metric-gold">
          <strong>10M+</strong>
          <span>просмотров ежемесячно</span>
        </div>
        <div className="intro-fashion-metric intro-fashion-metric-wine">
          <strong>03</strong>
          <span>показ STATUS TEAM</span>
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
