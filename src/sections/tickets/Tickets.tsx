import Link from "next/link";
import { TICKET } from "@/content/ticket";
import TicketPurchase from "@/features/forms/TicketPurchase";

export default function Tickets() {
  return (
    <div className="ticket-shop">
      <header className="ticket-shop-heading">
        <h2 className="struct">Купить билет</h2>
      </header>
      <div className="ticket-shop-grid">
        <div className="ticket-product">
          <dl className="ticket-facts">
            <div><dt>Дата</dt><dd><time dateTime={TICKET.dateISO}>{TICKET.date}</time></dd></div>
            <div><dt>Площадка</dt><dd>{TICKET.venue}</dd></div>
            <div><dt>Адрес</dt><dd>{TICKET.address}</dd></div>
            <div><dt>Сбор гостей</dt><dd>{TICKET.doors}</dd></div>
            <div><dt>Начало шоу</dt><dd>{TICKET.start} · {TICKET.timezone}</dd></div>
            <div><dt>Возраст</dt><dd>{TICKET.age}</dd></div>
          </dl>
        </div>
        <TicketPurchase />
        <div className="ticket-fulfillment">
          <p>{TICKET.delivery} Оплата через ЮKassa.</p>
          <p><Link href="/contacts/">Контакты и вопросы о билетах</Link></p>
        </div>
      </div>
    </div>
  );
}
