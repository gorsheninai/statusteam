/**
 * The key-art geometry, continued in line.
 *
 * The hero photograph carries concentric arcs burned into the frame by the
 * client's own artwork. Those stay where they are — nothing is ever drawn on
 * top of them (see the note in `hero-desktop-reference.css`). This is the
 * same circle picked up *after* the photograph, on the flat grounds below:
 * a hairline, never a fill and never a gradient, sitting behind everything
 * the scene actually says.
 *
 * Decorative, so it is hidden from assistive tech and takes no pointer. The
 * rings share one centre, which lives outside the box on purpose — only the
 * arc enters the frame.
 *
 * Desktop only: below 900px every scene is already tight to the measure and
 * the motif would read as a scratch across the type. `arc-motif.css` hides
 * it there, and `Motion` never builds its tween.
 */
export default function Arc({
  rings = 2,
  className = "",
}: {
  rings?: number;
  className?: string;
}) {
  return (
    <div className={className ? `arc ${className}` : "arc"} aria-hidden="true" data-arc>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" focusable="false">
        {Array.from({ length: rings }, (_, i) => (
          <circle
            key={i}
            cx="500"
            cy="500"
            r={500 - i * 46}
            pathLength={1}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
