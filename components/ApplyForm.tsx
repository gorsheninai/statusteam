"use client";

import { useState } from "react";
import { FORM_ENDPOINT } from "@/lib/config";

type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  half?: boolean;
  hint?: string;
};

export type FormKind = "casting" | "partner" | "press" | "access" | "subscribe";

const CASTING: Field[] = [
  { name: "name", label: "Имя и фамилия", required: true, autoComplete: "name", half: true },
  { name: "age", label: "Возраст", type: "number", required: true, half: true },
  { name: "city", label: "Город", required: true, autoComplete: "address-level2", half: true },
  { name: "height", label: "Рост, см", type: "number", required: true, half: true },
  { name: "params", label: "Параметры", placeholder: "90 / 60 / 90", half: true },
  { name: "contact", label: "Telegram или телефон", required: true, half: true },
  {
    name: "links",
    label: "Ссылка на снэпы или видео-визитку",
    type: "url",
    placeholder: "https://",
    hint: "Подойдёт папка на диске, профиль или облако. Снэпы — без макияжа и обработки.",
  },
];

const PARTNER: Field[] = [
  { name: "company", label: "Бренд или компания", required: true, half: true },
  { name: "name", label: "Контактное лицо", required: true, autoComplete: "name", half: true },
  { name: "contact", label: "Почта или Telegram", required: true, half: true },
  { name: "format", label: "Формат сотрудничества", placeholder: "Коллекция, интеграция, медиа", half: true },
  { name: "message", label: "Коротко о задаче", type: "textarea" },
];

const PRESS: Field[] = [
  { name: "name", label: "Имя и фамилия", required: true, autoComplete: "name", half: true },
  { name: "outlet", label: "Издание или площадка", required: true, half: true },
  { name: "link", label: "Ссылка на профиль или медиа", type: "url", required: true, placeholder: "https://", half: true },
  { name: "reach", label: "Охват аудитории", placeholder: "Подписчики или просмотры", half: true },
  { name: "contact", label: "Почта или Telegram", required: true, autoComplete: "email" },
];

const ACCESS: Field[] = [
  { name: "name", label: "Имя", required: true, autoComplete: "name", half: true },
  {
    name: "contact",
    label: "Почта или телефон",
    required: true,
    autoComplete: "off",
    half: true,
    placeholder: "Почта или +7…",
  },
];

const SUBSCRIBE: Field[] = [
  {
    name: "contact",
    label: "Почта",
    type: "email",
    required: true,
    autoComplete: "email",
    placeholder: "you@mail.ru",
  },
];

const FIELDS: Record<FormKind, Field[]> = {
  casting: CASTING,
  partner: PARTNER,
  press: PRESS,
  access: ACCESS,
  subscribe: SUBSCRIBE,
};

const SUBMIT: Record<FormKind, string> = {
  casting: "Отправить заявку",
  partner: "Отправить запрос",
  press: "Запросить аккредитацию",
  access: "Получить доступ первым",
  subscribe: "Подписаться",
};

const DONE: Record<FormKind, string> = {
  casting: "Заявка отправлена. Мы ответим на указанный контакт.",
  partner: "Запрос отправлен. Мы свяжемся с вами по указанному контакту.",
  press: "Заявка на аккредитацию отправлена. Ответим до показа.",
  access: "Готово. Вы получите ссылку на билеты первыми.",
  subscribe: "Готово. Новости показа придут на указанную почту.",
};

/**
 * Every form on the page, including the two one-line ones. They share a
 * single endpoint and a single set of states — loading, success and error all
 * say what happened in words, not only in colour.
 *
 * With no endpoint configured the form refuses to pretend: it reports that
 * delivery is not wired and sends nothing.
 */
export default function ApplyForm({
  kind,
  variant = "full",
  consent = false,
  submitLabel,
  idPrefix,
}: {
  kind: FormKind;
  /** "inline" is the one-line newsletter row; "full" is a real form grid. */
  variant?: "full" | "inline";
  /** Adds the personal-data checkbox. Required by the newer forms. */
  consent?: boolean;
  submitLabel?: string;
  /**
   * Field ids are deterministic so they can be targeted by tests and by
   * `label[for]`. Pass a prefix wherever the same form kind renders twice on
   * the page — the newsletter row does, in the ticket scene and the footer.
   */
  idPrefix?: string;
}) {
  const fields = FIELDS[kind];
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "error" | "unwired"
  >("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    /* No endpoint configured yet. Say so plainly rather than faking a send. */
    if (!FORM_ENDPOINT) {
      setState("unwired");
      return;
    }

    if (state === "sending") return;
    setState("sending");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: kind, ...data }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const fid = (name: string) => `${idPrefix ?? kind}-${name}`;

  return (
    <form
      className={`form form-${variant}`}
      onSubmit={onSubmit}
      data-form={kind}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <p key={f.name} className={`field ${f.half ? "is-half" : ""}`}>
            <label htmlFor={fid(f.name)}>
              {f.label}
              {f.required && <i aria-hidden="true"> *</i>}
            </label>

            {f.type === "textarea" ? (
              <textarea
                id={fid(f.name)}
                name={f.name}
                rows={4}
                required={f.required}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                id={fid(f.name)}
                name={f.name}
                type={f.type ?? "text"}
                min={f.type === "number" ? 1 : undefined}
                max={f.name === "age" ? 120 : f.name === "height" ? 250 : undefined}
                spellCheck={f.name === "contact" ? false : undefined}
                required={f.required}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                inputMode={f.type === "number" ? "numeric" : undefined}
              />
            )}

            {f.hint && <small>{f.hint}</small>}
          </p>
        ))}
      </div>

      {consent && (
        <p className="field-check">
          <label htmlFor={fid("consent")}>
            <input
              id={fid("consent")}
              name="consent"
              type="checkbox"
              required
              value="yes"
            />
            <span>Согласен на обработку персональных данных</span>
          </label>
        </p>
      )}

      <div className="form-foot">
        <button
          className="btn btn-solid"
          type="submit"
          disabled={state === "sending"}
          data-magnetic={variant === "full" ? "" : undefined}
        >
          {state === "sending" ? "Отправляем…" : submitLabel ?? SUBMIT[kind]}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
        </button>

        {(state !== "idle" || !consent) && (
          <p className="form-note" role="status" aria-live="polite">
            {state === "sent" && DONE[kind]}
            {state === "error" &&
              "Не удалось отправить. Попробуйте ещё раз или напишите нам напрямую."}
            {state === "unwired" &&
              "Приём заявок пока не подключён — форма ещё не связана с почтой команды. Данные не отправлены."}
            {state === "sending" && "Отправляем заявку…"}
            {state === "idle" &&
              "Нажимая кнопку, вы соглашаетесь на обработку персональных данных."}
          </p>
        )}
      </div>
    </form>
  );
}
