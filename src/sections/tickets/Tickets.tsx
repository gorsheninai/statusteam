import Link from "next/link";
import { TICKET } from "@/content/ticket";
import TicketPurchase from "@/features/forms/TicketPurchase";
import LegalLink from "@/features/forms/LegalLink";
import { formatRubles } from "@/features/forms/ticket-order";

export default function Tickets() {
  return (
    <div className="ticket-shop">
      <header className="ticket-shop-heading">
        <h2 className="struct">Купить билет</h2>
        <p>{TICKET.title}</p>
      </header>
      <div className="ticket-shop-grid">
        <div className="ticket-product">
          <p className="ticket-price">{formatRubles(TICKET.priceKopecks)} <span>за один билет</span></p>
          <p>{TICKET.description}</p>
          <dl className="ticket-facts">
            <div><dt>Дата</dt><dd><time dateTime={TICKET.dateISO}>{TICKET.date}</time></dd></div>
            <div><dt>Площадка</dt><dd>{TICKET.venue}</dd></div>
            <div><dt>Адрес</dt><dd>{TICKET.address}</dd></div>
            <div><dt>Сбор гостей</dt><dd>{TICKET.doors}</dd></div>
            <div><dt>Начало шоу</dt><dd>{TICKET.start} · {TICKET.timezone}</dd></div>
            <div><dt>Возраст</dt><dd>{TICKET.age}</dd></div>
            <div><dt>Количество</dt><dd>Всего {TICKET.capacity} билетов. Без выбора мест.</dd></div>
          </dl>
          <div className="ticket-fulfillment">
            <h3>Получение билета</h3>
            <p>{TICKET.delivery}</p>
            <p>Покажите QR-код с экрана телефона или распечатайте билет. Сохраните письмо до дня мероприятия.</p>
            <h3>Оплата и чек</h3>
            <p>Онлайн-оплата через ЮKassa. Доступные способы оплаты будут указаны на защищённой платёжной странице. Данные банковской карты на сайте STATUS TEAM не запрашиваются.</p>
            <p>{TICKET.receipt}</p>
            <h3>Возврат и изменения мероприятия</h3>
            <p>Условия покупки, возврата, отмены и переноса — в разделе 7 <LegalLink document="terms">Пользовательского соглашения</LegalLink>.</p>
            <p>Не получили билет или нужен возврат? <Link href="/contacts/">Контакты и реквизиты организатора</Link>.</p>
          </div>
        </div>
        <TicketPurchase />
      </div>
    </div>
  );
}
