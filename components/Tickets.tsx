"use client";

import { useState } from "react";
import ApplyForm from "./ApplyForm";
import { SALES_OPEN, SHOW, TICKETS_URL } from "@/lib/config";

/**
 * Until the date, venue and ticket inventory are confirmed this scene has one
 * honest job: collect intent. It therefore behaves as a single invitation,
 * not as a ticket shop with placeholder categories.
 */
export default function Tickets() {
  const [askOpen, setAskOpen] = useState(false);

  return (
    <div className={`preorder-card ${askOpen ? "is-open" : ""}`}>
      <div className="preorder-status label">
        <span className="preorder-status-mark" aria-hidden="true" />
        Предзаказ билетов
      </div>

      <div className="preorder-place">
        <span className="label">Место проведения</span>
        <p className="preorder-city struct">{SHOW.city}</p>
        <p className="preorder-pending">
          Дата и площадка будут объявлены позже.
        </p>
      </div>

      <div className="preorder-action">
        <p className="preorder-copy">
          Оставьте контакт, чтобы первыми получить доступ к билетам.
        </p>

        {SALES_OPEN && TICKETS_URL ? (
          <a
            className="btn btn-solid btn-buy"
            href={TICKETS_URL}
            data-magnetic
            rel="noopener"
          >
            Купить билет
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ) : (
          <button
            className="btn btn-solid btn-buy"
            type="button"
            data-magnetic
            aria-expanded={askOpen}
            aria-controls="ticket-access"
            onClick={() => setAskOpen((value) => !value)}
          >
            Оставить предзаказ
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        )}

        {!SALES_OPEN && (
          <p className="preorder-micro">
            Без оплаты. Сообщим о старте продаж раньше общего анонса.
          </p>
        )}
      </div>

      {!SALES_OPEN && (
        <div
          id="ticket-access"
          className={`panel preorder-panel ${askOpen ? "is-open" : ""}`}
          aria-hidden={!askOpen}
        >
          <div className="panel-inner">
            <div className="preorder-form">
              <p className="tickets-note">
                Оставьте контакт — мы пришлём дату, площадку и ссылку на
                билеты до начала открытых продаж.
              </p>
              <ApplyForm kind="access" consent submitLabel="Оставить предзаказ" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
