"use client";

import { useEffect, useState } from "react";
import { LEGAL_DOCUMENTS, documentsPublished } from "@/content/legal";
import LegalLink from "@/features/forms/LegalLink";
import { COOKIE_STORAGE_KEY, readCookieChoice } from "./cookie-choice";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const published = documentsPublished(["cookies", "privacy"]);
  const version = LEGAL_DOCUMENTS.cookies.version;

  useEffect(() => {
    try {
      const choice = readCookieChoice(localStorage.getItem(COOKIE_STORAGE_KEY), version);
      setOpen(!choice);
    } catch { setOpen(true); }
  }, [version]);

  function choose(analytics: boolean) {
    if (analytics && !published) return;
    const choice = { analytics, version };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(choice));
      setStorageError(false);
    } catch { setStorageError(true); }
    // Future analytics integrations must also check the current published version.
    window.dispatchEvent(new CustomEvent("status-cookie-consent", { detail: choice }));
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="cookie-settings" aria-expanded={open}
        aria-controls="cookie-banner" onClick={() => setOpen(true)}>Настройки cookie</button>
      {open && (
        <section className="cookie-banner" id="cookie-banner" aria-labelledby="cookie-title">
          <h2 id="cookie-title">Настройки cookie</h2>
          <p>Необходимое хранилище запоминает ваш выбор. Аналитика разрешается только с вашего согласия. Сейчас сервисы аналитики не подключены.</p>
          <p><LegalLink document="cookies">Согласие на cookie и аналитику</LegalLink> · <LegalLink document="privacy">Политика</LegalLink></p>
          {!published && <p className="cookie-note">Документы готовятся к публикации. Сейчас доступен только выбор необходимых cookie.</p>}
          <div className="cookie-actions">
            <button type="button" className="btn" onClick={() => choose(false)}>Только необходимые</button>
            <button type="button" className="btn btn-solid" disabled={!published} onClick={() => choose(true)}>Разрешить аналитику</button>
          </div>
        </section>
      )}
      {storageError && <p className="form-note" role="status">Браузер не сохранил выбор cookie. Настройки действуют до перезагрузки страницы.</p>}
    </>
  );
}
