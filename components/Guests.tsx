"use client";

import { useEffect, useRef } from "react";

/**
 * TODO: replace-content — placeholder guests. Photographs are stills from the
 * previous show (СЛАВЯНСКИЙ ВЗГЛЯД, фото Паша Доренский) standing in until
 * the real guest portraits and names arrive.
 */
const GUESTS = [
  {
    img: "archive-flower-crown",
    w: [700, 1200],
    name: "Имя Фамилия",
    role: "гость показа",
    alt: "Модель в цветочном венке идёт по подиуму, за ней зрительный зал",
  },
  {
    img: "archive-black-wings",
    w: [700, 1200],
    name: "Имя Фамилия",
    role: "гость показа",
    alt: "Выход на подиум в образе с большими чёрными крыльями",
  },
  {
    img: "archive-backstage-bw",
    w: [700, 1200],
    name: "Имя Фамилия",
    role: "гость показа",
    alt: "Чёрно-белый кадр: модель в вуали перед выходом на подиум",
  },
  {
    img: "archive-lineup",
    w: [640, 1000],
    name: "Имя Фамилия",
    role: "гость показа",
    alt: "Финальный выход показа: модели на подиуме, за столами полный зал гостей",
  },
];

/**
 * The guest wall — dragged, not paged.
 *
 * The track is a real horizontal scroller, so it works with a finger, with a
 * trackpad, with the keyboard and with no JS at all. The pointer handler only
 * adds what the platform is missing on a desktop mouse: grab-and-throw, with
 * the throw decaying on its own frame loop rather than a physics library.
 */
export default function Guests() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let last = 0;
    let lastT = 0;
    let velocity = 0;
    let raf = 0;
    let moved = 0;

    const glide = () => {
      velocity *= 0.94;
      el.scrollLeft -= velocity;
      if (Math.abs(velocity) > 0.4) raf = requestAnimationFrame(glide);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      cancelAnimationFrame(raf);
      dragging = true;
      moved = 0;
      velocity = 0;
      startX = last = e.clientX;
      startLeft = el.scrollLeft;
      lastT = performance.now();
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;

      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = (e.clientX - last) / dt * 16;
      last = e.clientX;
      lastT = now;
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("is-dragging");
      el.releasePointerCapture?.(e.pointerId);
      if (Math.abs(velocity) > 1) raf = requestAnimationFrame(glide);
    };

    /* A throw that ends on a card must not also open it. */
    const onClick = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div
      className="guests"
      ref={ref}
      data-cursor="DRAG"
      tabIndex={0}
      role="group"
      aria-label="Гости показа — прокрутите вбок"
    >
      {GUESTS.map((g, i) => (
        <figure className="guest" key={`${g.img}-${i}`}>
          <div className="media">
            <img
              src={`/media/${g.img}-${g.w[1]}.webp`}
              srcSet={`/media/${g.img}-${g.w[0]}.webp ${g.w[0]}w, /media/${g.img}-${g.w[1]}.webp ${g.w[1]}w`}
              sizes="(max-width: 900px) 68vw, 26vw"
              alt={g.alt}
              loading="lazy"
              draggable={false}
            />
          </div>
          <figcaption>
            <b>{g.name}</b>
            <span className="credit">{g.role}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
