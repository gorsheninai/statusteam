"use client";

import { useState } from "react";
import { documentsPublished } from "@/content/legal";
import LegalLink from "./LegalLink";

/** External checkout remains responsible for payment and ticket delivery. */
export default function TicketPurchase({ href }: { href: string }) {
  const [accepted, setAccepted] = useState(false);
  const published = documentsPublished(["terms", "buyers", "privacy"]);
  return (
    <form className="form ticket-purchase" data-form="purchase" onSubmit={(e) => {
      e.preventDefault();
      if (accepted && published && e.currentTarget.reportValidity()) window.location.assign(href);
    }} onReset={() => setAccepted(false)}>
      <p className="field-check">
        <label htmlFor="purchase-terms">
          <input id="purchase-terms" name="termsAccepted" type="checkbox" required value="yes"
            checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>Принимаю условия покупки и возврата билетов в <LegalLink document="terms">Пользовательском соглашении</LegalLink></span>
        </label>
      </p>
      <p className="form-note">Как мы обрабатываем данные покупателей — в <LegalLink document="buyers">Сведениях об обработке персональных данных</LegalLink>.</p>
      <div className="form-foot">
        {!published && <p className="form-note" id="purchase-documents-note">Документы готовятся к публикации. Переход к покупке станет доступен после их размещения.</p>}
        <button className="btn btn-solid btn-buy" type="submit" disabled={!accepted || !published}
          aria-describedby={!published ? "purchase-documents-note" : undefined}>
          Купить билет <span className="arrow" aria-hidden="true">↗</span>
        </button>
        <p className="form-note">Как мы обрабатываем данные — в <LegalLink document="privacy">Политике</LegalLink>.</p>
      </div>
    </form>
  );
}
