"use client";

import { useState } from "react";

type Kind = "access" | "newsletter" | "media";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

const FIELDS: Record<Kind, Field[]> = {
  access: [
    { name: "name", label: "Имя", required: true },
    { name: "contact", label: "Email или телефон", required: true },
  ],
  newsletter: [
    { name: "email", label: "Email", type: "email", placeholder: "you@email.ru", required: true },
  ],
  media: [
    { name: "name", label: "Имя и фамилия", required: true },
    { name: "media", label: "Площадка / издание", required: true },
    { name: "link", label: "Ссылка", type: "url", placeholder: "https://", required: true },
    { name: "reach", label: "Охват", placeholder: "Средний охват публикации" },
    { name: "contact", label: "Email / Telegram", required: true },
  ],
};

export default function LeadForm({
  kind,
  compact = false,
}: {
  kind: Kind;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "unwired">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!ENDPOINT) {
      setState("unwired");
      return;
    }

    setState("sending");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: kind, ...data }),
      });
      if (!response.ok) throw new Error("Request failed");
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  const button = kind === "media" ? "Отправить на аккредитацию" : kind === "access" ? "Получить доступ" : "Подписаться";

  return (
    <form className={`lead-form ${compact ? "is-compact" : ""}`} onSubmit={onSubmit}>
      <div className="lead-form-fields">
        {FIELDS[kind].map((field) => (
          <label className="lead-field" key={field.name}>
            <span>{field.label}</span>
            <input
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              required={field.required}
              autoComplete={field.name === "email" ? "email" : field.name === "name" ? "name" : undefined}
            />
          </label>
        ))}
      </div>

      <label className="lead-consent">
        <input type="checkbox" name="consent" value="yes" required />
        <span>Согласен на обработку персональных данных</span>
      </label>

      <div className="lead-form-action">
        <button className="v4-button v4-button-gold" type="submit" disabled={state === "sending"} data-magnetic>
          {state === "sending" ? "Отправляем…" : button}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="lead-form-status" role="status" aria-live="polite">
          {state === "sent" && "Готово. Мы свяжемся с вами по указанному контакту."}
          {state === "error" && "Не удалось отправить. Попробуйте ещё раз."}
          {state === "unwired" && "Форма подготовлена, но endpoint пока не подключён."}
        </p>
      </div>
    </form>
  );
}
