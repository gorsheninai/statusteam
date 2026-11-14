import Tickets from "./Tickets";

export default function TicketsSection({ test = false }: { test?: boolean }) {
  return (
    <section className="tickets on-dark" id="tickets" data-bg="wine">
      <div className="shell tickets-inner">
        <Tickets test={test} />
      </div>
    </section>
  );
}
