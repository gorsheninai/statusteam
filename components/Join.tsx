"use client";

import { useState } from "react";
import ApplyForm from "./ApplyForm";

const ZONES = [
  {
    id: "model",
    title: "Я модель",
    sub: "Подиум. Съёмка. Команда STATUS TEAM.",
    img: "campaign-silver-portrait",
    w: [800, 1400],
    h: 1738,
    alt: "Портрет модели в серебряном головном уборе и украшениях на фоне неба",
    intro: "Открытый кастинг. Опыт подиума желателен, но не обязателен — мы смотрим на фактуру, пластику и характер.",
    steps: [
      ["01", "Заявка с параметрами и снэпами"],
      ["02", "Онлайн-отбор и ответ на ваш контакт"],
      ["03", "Очный кастинг, примерка и репетиция"],
    ],
    form: "casting" as const,
  },
  {
    id: "brand",
    title: "Я бренд / партнёр",
    sub: "Интеграция в шоу, контент и аудитория STATUS TEAM.",
    img: "archive-lineup",
    w: [640, 1600],
    h: 1202,
    alt: "Финальный выход показа: модели на подиуме, за столами полный зал гостей",
    intro: "Три формата участия. Каждый собирается под задачу бренда.",
    steps: [
      ["Коллекция", "Отдельный выход с собственной сценой, светом и музыкой"],
      ["Интеграция", "Присутствие в зале, в зоне гостей и в съёмке вечера"],
      ["Медиа", "Контент показа: съёмка, афтермуви и публикации сообщества"],
    ],
    form: "partner" as const,
  },
  {
    id: "press",
    title: "Я СМИ / блогер",
    sub: "Аккредитация на показ.",
    img: "archive-backstage-bw",
    w: [700, 1200],
    h: 1800,
    alt: "Чёрно-белый кадр: модель в вуали перед выходом на подиум",
    intro: "Аккредитация открывается за месяц до показа. Заявку можно оставить сейчас.",
    steps: [
      ["Съёмка", "Работа в зале и в backstage по согласованию"],
      ["Материалы", "Пресс-кит, кадры показа и афтермуви"],
      ["Ответ", "Подтверждение приходит на указанный контакт"],
    ],
    form: "press" as const,
  },
];

/**
 * Three ways in, as three doors rather than three forms.
 *
 * Closed, the row is a set of statements. Opening one is a deliberate act —
 * the form is never in the way of someone who came here to read. On a desktop
 * pointer the hovered door widens and its photograph surfaces; the open one
 * takes the room it needs for a real form.
 */
export default function Join() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className={`zones ${open ? "has-open" : ""}`}>
      {ZONES.map((z) => {
        const isOpen = open === z.id;
        return (
          <section
            key={z.id}
            className={`zone ${isOpen ? "is-open" : ""}`}
            aria-labelledby={`zone-${z.id}-t`}
          >
            <div className="zone-media" aria-hidden="true">
              <img
                src={`/media/${z.img}-${z.w[1]}.webp`}
                srcSet={`/media/${z.img}-${z.w[0]}.webp ${z.w[0]}w, /media/${z.img}-${z.w[1]}.webp ${z.w[1]}w`}
                sizes="(max-width: 1023px) 100vw, 34vw"
                width={z.w[1]}
                height={z.h}
                alt=""
                loading="lazy"
              />
            </div>

            <button
              className="zone-head"
              onClick={() => setOpen(isOpen ? null : z.id)}
              aria-expanded={isOpen}
              aria-controls={`zone-${z.id}`}
            >
              <span className="zone-title struct" id={`zone-${z.id}-t`}>
                {z.title}
              </span>
              <span className="zone-sub">{z.sub}</span>
              <span className="zone-sign" aria-hidden="true" />
            </button>

            <div
              id={`zone-${z.id}`}
              className={`panel ${isOpen ? "is-open" : ""}`}
              aria-hidden={!isOpen}
              inert={!isOpen}
            >
              <div className="panel-inner">
                <p className="zone-intro">{z.intro}</p>

                <ol className="zone-steps">
                  {z.steps.map(([k, v]) => (
                    <li key={k}>
                      <b>{k}</b>
                      <span>{v}</span>
                    </li>
                  ))}
                </ol>

                <ApplyForm kind={z.form} consent={z.form === "press"} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
