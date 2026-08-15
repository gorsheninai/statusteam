/**
 * A logo band that never stops.
 *
 * The row is rendered twice and the track travels exactly half its width, so
 * the seam lands where the copy begins and the loop is invisible. It is a CSS
 * animation on a transform — no scroll listener, no JS, and it keeps running
 * while the main thread is busy elsewhere.
 *
 * Two of these run in opposite directions in the STATUS TEAM scene. The
 * duplicate row is hidden from assistive tech; the first row carries the
 * names once, as a list.
 */
export default function Marquee({
  items,
  direction = "left",
  label,
  speed = 42,
}: {
  items: string[];
  direction?: "left" | "right";
  label: string;
  /** Seconds for one full pass. Longer is calmer. */
  speed?: number;
}) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((name, i) => (
        <li key={`${name}-${i}`} className="marquee-item">
          {/* TODO: replace-content — grey placeholders stand in for the real
              logo files. Swap the span for an <img> when they arrive. */}
          <span className="logo-slot">{name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={`marquee marquee-${direction}`}
      style={{ ["--marquee-speed" as string]: `${speed}s` }}
      aria-label={label}
      role="group"
    >
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
