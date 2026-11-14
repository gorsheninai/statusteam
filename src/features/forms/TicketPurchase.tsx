"use client";

import { useEffect, useRef, useState } from "react";
import { LEGAL_DOCUMENTS, PURCHASE_DOCUMENTS, documentsPublished } from "@/content/legal";
import { TICKET, CHECKOUT_ENABLED } from "@/content/ticket";
import { formatRubles } from "./ticket-order";
import LegalLink from "./LegalLink";
import { apiEndpoint, retryKey } from "./api";

/** Server enforces price, capacity and release gates independently. */
export default function TicketPurchase({ test = false, control: forceControl = false }: { test?: boolean; control?: boolean }) {
  const busy = useRef(false);
  const [state, setState] = useState("");
  const [sending, setSending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [testSession, setTestSession] = useState<{ csrf: string; amountKopecks: number; documents: { id: string; version: string }[] } | null>(null);
  const [testSessionError, setTestSessionError] = useState(false);
  const [homeControl, setHomeControl] = useState(false);
  useEffect(() => {
    setHomeControl(window.location.pathname === "/" && new URLSearchParams(window.location.search).get("control") === "1");
  }, []);
  const control = forceControl || homeControl;
  const restricted = test || control;
  const restrictedPath = control ? "/api/index.php" : "/api-test/index.php";
  useEffect(() => {
    if (!restricted) return;
    const controller = new AbortController();
    const loadSession = async () => {
      const headers = { "Content-Type": "application/json" };
      const session = await fetch(`${restrictedPath}?r=session`, { method: "POST", headers, body: "{}", signal: controller.signal });
      if (!session.ok) throw new Error("session");
      const { csrf } = await session.json();
      const response = await fetch(`${restrictedPath}?r=${control ? "control-documents" : "checkout-documents"}`, {
        method: "POST", headers, body: JSON.stringify({ csrf }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("checkout");
      const { amountKopecks, documents } = await response.json();
      setTestSession({ csrf, amountKopecks, documents: documents.map(({ id, version }: { id: string; version: string }) => ({ id, version })) });
    };
    loadSession().catch(() => { if (!controller.signal.aborted) setTestSessionError(true); });
    return () => controller.abort();
  }, [control, restricted, restrictedPath]);
  const endpointFor = (route: string) => restricted
    ? `${restrictedPath}?r=${control && route === "orders" ? "control-order" : route}`
    : apiEndpoint(route);
  const published = documentsPublished(PURCHASE_DOCUMENTS);
  const total = testSession?.amountKopecks ?? TICKET.priceKopecks;
  const available = published && (restricted ? testSession !== null && (!control || testSession.amountKopecks === 100) : CHECKOUT_ENABLED);
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const endpoint = endpointFor("orders");
    if (busy.current || !available || !accepted || !endpoint || !e.currentTarget.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    busy.current = true; setSending(true); setState("Создаём заказ…");
    const payload = { ...fields, consentDocuments: testSession?.documents ?? PURCHASE_DOCUMENTS
      .map(id => ({ id, version: LEGAL_DOCUMENTS[id].version })) };
    try {
      const requestKey = await retryKey(control ? "control-purchase" : test ? "test-purchase" : "purchase", payload, true);
      const headers = { "Content-Type": "application/json" };
      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ ...payload, requestKey, ...(testSession ? { csrf: testSession.csrf } : {}) }) });
      let result = await res.json();
      if (res.status === 409 && result.error === "retry_payload_changed") {
        const resumed = await fetch(endpointFor("order-status"), { method: "POST", headers, body: JSON.stringify({ requestKey }) });
        if (!resumed.ok) throw new Error("checkout_failed");
        result = await resumed.json();
        window.location.assign(`${endpointFor("return")}#${result.accessToken}`);
        return;
      }
      if (!res.ok) {
        if (control && result.error === "control_order_exists") {
          setState("Контрольный заказ уже создан. Его статус можно посмотреть в кабинете.");
          return;
        }
        if (restricted && ["csrf_required", "login_required"].includes(result.error)) {
          setState("Сессия истекла. Войдите в кабинет и заново откройте форму.");
          return;
        }
        throw new Error("checkout_failed");
      }
      if (result.confirmationUrl) window.location.assign(result.confirmationUrl);
      else if (result.accessToken) window.location.assign(`${endpointFor("return")}#${result.accessToken}`);
      else throw new Error("checkout_failed");
    } catch { setState("Не удалось получить ответ. Повторите отправку с теми же данными — сервер проверит существующий заказ."); }
    finally { busy.current = false; setSending(false); }
  }
  return (
    <form className="form ticket-purchase" data-form="purchase" aria-label="Оформление билета"
      method="post" onSubmit={checkout}
      onReset={() => setAccepted(false)}>
      {control && testSession?.amountKopecks === 100 && <p className="form-note">Контрольная оплата · реальное списание 1 ₽</p>}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" hidden />
      <input name="quantity" type="hidden" value="1" />
      <div className="form-grid">
        <p className="field"><label htmlFor="purchase-name">Имя и фамилия покупателя *</label>
          <input id="purchase-name" name="name" autoComplete="name" required maxLength={200} /></p>
        <p className="field"><label htmlFor="purchase-email">Электронная почта *</label>
          <input id="purchase-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-describedby="purchase-email-note" />
          <small id="purchase-email-note">{test ? "На этот адрес придёт тестовый билет." : "На этот адрес придут билет и кассовый чек. Проверьте правильность написания."}</small></p>
        <p className="field"><label htmlFor="purchase-phone">Телефон *</label>
          <input id="purchase-phone" name="phone" type="tel" autoComplete="tel" required maxLength={32} /></p>
      </div>
      {available && (
        <fieldset className="ticket-payment-method" disabled={sending}>
          <legend>Способ оплаты</legend>
          <label><input type="radio" name="paymentMethod" value="bank_card" defaultChecked /> {control ? "Банковской картой" : "Картой · бронь 15 минут"}</label>
          {!restricted && <>
            <label><input type="radio" name="paymentMethod" value="sbp" /> СБП · на оплату 1 час</label>
            <p className="form-note">При оплате через СБП билет остаётся в брони до подтверждения оплаты или отмены платежа.</p>
          </>}
        </fieldset>
      )}
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
        {restricted && !available && <p className="form-note" id="purchase-availability">{testSessionError ? "Войдите в кабинет и снова откройте форму." : "Проверяем доступ к оплате…"}</p>}
        <button className="btn btn-solid btn-buy" type="submit" disabled={!accepted || !available || sending}
          aria-describedby={restricted && !available ? "purchase-availability" : undefined}>
          Оплатить
          <span className="arrow" aria-hidden="true">↗</span>
        </button>
        <p className="form-note">Как мы обрабатываем данные — в <LegalLink document="privacy">Политике</LegalLink>.</p>
      </div>
    </form>
  );
}
