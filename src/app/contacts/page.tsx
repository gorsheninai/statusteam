import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/content/company";
import LegalLink from "@/features/forms/LegalLink";

export const metadata: Metadata = { title: "Контакты и реквизиты — STATUS TEAM" };

export default function ContactsPage() {
  return (
    <main id="statusteam" className="shell legal-page company-page">
      <p className="legal-back"><Link href="/">STATUS TEAM — на главную</Link></p>
      <h1>Контакты и реквизиты</h1>
      <p>Организатор шоу «Пульс Континента» и продавец билетов — {COMPANY.shortName}.</p>
      <dl className="company-details">
        <div><dt>Полное наименование</dt><dd>{COMPANY.name}</dd></div>
        <div><dt>Сокращённое наименование</dt><dd>{COMPANY.shortName}</dd></div>
        <div><dt>ИНН</dt><dd>{COMPANY.inn}</dd></div>
        <div><dt>КПП</dt><dd>{COMPANY.kpp}</dd></div>
        <div><dt>ОГРН</dt><dd>{COMPANY.ogrn}</dd></div>
        <div><dt>Юридический адрес</dt><dd>{COMPANY.address}</dd></div>
        <div><dt>Электронная почта</dt><dd><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></dd></div>
        <div><dt>Телефоны</dt><dd>{COMPANY.phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>)}</dd></div>
      </dl>
      <h2>Вопросы о билетах и возвратах</h2>
      <p>Если билет не пришёл, проверьте папку «Спам», затем свяжитесь с нами по электронной почте или телефону выше. В обращении укажите номер заказа и e-mail, использованный при покупке.</p>
      <p>Условия покупки, возврата, отмены и переноса мероприятия — в разделе 7 <LegalLink document="terms">Пользовательского соглашения</LegalLink>.</p>
      <p><Link href="/#tickets">Купить билет на «Пульс Континента»</Link></p>
    </main>
  );
}
