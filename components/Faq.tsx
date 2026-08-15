"use client";

import { useState } from "react";

/**
 * TODO: replace-content — the six questions are the right six; every answer
 * below is a placeholder until the client confirms the real policy.
 */
const QA: [string, string][] = [
  [
    "С какого возраста вход?",
    "Показ 18+. На входе попросят документ, удостоверяющий личность.",
  ],
  [
    "Есть ли дресс-код?",
    "Дресс-код вечерний. Строгих требований нет — приходите в том, в чём хочется быть в кадре.",
  ],
  [
    "Можно ли вернуть билет?",
    "Возврат возможен по правилам билетного оператора. Точные условия появятся здесь вместе с открытием продаж.",
  ],
  [
    "Как добраться и есть ли парковка?",
    "Площадка — Kinema, Москва. Схема проезда и информация о парковке появятся ближе к дате показа.",
  ],
  [
    "Можно ли снимать в зале?",
    "Съёмка для себя разрешена. Профессиональная техника — только по аккредитации.",
  ],
  [
    "Во сколько начало и сколько длится показ?",
    "Сбор гостей с 19:00, показ начинается позже. Программа вечера занимает около трёх часов.",
  ],
];

export default function Faq() {
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) =>
    setOpen((cur) =>
      cur.includes(i) ? cur.filter((n) => n !== i) : [...cur, i],
    );

  return (
    <ul className="faq">
      {QA.map(([q, a], i) => {
        const isOpen = open.includes(i);
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
