"use client";

import { useState } from "react";

const QA: [string, string][] = [
  [
    "С какого возраста вход?",
    "Показ 18+. На входе потребуется документ, удостоверяющий личность.",
  ],
  [
    "Какой предусмотрен дресс-код?",
    "Evening / Cocktail attire. Строгих рамок нет — главное, соответствовать эстетике вечера.",
  ],
  [
    "Где и во сколько проходит показ?",
    "Площадка Kinema, Москва. Сбор гостей в 19:00, начало шоу в 20:00.",
  ],
  [
    "Как оформить возврат или передать билет?",
    "Возврат осуществляется по правилам билетного оператора до начала события.",
  ],
  [
    "Разрешена ли профессиональная фотосъёмка?",
    "Съемка на телефоны приветствуется. Профессиональное оборудование — строго по предварительной аккредитации для СМИ.",
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
                <span className="faq-sign" aria-hidden="true" />
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
