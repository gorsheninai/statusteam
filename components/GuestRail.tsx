"use client";

import { useRef, useState } from "react";

// TODO: replace-content — replace every placeholder guest with a real invited guest.
const GUESTS = [
  { name: "Гость 01", image: "/media/archive-lineup-1600.webp" },
  { name: "Гость 02", image: "/media/archive-backstage-bw-1200.webp" },
  { name: "Гость 03", image: "/media/archive-black-wings-1200.webp" },
  { name: "Гость 04", image: "/media/archive-flower-crown-1200.webp" },
  { name: "Гость 05", image: "/media/campaign-silver-portrait-1400.webp" },
];

export default function GuestRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const [dragging, setDragging] = useState(false);

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;
    if (!rail) return;
    setDragging(true);
    startX.current = event.clientX;
    startScroll.current = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = startScroll.current - (event.clientX - startX.current) * 1.15;
  }

  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    setDragging(false);
    railRef.current?.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      className={`guest-rail ${dragging ? "is-dragging" : ""}`}
      ref={railRef}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => setDragging(false)}
      data-cursor="DRAG"
      aria-label="Среди гостей предыдущего показа"
    >
      {GUESTS.map((guest, index) => (
        <figure className="guest-card" key={`${guest.name}-${index}`}>
          <img src={guest.image} alt="Фото гостя предыдущего показа STATUS TEAM" loading="lazy" draggable={false} />
          <figcaption>{guest.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
