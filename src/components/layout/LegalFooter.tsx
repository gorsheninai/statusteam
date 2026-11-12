import Link from "next/link";
import { COMPANY } from "@/content/company";
import LegalLink from "@/features/forms/LegalLink";
import CookieConsent from "@/features/privacy/CookieConsent";

/** Shared by the homepage, document pages and the error page. */
export default function LegalFooter() {
  return (
    <footer className="legal-footer" aria-label="Правовая информация">
      <address className="shell legal-footer-company">
        <p>{COMPANY.name} · ИНН {COMPANY.inn} · ОГРН {COMPANY.ogrn}</p>
        <p>{COMPANY.address}</p>
        <p className="legal-footer-contacts">
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>
      </address>
      <div className="shell legal-footer-inner">
        <LegalLink document="privacy">Политика обработки персональных данных</LegalLink>
        <LegalLink document="terms" />
        <Link href="/contacts/">Контакты и реквизиты</Link>
        <CookieConsent />
      </div>
    </footer>
  );
}
