import Link from "next/link";
import PulseBeat from "@/components/ui/PulseBeat";
import { TICKET } from "@/content/ticket";
import TicketPurchase from "@/features/forms/TicketPurchase";

export default function Tickets({ test = false, control = false }: { test?: boolean; control?: boolean }) {
  return (
    <div className="ticket-shop">
      <header className="ticket-shop-heading">
        <h2 className="struct">Купить билет</h2>
      </header>
      <div className="ticket-shop-grid">
        <div className="ticket-product">
          <div className="ticket-facts-mobile">
            <div className="ticket-mobile-date">
              <time dateTime={TICKET.dateISO}>{TICKET.date}</time>
              <span>{TICKET.age}</span>
            </div>
            <p className="ticket-mobile-venue">
              <strong>{TICKET.venueShort}</strong>
              <span>{TICKET.addressShort}</span>
            </p>
            <dl className="ticket-mobile-times">
              <div><dt>Сбор гостей</dt><dd>{TICKET.doors}</dd></div>
              <div><dt>Начало шоу</dt><dd>{TICKET.start}</dd></div>
            </dl>
            <p className="ticket-mobile-timezone">{TICKET.timezone}</p>
          </div>
          <dl className="ticket-facts ticket-facts-desktop">
            <div><dt>Дата</dt><dd><time dateTime={TICKET.dateISO}>{TICKET.date}</time></dd></div>
            <div><dt>Площадка</dt><dd>{TICKET.venue}</dd></div>
            <div><dt>Адрес</dt><dd>{TICKET.address}</dd></div>
            <div><dt>Сбор гостей</dt><dd>{TICKET.doors}</dd></div>
            <div><dt>Начало шоу</dt><dd>{TICKET.start} · {TICKET.timezone}</dd></div>
            <div><dt>Возраст</dt><dd>{TICKET.age}</dd></div>
          </dl>
        </div>
        <div className="ticket-pulse-divider">
          <PulseBeat />
        </div>
        <TicketPurchase test={test} control={control} />
        <div className="ticket-fulfillment">
          <p>{TICKET.delivery} Оплата через ЮKassa.</p>
          <p><Link href="/contacts/">Контакты и вопросы о билетах</Link></p>
        </div>
      </div>
    </div>
  );
}
