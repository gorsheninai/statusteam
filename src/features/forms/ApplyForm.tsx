"use client";

import { useState } from "react";
import { FIELDS, SUBMIT, DONE, type FormKind } from "./fields";
import { submitForm } from "./submit";
import { documentsPublished } from "@/content/legal";
import { consentDocuments, isMinorAge, requiredConsentsAccepted, validCastingAge } from "./consents";
import LegalLink from "./LegalLink";
import { apiEndpoint } from "./api";

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
    if (kind === "subscribe" || locked || !published || !accepted || !e.currentTarget.reportValidity()
      || !requiredConsentsAccepted(kind, data)) return;
    if (!apiEndpoint("forms")) {
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
    subscribe: "для рассылки",
  }[kind];
  const dataDocument = kind === "casting" ? (minor ? "guardian" : "casting")
    : kind === "subscribe" ? "newsletter" : kind;

  return (
    <form className={`form form-${variant}`} onSubmit={onSubmit} data-form={kind}
      onReset={() => { setAge(""); setTerms(false); setPersonalData(false); setAdvertising(false); setState("idle"); }}>
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" hidden />
      <div className="form-grid">
        {fields.map((f) => (
          <p key={f.name} className={`field ${f.half ? "is-half" : ""}`}>
            <label htmlFor={fid(f.name)}>{f.label}{f.required && <i aria-hidden="true"> *</i>}</label>
            {f.type === "textarea" ? (
              <textarea id={fid(f.name)} name={f.name} rows={4} required={f.required}
                placeholder={f.placeholder} maxLength={3000} disabled={locked} />
            ) : (
              <input id={fid(f.name)} name={f.name} type={f.type ?? "text"}
                required={f.required} placeholder={f.placeholder} autoComplete={f.autoComplete}
                maxLength={f.type === "url" ? 1000 : 254}
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

      {minor && <fieldset disabled={locked}>
        <legend>Законный представитель</legend>
        <p className="field"><label htmlFor={fid("guardianName")}>Фамилия, имя, отчество представителя *</label>
          <input id={fid("guardianName")} name="guardianName" autoComplete="name" required maxLength={200} /></p>
        <p className="field"><label htmlFor={fid("guardianRole")}>Статус представителя *</label>
          <select id={fid("guardianRole")} name="guardianRole" required defaultValue="">
            <option value="" disabled>Выберите</option><option value="parent">Родитель</option>
            <option value="adoptive_parent">Усыновитель</option><option value="guardian">Опекун</option><option value="custodian">Попечитель</option>
          </select></p>
        <p className="field"><label htmlFor={fid("guardianPhone")}>Телефон представителя *</label>
          <input id={fid("guardianPhone")} name="guardianPhone" type="tel" autoComplete="tel" required maxLength={32} /></p>
        <p className="field"><label htmlFor={fid("guardianEmail")}>Почта представителя *</label>
          <input id={fid("guardianEmail")} name="guardianEmail" type="email" autoComplete="email" required maxLength={254} /></p>
        <p className="field-check"><label><input type="checkbox" name="guardianAuthority" value="yes" required />
          <span>Подтверждаю полномочия законного представителя кандидата</span></label></p>
      </fieldset>}

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
        {kind === "subscribe" && <p className="form-note">Подписка на рассылку временно отключена.</p>}
        {!published && <p className="form-note" id={fid("documents-note")}>Документы готовятся к публикации. Отправка формы станет доступна после их размещения.</p>}
        <button className="btn btn-solid" type="submit" disabled={kind === "subscribe" || locked || !accepted || !published}
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
