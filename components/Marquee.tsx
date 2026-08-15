const CURRENT_PLACEHOLDERS = new Set([
  "MEDIA ONE",
  "ГЛЯНЕЦ",
  "FASHION DAILY",
  "СТОЛИЦА",
  "PODIUM",
  "VECTOR",
  "BRAND 01",
  "ATELIER",
  "STUDIO NORD",
  "LINGERIE CO",
  "AURUM",
  "KINEMA",
]);

export default function Marquee({
  items,
  direction = "left",
  label,
  speed = 42,
}: {
  items: string[];
  direction?: "left" | "right";
  label: string;
  speed?: number;
}) {
  const placeholderMode = items.length > 0 && items.every((item) => CURRENT_PLACEHOLDERS.has(item));
  const prefix = label.toLowerCase().includes("сми") ? "MEDIA" : "PARTNER";

  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((name, index) => {
        const shown = placeholderMode
          ? `${prefix} ${String(index + 1).padStart(2, "0")}`
          : name;

        return (
          <li key={`${name}-${index}`} className="marquee-item">
            <span
              className="logo-slot"
              data-placeholder={placeholderMode ? "true" : undefined}
            >
              {shown}
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className={`marquee marquee-${direction}`}
      style={{ ["--marquee-speed" as string]: `${speed}s` }}
      aria-label={label}
      role="group"
      data-reveal="up"
    >
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
