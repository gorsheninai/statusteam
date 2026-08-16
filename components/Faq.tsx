"use client";

import { useState } from "react";

const QA: [string, string][] = [
  [
    "С какого возраста вход?",
    "Показ 18+. На входе потребуется документ, удостоверяющий личность.",
  ],
  [
    "Какой предусмотрен дресс-код?",
    "Evening / Cocktail attire. Главное — соответствовать эстетике вечера.",
  ],
  [
    "Где и во сколько проходит показ?",
    "Площадка Kinema, Москва. Сбор гостей в 19:00, начало показа в 20:00.",
  ],
  [
    "Как оформить возврат или передать билет?",
    "Возврат осуществляется по правилам билетного оператора до даты проведения шоу.",
  ],
  [
    "Разрешена ли профессиональная фотосъёмка?",
    "Съемка на смартфоны приветствуется. Профессиональная техника — строго по аккредитации для СМИ.",
  ],
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen((current) => (current === i ? null : i));

  return (
    <ul className="faq">
      {QA.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <li className={`faq-row ${isOpen ? "is-open" : ""}`} key={q}>
            <h3>
              <button
                className="faq-q"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
              >
                <span>{q}</span>
                <span className="faq-sign" aria-hidden="true">
                  <svg viewBox="0 0 20 20" focusable="false">
                    <path d="M3 10h14" />
                    <path d="M10 3v14" />
                  </svg>
                </span>
              </button>
            </h3>

            <div
              id={`faq-${i}`}
              className={`panel ${isOpen ? "is-open" : ""}`}
              aria-hidden={!isOpen}
            >
              <div className="panel-inner">
                <p>{a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
