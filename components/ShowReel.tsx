"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aftermovie of the previous show (СЛАВЯНСКИЙ ВЗГЛЯД).
 *
 * Bandwidth policy: the file is only attached to the DOM once it is
 * actually wanted — on wide screens when the section scrolls into view,
 * on small screens only when the visitor taps play. Nothing downloads
 * on page load; the poster carries the section until then.
 */
export default function ShowReel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const wide = window.matchMedia("(min-width: 1024px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!wide.matches || calm.matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
