"use client";

import { useState } from "react";
import { FIELDS, SUBMIT, DONE, type FormKind } from "./fields";
import { FORM_ENDPOINT, submitForm } from "./submit";

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

    setState("sending");
    try {
      const res = await submitForm(kind, data);
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
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
