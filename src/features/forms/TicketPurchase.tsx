"use client";

import { useState } from "react";
import { documentsPublished } from "@/content/legal";
import { TICKET, CHECKOUT_ENABLED } from "@/content/ticket";
import { formatRubles } from "./ticket-order";
import LegalLink from "./LegalLink";

/** No requests or storage until a real server checkout is connected. */
export default function TicketPurchase() {
  const [accepted, setAccepted] = useState(false);
  const published = documentsPublished(["terms", "buyers", "privacy"]);
  const total = TICKET.priceKopecks;
  const available = CHECKOUT_ENABLED && published;
  return (
    <form className="form ticket-purchase" data-form="purchase"
      onSubmit={(e) => { e.preventDefault(); }}
      onReset={() => setAccepted(false)}>
      <h3 className="ticket-order-title">Оформление билета</h3>
      <input name="quantity" type="hidden" value="1" />
      <div className="form-grid">
        <p className="field"><label htmlFor="purchase-name">Имя и фамилия покупателя *</label>
          <input id="purchase-name" name="name" autoComplete="name" required maxLength={200} /></p>
        <p className="field"><label htmlFor="purchase-email">Электронная почта *</label>
          <input id="purchase-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-describedby="purchase-email-note" />
          <small id="purchase-email-note">На этот адрес придут билет и кассовый чек. Проверьте правильность написания.</small></p>
        <p className="field"><label htmlFor="purchase-phone">Телефон *</label>
          <input id="purchase-phone" name="phone" type="tel" autoComplete="tel" required maxLength={32} /></p>
      </div>
      <p className="ticket-total" aria-live="polite" aria-atomic="true">Итого <output>{formatRubles(total)}</output></p>
      <p className="field-check">
        <label htmlFor="purchase-terms">
          <input id="purchase-terms" name="termsAccepted" type="checkbox" required value="yes"
            checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>Принимаю условия покупки и возврата билетов в <LegalLink document="terms">Пользовательском соглашении</LegalLink></span>
        </label>
      </p>
      <p className="form-note">Как мы обрабатываем данные покупателей — в <LegalLink document="buyers">Сведениях об обработке персональных данных</LegalLink>.</p>
      <div className="form-foot">
        {!available && <p className="form-note" id="purchase-availability">Онлайн-оплата пока недоступна. Сейчас оформить и оплатить заказ нельзя.</p>}
        <button className="btn btn-solid btn-buy" type="submit" disabled={!accepted || !available}
          aria-describedby={!available ? "purchase-availability" : undefined}>
          {`Оплатить ${formatRubles(total)}`}
          <span className="arrow" aria-hidden="true">↗</span>
        </button>
        <p className="form-note">Как мы обрабатываем данные — в <LegalLink document="privacy">Политике</LegalLink>.</p>
      </div>
    </form>
  );
}
