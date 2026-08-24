"use client";

import { useState } from "react";

const ITEMS = [
  {
    title: "Подиум-шоу",
    sub: "Новая коллекция вживую",
  },
  {
    title: "Live-перформанс",
    sub: "Музыка и постановка как часть шоу",
  },
  {
    title: "Гости и атмосфера",
    sub: "Вечер среди медийных лиц и индустрии",
  },
  {
    title: "Afterparty",
    sub: "Продолжение вечера",
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
