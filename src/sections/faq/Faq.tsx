"use client";
import { QA } from "@/content/faq";

import { useState } from "react";

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
