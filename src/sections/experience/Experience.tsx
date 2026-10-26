"use client";
import { ITEMS } from "@/content/program";

import { useState } from "react";

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
