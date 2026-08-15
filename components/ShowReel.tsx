"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function ShowReel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  /* The previous STATUS TEAM version marked this block for a pinned GSAP
     zoom. The new art direction is one static editorial composition, so the
     marker must be gone before Motion's passive effect builds ScrollTriggers. */
  useLayoutEffect(() => {
    wrapRef.current?.closest("[data-reel-zoom]")?.removeAttribute("data-reel-zoom");
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    video.muted = true;
    void video.play().catch(() => {});

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
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
    <>
      <div className="st-topline" aria-label="Раздел 02, STATUS TEAM">
        <span>02 / STATUS TEAM</span>
        <span>ABOUT</span>
      </div>

      <p className="st-intro-copy" data-reveal="up">
        Создаём fashion-события, которые выходят за рамки обычного показа.
      </p>

      <div className="reel" ref={wrapRef} data-reveal="mask">
        <div className="media reel-media">
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
            className="reel-sound"
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Включить звук афтермуви" : "Выключить звук афтермуви"}
            aria-pressed={!muted}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 10v4h4l5 4V6L8 10H4Z" />
              {!muted && <path d="M16 9.2c1.1 1.55 1.1 4.05 0 5.6M18.6 6.8c2.45 2.9 2.45 7.5 0 10.4" />}
              {muted && <path d="m16.2 9.2 4.6 5.6m0-5.6-4.6 5.6" />}
            </svg>
            <span className="sr-only">{muted ? "Звук выключен" : "Звук включён"}</span>
          </button>
        </div>
      </div>

      <div className="reel-meta" aria-label="Информация об афтермуви">
        <div className="reel-meta-title">
          <span>ПРЕДЫДУЩИЙ ПОКАЗ</span>
          <b>СЛАВЯНСКИЙ ВЗГЛЯД</b>
        </div>
        <div className="reel-meta-sound" aria-hidden="true">
          <span>00:46</span>
          <span>SOUND</span>
          <span className="reel-wave">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </>
  );
}
