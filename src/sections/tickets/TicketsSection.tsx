import Tickets from "./Tickets";

export default function TicketsSection() {
  return (
    <section className="tickets on-dark" id="tickets" data-bg="wine">
      <div className="shell tickets-inner">
        <Tickets />
      </div>
    </section>
  );
}
