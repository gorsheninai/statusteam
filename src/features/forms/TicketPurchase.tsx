"use client";

import { useEffect, useRef, useState } from "react";
import { LEGAL_DOCUMENTS, PURCHASE_DOCUMENTS, documentsPublished } from "@/content/legal";
import { TICKET } from "@/content/ticket";
import { checkoutErrorMessage, checkoutMatchesPublication, formatRubles } from "./ticket-order";
import LegalLink from "./LegalLink";
import { apiEndpoint, clearRetryKey, retryKey } from "./api";

/** Server enforces price, capacity and release gates independently. */
export default function TicketPurchase({ test = false, control: forceControl = false }: { test?: boolean; control?: boolean }) {
  const busy = useRef(false);
  const [state, setState] = useState("");
  const [sending, setSending] = useState(false);
  const [paymentLink, setPaymentLink] = useState<{ href: string; fields: string } | null>(null);
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
  const [publicPrice, setPublicPrice] = useState<number | null>(null);
  useEffect(() => {
    const endpoint = apiEndpoint("public-checkout");
    if (restricted || !published || !endpoint) return;
    const controller = new AbortController();
    async function check() {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const result = await response.json();
        const amount = result?.amountKopecks;
        const matches = (amount === TICKET.priceKopecks || amount === 100) &&
          checkoutMatchesPublication(result, amount, PURCHASE_DOCUMENTS.map(id => ({ id, ...LEGAL_DOCUMENTS[id] })));
        if (!controller.signal.aborted) setPublicPrice(matches ? amount : null);
      } catch { /* The server must confirm availability before enabling payment. */ }
    }
    void check();
    return () => controller.abort();
  }, [published, restricted]);
  const total = restricted ? (testSession?.amountKopecks ?? TICKET.priceKopecks) : (publicPrice ?? TICKET.priceKopecks);
  const available = published && (restricted ? testSession !== null && (!control || testSession.amountKopecks === 100) : publicPrice !== null);
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const endpoint = endpointFor("orders");
    if (busy.current || !available || !accepted || !endpoint || !e.currentTarget.reportValidity()) return;
    const form = e.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const submittedFields = JSON.stringify(fields);
    const fieldsMatch = () => JSON.stringify(Object.fromEntries(new FormData(form))) === submittedFields;
    busy.current = true; setSending(true); setState("Создаём заказ…"); setPaymentLink(null);
    const payload = { ...fields, ...(!test || control ? { paymentMethod: "smart" } : {}),
      ...(!restricted ? { expectedAmountKopecks: total } : {}), consentDocuments: testSession?.documents ?? PURCHASE_DOCUMENTS
      .map(id => ({ id, version: LEGAL_DOCUMENTS[id].version })) };
    try {
      if (typeof globalThis.crypto?.getRandomValues !== "function") {
        setState("Откройте сайт напрямую в Safari или Chrome и повторите оплату.");
        return;
      }
      const purpose = control ? "control-purchase" : test ? "test-purchase" : "purchase";
      let requestKey = await retryKey(purpose, payload);
      const headers = { "Content-Type": "application/json" };
      const submit = async (key: string) => {
        const response = await fetch(endpoint, { method: "POST", headers,
          body: JSON.stringify({ ...payload, requestKey: key, ...(testSession ? { csrf: testSession.csrf } : {}) }) });
        return { res: response, result: await response.json().catch(() => ({})) };
      };
      let { res, result } = await submit(requestKey);
      if (!fieldsMatch()) return;
      const finished = res.ok && (control
        ? ["paid", "canceled", "expired", "refunded", "refund_pending"]
        : ["canceled", "expired"]).includes(result.status);
      const conflictingKey = res.status === 409 && (result.error === "retry_payload_changed"
        || (control && result.error === "control_checkout_upgraded"));
      if (finished || conflictingKey) {
        clearRetryKey(purpose);
        requestKey = await retryKey(purpose, payload);
        ({ res, result } = await submit(requestKey));
        if (!fieldsMatch()) return;
      }
      if (res.status === 409 && ["document_version_changed", "checkout_price_changed"].includes(result.error) && !restricted) {
        clearRetryKey(purpose);
        setPublicPrice(null);
        setState("Условия покупки обновились. Перезагрузите страницу и проверьте актуальную цену и документы.");
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
        setState(checkoutErrorMessage(res.status, result.error));
        return;
      }
      if (result.confirmationUrl) {
        const destination = new URL(result.confirmationUrl);
        if (destination.protocol !== "https:" || !/(^|\.)(yookassa|yoomoney)\.ru$/.test(destination.hostname)) {
          throw new Error("invalid_payment_link");
        }
        setPaymentLink({ href: destination.href, fields: submittedFields });
        setState("Открываем страницу оплаты…");
        window.location.assign(destination.href);
      } else if (control) {
        setState("ЮKassa не вернула ссылку на оплату. Проверьте заказ в кабинете.");
      } else if (result.status === "reserved") {
        setState("ЮKassa пока не выдала ссылку. Нажмите «Оплатить» ещё раз с теми же данными.");
      } else if (result.accessToken) {
        window.location.assign(`${endpointFor("return")}#${result.accessToken}`);
      } else {
        throw new Error("checkout_failed");
      }
    } catch { setState("Не удалось получить ответ. Повторите отправку с теми же данными — сервер проверит существующий заказ."); }
    finally { busy.current = false; setSending(false); }
  }
  function clearPaymentLink() {
    setPaymentLink(null);
    setState("");
  }
  return (
    <form className="form ticket-purchase" data-form="purchase" aria-label="Оформление билета"
      method="post" onSubmit={checkout} onInput={clearPaymentLink}
      onReset={() => { setAccepted(false); clearPaymentLink(); }}>
      {((control && testSession?.amountKopecks === 100) || (!restricted && publicPrice === 100)) &&
        <p className="form-note">Контрольная оплата · реальное списание 1 ₽. Билет недействителен для входа.</p>}
      <input name="website" type="hidden" value="" />
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
      {available && (test && !control ? (
        <fieldset className="ticket-payment-method" disabled={sending}>
          <legend>Способ оплаты</legend>
          <label><input type="radio" name="paymentMethod" value="bank_card" defaultChecked /> Картой · бронь 15 минут</label>
        </fieldset>
      ) : (
        <p className="form-note ticket-payment-method">Способ оплаты можно выбрать на защищённой странице ЮKassa.</p>
      ))}
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
      {paymentLink && <p className="form-note"><button className="ticket-payment-link" type="button" onClick={(event) => {
        const form = event.currentTarget.form;
        if (!form || JSON.stringify(Object.fromEntries(new FormData(form))) !== paymentLink.fields) {
          clearPaymentLink();
          return;
        }
        window.location.assign(paymentLink.href);
      }}>Открыть страницу оплаты ЮKassa</button></p>}
      <div className="form-foot">
        {restricted && !available && <p className="form-note" id="purchase-availability">{testSessionError ? "Войдите в кабинет и снова откройте форму." : "Проверяем доступ к оплате…"}</p>}
        <button className="btn btn-solid btn-buy" type="submit" disabled={!accepted || !available || sending}
          aria-describedby={restricted && !available ? "purchase-availability" : undefined}>
          {sending ? "Создаём заказ…" : "Оплатить"}
          <span className="arrow" aria-hidden="true">↗</span>
        </button>
        <p className="form-note">Как мы обрабатываем данные — в <LegalLink document="privacy">Политике</LegalLink>.</p>
      </div>
    </form>
  );
}
