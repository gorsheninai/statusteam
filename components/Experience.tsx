const ITEMS = [
  {
    title: "Подиум-шоу",
    sub: "Новая коллекция вживую",
  },
  {
    title: "Live-перформанс",
    sub: "Музыка и постановка как часть шоу",
  },
  {
    title: "Гости и атмосфера",
    sub: "Вечер среди медийных лиц и индустрии",
  },
  {
    title: "Afterparty",
    sub: "Продолжение вечера",
  },
];

export default function Experience() {
  return (
    <div className="exp-accordion exp-program">
      {ITEMS.map((item) => (
        <section className="exp-item" key={item.title}>
          <h3 className="exp-title">{item.title}</h3>
          <p className="exp-sub">{item.sub}</p>
        </section>
      ))}
    </div>
  );
}
