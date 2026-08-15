"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * TODO: replace-content — the four promises of the evening. Imagery is
 * campaign material standing in for the real frames.
 */
const ITEMS = [
  {
    title: "Подиум-шоу",
    sub: "Новая коллекция вживую",
    img: "runway-walk",
    w: [700, 1200],
    alt: "Модель идёт по подиуму, в зале работают фотографы",
  },
  {
    title: "Live-перформанс",
    sub: "Музыка и постановка как часть шоу",
    img: "detail-profile",
    w: [500, 900],
    alt: "Профиль модели в тёплом контровом свете",
  },
  {
    title: "Гости и атмосфера",
    sub: "Вечер среди медийных лиц и индустрии",
    img: "detail-chains",
    w: [500, 900],
    alt: "Расшитые бисером цепочки на теле модели",
  },
  {
    /* TODO: confirm — если afterparty не будет, заменить пункт на
       «Съёмка и фотозона». */
    title: "Afterparty",
    sub: "Продолжение вечера",
    img: "detail-cuff",
    w: [500, 900],
    alt: "Массивный резной браслет и золотистая ткань",
  },
];

/**
 * What the evening actually is, as an index rather than four cards.
 *
 * On a desktop pointer the photograph is not in the layout at all: it rides
 * the cursor behind the type and fades between rows. On touch — and with
 * reduced motion, and with no JS — the same figures are simply in the flow,
 * so nothing is only reachable by hovering.
 */
export default function Experience() {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok) return;

    list.classList.add("is-trailing");

    const rows = gsap.utils.toArray<HTMLElement>(".exp-row", list);
    const setters = rows.map((row) => {
      const media = row.querySelector<HTMLElement>(".exp-media");
      if (!media) return null;
      /* Centre the frame on the pointer through the transform itself: x/y
         then carry pure viewport coordinates. */
      gsap.set(media, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.94 });
      /* Different durations per axis would look like drag; the same slow ease
         on both reads as weight behind the frame. */
      return {
        media,
        x: gsap.quickTo(media, "x", { duration: 0.62, ease: "power3.out" }),
        y: gsap.quickTo(media, "y", { duration: 0.62, ease: "power3.out" }),
      };
    });

    let active = -1;

    const onMove = (e: PointerEvent) => {
      const row = (e.target as HTMLElement | null)?.closest?.(
        ".exp-row",
      ) as HTMLElement | null;
      const index = row ? rows.indexOf(row) : -1;

      if (index !== active) {
        if (active > -1)
          gsap.to(setters[active]!.media, {
            autoAlpha: 0,
            scale: 0.94,
            duration: 0.35,
            ease: "power2.out",
          });
        if (index > -1) {
          const s = setters[index]!;
          /* Snap to the pointer before fading in, or the frame flies across
             the section from wherever it was left. */
          gsap.set(s.media, { x: e.clientX, y: e.clientY });
          gsap.to(s.media, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.45,
            ease: "power3.out",
          });
        }
        active = index;
      }

      if (active > -1) {
        setters[active]!.x(e.clientX);
        setters[active]!.y(e.clientY);
      }
    };

    const onLeave = () => {
      if (active > -1)
        gsap.to(setters[active]!.media, {
          autoAlpha: 0,
          scale: 0.94,
          duration: 0.3,
        });
      active = -1;
    };

    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerleave", onLeave);

    return () => {
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
      list.classList.remove("is-trailing");
      setters.forEach((s) => s && gsap.set(s.media, { clearProps: "all" }));
    };
  }, []);

  return (
    <ul className="exp-list" ref={listRef}>
      {ITEMS.map((it) => (
        <li className="exp-row" key={it.title} data-reveal="up">
          <div className="exp-line">
            <span className="exp-title struct">{it.title}</span>
            <span className="exp-sub">{it.sub}</span>
          </div>

          <figure className="exp-media">
            <div className="media">
              <img
                src={`/media/${it.img}-${it.w[1]}.webp`}
                srcSet={`/media/${it.img}-${it.w[0]}.webp ${it.w[0]}w, /media/${it.img}-${it.w[1]}.webp ${it.w[1]}w`}
                sizes="(max-width: 1023px) 90vw, 26vw"
                alt={it.alt}
                loading="lazy"
              />
            </div>
          </figure>
        </li>
      ))}
    </ul>
  );
}
