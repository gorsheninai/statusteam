import ApplyForm from "@/features/forms/ApplyForm";
import { CONTACTS } from "@/content/event";
import { MEDIA } from "@/content/media";

export default function Footer() {
  return (
    <footer className="foot on-dark">
      <div className="shell foot-inner">
        <div className="foot-col foot-col-brand">
          <a className="foot-brand" href="#top" aria-label="STATUS TEAM — наверх">
            <picture>
              <source
                srcSet={`${MEDIA.brand.large} 2x`}
                type="image/webp"
              />
              <img
                src={MEDIA.brand.small}
                alt="STATUS TEAM"
                width="320"
                height="50"
              />
            </picture>
          </a>

          {/* Политика конфиденциальности и пользовательское соглашение
              ещё не написаны — ссылок в никуда быть не должно, поэтому
              это пока текст, а не <a>. Как только страницы появятся,
              достаточно обернуть их в ссылки. */}
          <div className="foot-legal">
            <span>Политика конфиденциальности</span>
            <span>Пользовательское соглашение</span>
          </div>
        </div>

        <nav className="foot-col foot-nav" aria-label="Навигация в подвале">
          <p className="foot-col-title">Меню</p>
          <a href="#pulse">О показе</a>
          <a href="#experience">В программе</a>
          <a href="#join">Аккредитация СМИ и блогеров</a>
          <a href="#join">Партнёрство и участие</a>
        </nav>

        <div className="foot-col foot-contacts">
          <p className="foot-col-title">Контакты</p>
          <a
            className="foot-contact-link"
            href={CONTACTS.telegram}
            target="_blank"
            rel="noreferrer"
          >
            Служба заботы / Telegram
          </a>
          <div className="foot-social">
            <a
              className="foot-social-link"
              href={CONTACTS.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="STATUS TEAM в Telegram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.4 4.2 3.2 11c-.9.35-.9 1.63.02 1.95l4.2 1.46 1.62 5.02c.2.62 1 .78 1.43.28l2.27-2.6 4.4 3.24c.68.5 1.65.14 1.84-.68l3.03-13.5c.2-.9-.7-1.63-1.6-1.26Zm-3.1 3.24-7.1 6.4-.3 3.3-1.4-4.3 8.8-5.4Z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="foot-col foot-sub">
          <p className="foot-col-title">Подпишитесь на нашу рассылку</p>
          <ApplyForm
            kind="subscribe"
            variant="inline"
            idPrefix="foot-news"
            submitLabel="Отправить"
          />
        </div>
      </div>

      <div className="shell foot-end">
        <p className="credit">© 2026 STATUS TEAM. Все права защищены.</p>
      </div>
    </footer>
  );
}
