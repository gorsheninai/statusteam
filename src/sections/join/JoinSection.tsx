import Join from "./Join";

export default function JoinSection() {
  return (
    <section className="join on-dark" id="join" data-bg="wine">
      <div className="shell join-head">
        <h2 className="join-h struct" data-reveal="up">
          <span className="join-h-line">Моделям, брендам</span>{" "}
          <span className="join-h-line join-h-line-big">партнёрам и СМИ</span>
        </h2>
      </div>

      <Join />
    </section>
  );
}
