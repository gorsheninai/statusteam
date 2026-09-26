"use client";

import { useState } from "react";

const ITEMS = [
  {
    title: "Подиум-шоу",
    sub: "Модели представят коллекции в четырёх тематических блоках: «Земля», «Огонь», «Тень» и «Ритм». Каждый блок покажет новый образ женственности — от лёгкого и природного до сильного и свободного.",
  },
  {
    title: "Live-перформанс",
    sub: "Живое музыкальное выступление с ритмами барабанов станет частью шоу и задаст темп происходящему на подиуме.",
  },
  {
    title: "Гости и атмосфера",
    sub: "В одном зале встретятся представители моды, бьюти-индустрии, бизнеса и медиа. Атмосферу вечера создадут подиум, музыка и визуальная эстетика «Пульса континента».",
  },
  {
    title: "Afterparty",
    sub: "Продолжение вечера после показа — время пообщаться, разделить впечатления и остаться в атмосфере шоу.",
  },
];

export default function Experience() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="exp-accordion">
      {ITEMS.map((item, index) => {
        const isOpen = open === index;
        const panelId = `experience-panel-${index}`;

        return (
          <section className={`exp-item${isOpen ? " is-open" : ""}`} key={item.title}>
            <button
              className="exp-trigger"
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              <span className="exp-title">{item.title}</span>
              <span className="exp-toggle" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>

            <div className="exp-panel" id={panelId} aria-hidden={!isOpen}>
              <div className="exp-panel-inner">
                <p className="exp-sub">{item.sub}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
