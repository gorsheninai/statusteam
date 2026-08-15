"use client";

import { useEffect, useRef, useState } from "react";

/** The aftermovie file is attached only after a deliberate click. */
export default function ShowReel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.12 },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [active]);

  function start() {
    setActive(true);
    requestAnimationFrame(() => void videoRef.current?.play().catch(() => {}));
  }

  return (
    <div className="reel reel-v4" ref={wrapRef} data-cursor="PLAY">
      <div className="media reel-media">
        {active ? (
          <video
            ref={videoRef}
            src="/media/show-reel.mp4"
            poster="/media/show-reel-poster.webp"
            muted={muted}
            loop
            playsInline
            preload="metadata"
            aria-label="Афтермуви показа «Славянский взгляд»"
          />
        ) : (
          <img
            src="/media/show-reel-poster.webp"
            alt="Сцена показа «Славянский взгляд»: подиум, свет и зрительный зал"
            loading="lazy"
          />
        )}

        {!active && (
          <button className="reel-play" type="button" onClick={start}>
            <span className="reel-play-dot" aria-hidden="true" />
            PLAY AFTERMOVIE
          </button>
        )}

        {active && (
          <button
            className="reel-sound"
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              const next = !muted;
              setMuted(next);
              video.muted = next;
              if (!next) void video.play().catch(() => {});
            }}
          >
            {muted ? "ВКЛЮЧИТЬ ЗВУК" : "ВЫКЛЮЧИТЬ ЗВУК"}
          </button>
        )}
      </div>
    </div>
  );
}
