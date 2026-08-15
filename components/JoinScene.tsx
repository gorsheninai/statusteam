"use client";

import { useState } from "react";
import ApplyForm from "@/components/ApplyForm";
import LeadForm from "@/components/LeadForm";

type Zone = "model" | "brand" | "media";

const ZONES: Array<{
  id: Zone;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
}> = [
  {
    id: "model",
    eyebrow: "MODEL",
    title: "Я МОДЕЛЬ",
    text: "Подиум. Съёмка. Команда STATUS TEAM.",
    image: "/media/campaign-silver-portrait-1400.webp",
  },
  {
    id: "brand",
    eyebrow: "BRAND",
    title: "Я БРЕНД / ПАРТНЁР",
    text: "Интеграция в шоу, контент и аудитория STATUS TEAM.",
    image: "/media/archive-lineup-1600.webp",
  },
  {
    id: "media",
    eyebrow: "MEDIA",
    title: "Я СМИ / БЛОГЕР",
    text: "Аккредитация на показ.",
    image: "/media/archive-backstage-bw-1200.webp",
  },
];

export default function JoinScene() {
  const [open, setOpen] = useState<Zone | null>(null);

  return (
    <section className="scene join-v4" id="join" data-bg="#17120f">
      <div className="shell join-v4-head">
        <p className="scene-kicker">УЧАСТИЕ</p>
        <h2 className="display-title" data-reveal-heading>
          <span className="reveal-mask"><span>СТАТЬ ЧАСТЬЮ</span></span>
          <span className="reveal-mask"><span>ПУЛЬСА</span></span>
        </h2>
      </div>

      <div className="join-zones">
        {ZONES.map((zone) => {
          const active = open === zone.id;
          return (
            <article className={`join-zone ${active ? "is-open" : ""}`} key={zone.id}>
              <button
                className="join-zone-trigger"
                type="button"
                onClick={() => setOpen(active ? null : zone.id)}
                aria-expanded={active}
              >
                <img src={zone.image} alt="" loading="lazy" aria-hidden="true" />
                <span className="join-zone-scrim" aria-hidden="true" />
                <span className="join-zone-copy">
                  <small>{zone.eyebrow}</small>
                  <strong>{zone.title}</strong>
                  <span>{zone.text}</span>
                </span>
                <span className="join-zone-plus" aria-hidden="true">+</span>
              </button>

              <div className="join-zone-detail">
                <div>
                  {zone.id === "model" && (
                    <>
                      <ol className="join-process">
                        <li><b>01</b><span>Заявка с параметрами и снэпами</span></li>
                        <li><b>02</b><span>Онлайн-отбор</span></li>
                        <li><b>03</b><span>Очный кастинг</span></li>
                      </ol>
                      <ApplyForm kind="casting" />
                    </>
                  )}

                  {zone.id === "brand" && (
                    <>
                      <ul className="join-formats">
                        <li><b>КОЛЛЕКЦИЯ</b><span>Отдельный выход бренда</span></li>
                        <li><b>ИНТЕГРАЦИЯ</b><span>Присутствие внутри события</span></li>
                        <li><b>МЕДИА</b><span>Контент показа и публикации</span></li>
                      </ul>
                      <ApplyForm kind="partner" />
                    </>
                  )}

                  {zone.id === "media" && (
                    <>
                      {/* TODO: replace-content — accreditation requirements can be refined later. */}
                      <p className="join-media-note">Для редакций, фотографов, блогеров и медиа-площадок.</p>
                      <LeadForm kind="media" />
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
