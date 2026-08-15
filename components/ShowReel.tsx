"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aftermovie of the previous show (СЛАВЯНСКИЙ ВЗГЛЯД).
 *
 * Bandwidth policy: the file is not in the DOM until someone asks for it, on
 * every screen size — the poster carries the block until then. A 5.7 MB
 * download that nobody chose is the fastest way to lose a phone visitor, and
 * the LCP budget for this page does not have room for it.
 *
 * Sound follows the same rule as the file: off until the visitor turns it on.
 */
export default function ShowReel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);

  /* Stop decoding work while the reel is off screen. */
  useEffect(() => {
    if (!active) return;
    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  const start = () => {
    setActive(true);
    setMuted(false);
    requestAnimationFrame(() => void videoRef.current?.play().catch(() => {}));
  };

  return (
    <div className="reel" ref={wrapRef}>
      <div className="media reel-media" data-cursor={active ? undefined : "PLAY"}>
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
          <button className="reel-play" onClick={start}>
            <span className="reel-play-dot" aria-hidden="true" />
            Смотреть афтермуви
          </button>
        )}

        {active && (
          <button
            className="reel-sound"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              const next = !muted;
              setMuted(next);
              v.muted = next;
              if (!next) void v.play().catch(() => {});
            }}
          >
            {muted ? "Включить звук" : "Выключить звук"}
          </button>
        )}
      </div>

      <div className="reel-meta">
        <span className="credit">Славянский взгляд / афтермуви</span>
        <span className="credit">46 сек</span>
      </div>
    </div>
  );
}
