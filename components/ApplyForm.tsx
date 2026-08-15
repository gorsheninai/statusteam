"use client";

import { useState } from "react";

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

const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

export default function ApplyForm({ kind }: { kind: "casting" | "partner" }) {
  const fields = kind === "casting" ? CASTING : PARTNER;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "unwired">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!ENDPOINT) {
      setState("unwired");
      return;
    }

    setState("sending");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: kind, ...data }),
      });
      if (!res.ok) throw new Error("Request failed");
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-grid">
        {fields.map((f) => (
          <p key={f.name} className={`field ${f.half ? "is-half" : ""}`}>
            <label htmlFor={`${kind}-${f.name}`}>
              {f.label}{f.required && <i aria-hidden="true"> *</i>}
            </label>

            {f.type === "textarea" ? (
              <textarea id={`${kind}-${f.name}`} name={f.name} rows={4} required={f.required} placeholder={f.placeholder} />
            ) : (
              <input
                id={`${kind}-${f.name}`}
                name={f.name}
                type={f.type ?? "text"}
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

      <label className="form-consent">
        <input type="checkbox" name="consent" value="yes" required />
        <span>Согласен на обработку персональных данных</span>
      </label>

      <div className="form-foot">
        <button className="btn btn-solid" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Отправляем…" : kind === "casting" ? "Отправить заявку" : "Отправить запрос"}
          <span className="arrow" aria-hidden="true">↗</span>
        </button>

        <p className="form-note" role="status" aria-live="polite">
          {state === "sent" && "Заявка отправлена. Мы ответим на указанный контакт."}
          {state === "error" && "Не удалось отправить. Попробуйте ещё раз или напишите нам напрямую."}
          {state === "unwired" && "Форма подготовлена, но endpoint пока не подключён. Данные не отправлены."}
        </p>
      </div>
    </form>
  );
}
