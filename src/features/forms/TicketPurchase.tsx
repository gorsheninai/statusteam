"use client";

import { useRef, useState } from "react";
import { LEGAL_DOCUMENTS, PURCHASE_DOCUMENTS, documentsPublished } from "@/content/legal";
import { TICKET, CHECKOUT_ENABLED } from "@/content/ticket";
import { formatRubles } from "./ticket-order";
import LegalLink from "./LegalLink";
import { apiEndpoint, retryKey } from "./api";

/** Server enforces price, capacity and release gates independently. */
export default function TicketPurchase() {
  const busy = useRef(false);
  const [state, setState] = useState("");
  const [sending, setSending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const published = documentsPublished(PURCHASE_DOCUMENTS);
  const total = TICKET.priceKopecks;
  const available = CHECKOUT_ENABLED && published;
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const endpoint = apiEndpoint("orders");
    if (busy.current || !available || !accepted || !endpoint || !e.currentTarget.reportValidity()) return;
    busy.current = true; setSending(true); setState("Создаём заказ…");
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const payload = { ...fields, consentDocuments: PURCHASE_DOCUMENTS
      .map(id => ({ id, version: LEGAL_DOCUMENTS[id].version })) };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestKey: await retryKey("purchase", payload) }) });
      const result = await res.json();
      if (!res.ok) throw new Error("checkout_failed");
      if (result.confirmationUrl) window.location.assign(result.confirmationUrl);
      else if (result.accessToken) window.location.assign(`${apiEndpoint("return")}#${result.accessToken}`);
      else throw new Error("checkout_failed");
    } catch { setState("Не удалось получить ответ. Повторите отправку с теми же данными — сервер проверит существующий заказ."); }
    finally { busy.current = false; setSending(false); }
  }
  return (
    <form className="form ticket-purchase" data-form="purchase" aria-label="Оформление билета"
      onSubmit={checkout}
      onReset={() => setAccepted(false)}>
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" hidden />
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
          <span>Принимаю условия покупки и возврата билетов в <LegalLink document="terms" section="section-7">Пользовательском соглашении</LegalLink></span>
        </label>
      </p>
      <p className="form-note">Как мы обрабатываем данные покупателей — в <LegalLink document="buyers">Сведениях об обработке персональных данных</LegalLink>.</p>
      <p className="form-note" role="status" aria-live="polite">{state}</p>
      <div className="form-foot">
        {!available && <p className="form-note" id="purchase-availability">Онлайн-оплата пока недоступна. Сейчас оформить и оплатить заказ нельзя.</p>}
        <button className="btn btn-solid btn-buy" type="submit" disabled={!accepted || !available || sending}
          aria-describedby={!available ? "purchase-availability" : undefined}>
          {`Оплатить ${formatRubles(total)}`}
          <span className="arrow" aria-hidden="true">↗</span>
        </button>
        <p className="form-note">Как мы обрабатываем данные — в <LegalLink document="privacy">Политике</LegalLink>.</p>
      </div>
    </form>
  );
}
