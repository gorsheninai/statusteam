"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The world of the show, as an editorial index rather than a card grid.
 * One row opens at a time; the rule under the open row carries the
 * burgundy. No participant names are listed — none are confirmed.
 */
const ROLES = [
  {
    n: "01",
    title: "Модели",
    en: "Casting",
    body: "Открытый кастинг по всей России. На подиум выходят и опытные модели, и девушки без коммерческого опыта — отбор идёт по фактуре, пластике и характеру.",
  },
  {
    n: "02",
    title: "Дизайнеры и бренды",
    en: "Designers",
    body: "Коллекции белья, аксессуаров и сценических образов. Каждый бренд получает собственный выход и отдельную визуальную сцену внутри показа.",
  },
  {
    n: "03",
    title: "Артисты и перформеры",
    en: "Performance",
    body: "Показ идёт как цельная постановка: хореография, вокал и живые сцены между выходами. Подиум работает как сцена, а не как коридор.",
  },
  {
    n: "04",
    title: "Постановочная команда",
    en: "Production",
    body: "Режиссура, свет, звук, стилисты, визажисты и продакшн-команда STATUS TEAM. Съёмочная группа работает весь вечер — от backstage до финального выхода.",
  },
];

export default function Participants() {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();

  return (
    <ul className="roles">
      {ROLES.map((r, i) => {
        const isOpen = open === i;
        return (
          <li key={r.n} className={`role ${isOpen ? "is-open" : ""}`}>
            <h3>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`role-${r.n}`}
              >
                <span className="role-n">{r.n}</span>
                <span className="role-title struct">{r.title}</span>
                <span className="role-en label">{r.en}</span>
                <span className="role-sign" aria-hidden="true" />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`role-${r.n}`}
                  className="role-body"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 0.8, 0.28, 1] }}
                >
                  <p>{r.body}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
