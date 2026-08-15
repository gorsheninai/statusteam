"use client";

import { useEffect, useMemo, useState } from "react";
import LeadForm from "@/components/LeadForm";

// TODO: replace-content — switch this flag and URL when ticket sales open.
const TICKET_SALES_OPEN = false;
const TICKET_URL = "#tickets";

// TODO: set-deadline — replace with the real end of the active pricing wave.
const ACTIVE_WAVE_DEADLINE = "2026-09-01T23:59:59+03:00";

// TODO: replace-content — names, benefits and prices are placeholders.
const TICKETS = [
  { name: "STANDARD", note: "Место в зале", price: "— ₽" },
  { name: "PREMIUM", note: "Ближние ряды · welcome drink", price: "— ₽" },
  { name: "FRONT ROW / VIP", note: "Первый ряд · лаунж · afterparty", price: "— ₽" },
];

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const target = new Date(deadline).getTime();
    const update = () => setRemaining(Math.max(0, target - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  return useMemo(() => {
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  }, [remaining]);
}

export default function TicketsScene() {
  const [accessOpen, setAccessOpen] = useState(false);
  const time = useCountdown(ACTIVE_WAVE_DEADLINE);

  return (
    <section className="scene tickets-v4" id="tickets" data-bg="#100d0c">
      <div className="tickets-v4-bg" aria-hidden="true">
        {/* TODO: replace-content */}
        <img src="/media/poster-key-art-1000.webp" alt="" loading="lazy" />
      </div>
      <div className="tickets-v4-scrim" aria-hidden="true" />

      <div className="shell tickets-v4-inner">
        <div className="tickets-v4-head">
          <p className="scene-kicker">БИЛЕТЫ</p>
          <h2 className="display-title display-title-tight" data-reveal-heading>
            <span className="reveal-mask"><span>ПУЛЬС</span></span>
            <span className="reveal-mask"><span>КОНТИНЕНТА</span></span>
          </h2>
          <div className="tickets-v4-meta">
            <strong>07 НОЯБРЯ 2026</strong>
            <span>KINEMA · МОСКВА</span>
          </div>
        </div>

        <div className="ticket-cards">
          {TICKETS.map((ticket) => (
            <article className="ticket-card" key={ticket.name} data-tilt>
              <div className="ticket-card-glow" aria-hidden="true" />
              <span className="ticket-card-index">TICKET</span>
              <h3>{ticket.name}</h3>
              <p>{ticket.note}</p>
              <strong>{ticket.price}</strong>
            </article>
          ))}
        </div>

        <div className="ticket-wave">
          <div className="ticket-wave-track" aria-label="Волны продаж">
            <strong className="is-active">EARLY BIRD</strong>
            <span>→</span>
            <strong>REGULAR</strong>
            <span>→</span>
            <strong>LAST CALL</strong>
          </div>
          <div className="ticket-countdown" aria-label="До конца текущей волны">
            {[ [time.days, "дн"], [time.hours, "ч"], [time.minutes, "мин"], [time.seconds, "сек"] ].map(([value, label]) => (
              <div key={String(label)}>
                <b>{String(value).padStart(2, "0")}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ticket-conversion">
          {TICKET_SALES_OPEN ? (
            <a className="v4-button v4-button-gold v4-button-xl" href={TICKET_URL} data-magnetic>
              КУПИТЬ БИЛЕТ <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <button
              className="v4-button v4-button-gold v4-button-xl"
              type="button"
              onClick={() => setAccessOpen((value) => !value)}
              aria-expanded={accessOpen}
              data-magnetic
            >
              ПОЛУЧИТЬ ДОСТУП ПЕРВЫМ <span aria-hidden="true">↗</span>
            </button>
          )}

          {!TICKET_SALES_OPEN && (
            <div className={`ticket-access ${accessOpen ? "is-open" : ""}`}>
              <div><LeadForm kind="access" /></div>
            </div>
          )}

          <div className="ticket-newsletter">
            <strong>УЗНАВАТЬ НОВОСТИ ПОКАЗА</strong>
            <LeadForm kind="newsletter" compact />
          </div>
        </div>

        <div className="ticket-posters" aria-label="Афиши показа">
          {[
            ["poster-key-art", "Афиша Пульс Континента"],
            ["poster-train", "Афиша с моделью и шлейфом"],
            ["poster-duo-dusk", "Афиша с двумя моделями"],
          ].map(([image, alt], index) => (
            <figure key={image} style={{ "--poster-rotation": `${[-3, 0, 3][index]}deg` } as React.CSSProperties}>
              <img
                src={`/media/${image}-1000.webp`}
                srcSet={`/media/${image}-600.webp 600w, /media/${image}-1000.webp 1000w`}
                sizes="(max-width: 760px) 76vw, 30vw"
                alt={alt}
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
