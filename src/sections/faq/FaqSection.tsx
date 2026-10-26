import Faq from "./Faq";
import { CONTACTS } from "@/content/event";

export default function FaqSection() {
  return (
    <section className="faq-scene on-dark" id="faq" data-bg="ink">
      <div className="shell faq-shell">
        <div className="faq-layout">
          <div className="faq-intro" data-reveal="up">
            <h2 className="faq-h">Частые вопросы</h2>
            <p className="faq-copy">
              Ответы на главные вопросы о шоу, дресс-коде и билетах.
              Остались вопросы?
            </p>
            <a
              className="faq-contact"
              href={CONTACTS.telegram}
              target="_blank"
              rel="noreferrer"
            >
              <span>Служба заботы / Telegram</span>
              <span className="faq-contact-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
          <Faq />
        </div>
      </div>
    </section>
  );
}
