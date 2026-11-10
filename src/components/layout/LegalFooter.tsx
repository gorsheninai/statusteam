import Link from "next/link";
import LegalLink from "@/features/forms/LegalLink";
import CookieConsent from "@/features/privacy/CookieConsent";

/** Shared by the homepage, document pages and the error page. */
export default function LegalFooter() {
  return (
    <footer className="legal-footer" aria-label="Правовая информация">
      <div className="shell legal-footer-inner">
        <LegalLink document="privacy">Политика обработки персональных данных</LegalLink>
        <LegalLink document="terms" />
        <Link href="/contacts/">Контакты и реквизиты</Link>
        <CookieConsent />
      </div>
    </footer>
  );
}
