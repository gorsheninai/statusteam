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
      <div className="preorder-summary">
        <p className="preorder-status label">
          <span className="preorder-status-mark" aria-hidden="true" />
          Билеты · {SHOW.city}
        </p>
        <h2 className="preorder-heading struct">
          <span>Предзаказ</span>
          <span>открыт</span>
        </h2>
        <p className="preorder-pending">
          Дата и площадка будут объявлены позже.
        </p>
      </div>

      <div className="preorder-action">
        <p className="preorder-copy">
          Оставьте контакт — пришлём ссылку на билеты до общего старта
          продаж.
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
          <p className="preorder-micro">Без оплаты</p>
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
                Имя и один удобный контакт. Мы сообщим дату, площадку и откроем
                доступ к билетам до начала общих продаж.
              </p>
              <ApplyForm kind="access" consent submitLabel="Оставить предзаказ" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
