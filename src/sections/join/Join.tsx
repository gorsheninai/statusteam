"use client";
import { ZONES } from "@/content/participation";
import { mediaFile } from "@/content/media";

import { useState } from "react";
import ApplyForm from "@/features/forms/ApplyForm";

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
                src={mediaFile(`${z.img}-${z.w[1]}.webp`)}
                srcSet={`${mediaFile(`${z.img}-${z.w[0]}.webp`)} ${z.w[0]}w, ${mediaFile(`${z.img}-${z.w[1]}.webp`)} ${z.w[1]}w`}
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
              <span className={`zone-title struct ${z.id === "brand" ? "zone-title-brand" : ""}`} id={`zone-${z.id}-t`}>
                {z.title}
              </span>
              <span className="zone-sub">{z.sub}</span>
              <span className="zone-sign" aria-hidden="true" />
            </button>

            <div
              id={`zone-${z.id}`}
              className={`panel ${isOpen ? "is-open" : ""}`}
              aria-hidden={!isOpen}
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
