import Experience from "./Experience";

export default function ExperienceSection() {
  return (
    <section className="exp-scene" id="experience" data-bg="paper">
      <div className="shell">
        <h2 className="exp-h campaign" data-reveal="lines">
          В программе
        </h2>
      </div>

      <div className="shell">
        <Experience />
      </div>

      {/* Only the city is confirmed. Type carries the announcement until
          the date and venue are ready to be published. */}
      <div className="venue">
        <p className="venue-label label">Место проведения</p>
        <p className="venue-name struct" data-reveal="lines">
          Москва
        </p>
        <p className="venue-where">Дата и площадка будут объявлены позже</p>
      </div>

    </section>
  );
}
