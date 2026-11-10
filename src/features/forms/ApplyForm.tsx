"use client";

import { useState } from "react";
import { FIELDS, SUBMIT, DONE, type FormKind } from "./fields";
import { FORM_ENDPOINT, submitForm } from "./submit";
import { documentsPublished } from "@/content/legal";
import { consentDocuments, isMinorAge, requiredConsentsAccepted, validCastingAge } from "./consents";
import LegalLink from "./LegalLink";

export default function ApplyForm({
  kind,
  variant = "full",
  submitLabel,
  idPrefix,
}: {
  kind: FormKind;
  variant?: "full" | "inline";
  submitLabel?: string;
  idPrefix?: string;
}) {
  const fields = FIELDS[kind];
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "unwired">("idle");
  const [age, setAge] = useState("");
  const [terms, setTerms] = useState(false);
  const [personalData, setPersonalData] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const minor = kind === "casting" && isMinorAge(age);
  const published = documentsPublished(consentDocuments(kind, age));
  const accepted = terms && personalData && (kind !== "subscribe" || advertising)
    && (kind !== "casting" || validCastingAge(age));
  const locked = state === "sending" || state === "sent";
  const fid = (name: string) => `${idPrefix ?? kind}-${name}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (locked || !published || !accepted || !e.currentTarget.reportValidity()
      || !requiredConsentsAccepted(kind, data)) return;
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

  const purpose = {
    casting: "для рассмотрения заявки модели",
    partner: "для рассмотрения предложения",
    press: "для аккредитации",
    access: "для предзаписи на билеты",
    subscribe: "для рассылки",
  }[kind];
  const dataDocument = kind === "casting" ? (minor ? "guardian" : "casting")
    : kind === "subscribe" ? "newsletter" : kind;

  return (
    <form className={`form form-${variant}`} onSubmit={onSubmit} data-form={kind}
      onReset={() => { setAge(""); setTerms(false); setPersonalData(false); setAdvertising(false); setState("idle"); }}>
      <div className="form-grid">
        {fields.map((f) => (
          <p key={f.name} className={`field ${f.half ? "is-half" : ""}`}>
            <label htmlFor={fid(f.name)}>{f.label}{f.required && <i aria-hidden="true"> *</i>}</label>
            {f.type === "textarea" ? (
              <textarea id={fid(f.name)} name={f.name} rows={4} required={f.required}
                placeholder={f.placeholder} disabled={locked} />
            ) : (
              <input id={fid(f.name)} name={f.name} type={f.type ?? "text"}
                required={f.required} placeholder={f.placeholder} autoComplete={f.autoComplete}
                inputMode={f.type === "number" ? "numeric" : undefined} disabled={locked}
                min={f.name === "age" ? 1 : undefined}
                step={f.name === "age" ? 1 : undefined}
                {...(f.name === "age" ? { value: age, onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  setAge(e.target.value);
                  setPersonalData(false);
                } } : {})} />
            )}
            {f.hint && <small>{f.hint}</small>}
          </p>
        ))}
      </div>

      <div className="form-consents" role="group" aria-label="Обязательные согласия">
        <p className="field-check">
          <label htmlFor={fid("terms")}>
            <input id={fid("terms")} name="termsAccepted" type="checkbox" required value="yes"
              checked={terms} onChange={(e) => setTerms(e.target.checked)} disabled={locked} />
            <span>Принимаю условия <LegalLink document="terms">Пользовательского соглашения</LegalLink></span>
          </label>
        </p>
        <p className="field-check">
          <label htmlFor={fid("consent")}>
            <input id={fid("consent")} name="consent" type="checkbox" required value="yes"
              checked={personalData} onChange={(e) => setPersonalData(e.target.checked)} disabled={locked} />
            <span>{minor ? <>Я законный представитель кандидата и даю <LegalLink document="guardian">согласие на обработку персональных данных</LegalLink> несовершеннолетнего и своих данных</>
              : <>Даю <LegalLink document={dataDocument}>согласие на обработку персональных данных</LegalLink> {purpose}</>}</span>
          </label>
        </p>
        {kind === "casting" && <input type="hidden" name="consentSubject" value={minor ? "guardian" : "candidate"} />}
        {kind === "subscribe" && (
          <p className="field-check">
            <label htmlFor={fid("advertising")}>
              <input id={fid("advertising")} name="advertisingConsent" type="checkbox" required value="yes"
                checked={advertising} onChange={(e) => setAdvertising(e.target.checked)} disabled={locked} />
              <span>Согласен(-на) получать рекламу на условиях <LegalLink document="advertising">Условий рассылки</LegalLink></span>
            </label>
          </p>
        )}
      </div>

      <div className="form-foot">
        {!published && <p className="form-note" id={fid("documents-note")}>Документы готовятся к публикации. Отправка формы станет доступна после их размещения.</p>}
        <button className="btn btn-solid" type="submit" disabled={locked || !accepted || !published}
          aria-describedby={!published ? fid("documents-note") : undefined}>
          {state === "sending" ? "Отправляем…" : state === "sent" ? "Отправлено" : submitLabel ?? SUBMIT[kind]}
          <span className="arrow" aria-hidden="true">↗</span>
        </button>
        <p className="form-note">Как мы обрабатываем данные — в <LegalLink document="privacy">Политике</LegalLink>.</p>
        <p className="form-note" role="status" aria-live="polite">
          {state === "sent" && DONE[kind]}
          {state === "error" && "Не удалось отправить. Попробуйте ещё раз или напишите нам напрямую."}
          {state === "unwired" && "Приём заявок пока не подключён — форма ещё не связана с почтой команды. Данные не отправлены."}
          {state === "sending" && "Отправляем заявку…"}
        </p>
      </div>
    </form>
  );
}
