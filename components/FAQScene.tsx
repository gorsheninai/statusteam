"use client";

import { useState } from "react";

// TODO: replace-content — replace placeholder answers after event rules are confirmed.
const FAQ = [
  ["С какого возраста вход?", "Вход на событие — 18+. Возьмите документ, подтверждающий возраст."],
  ["Есть ли дресс-код?", "Дресс-код будет опубликован ближе к дате показа."],
  ["Можно ли вернуть билет?", "Условия возврата будут указаны на странице билетного оператора."],
  ["Как добраться / есть ли парковка?", "Точный маршрут и информация о парковке появятся после финального подтверждения схемы площадки."],
  ["Можно ли снимать в зале?", "Личная съёмка на телефон разрешена, профессиональная съёмка — по аккредитации."],
  ["Во сколько начало и сколько длится показ?", "Тайминг вечера будет опубликован ближе к событию."],
];

export default function FAQScene() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="scene faq-v4" id="faq" data-bg="#100d0c">
      <div className="shell faq-v4-inner">
        <p className="scene-kicker">FAQ</p>
        <h2 className="display-title display-title-compact" data-reveal-heading>
          <span className="reveal-mask"><span>ВАЖНО</span></span>
          <span className="reveal-mask"><span>ПЕРЕД ПОКАЗОМ</span></span>
        </h2>

        <div className="faq-list">
          {FAQ.map(([question, answer], index) => {
            const active = open === index;
            return (
              <article className={`faq-item ${active ? "is-open" : ""}`} key={question}>
                <button
                  type="button"
                  onClick={() => setOpen(active ? null : index)}
                  aria-expanded={active}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{question}</span>
                  <i aria-hidden="true">+</i>
                </button>
                <div className="faq-answer" id={`faq-answer-${index}`}>
                  <div><p>{answer}</p></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
