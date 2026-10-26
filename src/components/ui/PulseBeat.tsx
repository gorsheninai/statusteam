import { PULSE_PATH } from "@/lib/pulse-path";

const Line = ({ className }: { className: string }) => (
  <svg
    className={`pulse-beat-line ${className}`}
    viewBox="0 0 1200 40"
    preserveAspectRatio="none"
    focusable="false"
  >
    <path d={PULSE_PATH} />
  </svg>
);

/**
 * The lock-up's heartbeat — the same oscillograph the preloader writes and
 * the chapter dividers leave behind, set once under ПУЛЬС КОНТИНЕНТА.
 *
 * The line is drawn twice: a resting hairline, and a bright copy that only
 * shows through a narrow window travelling along it, so a pulse of light
 * runs the length of the mark and then holds dark. The window slides with
 * `transform` and the copy inside counter-slides by the same distance, which
 * keeps the bright line registered on the resting one — no dash arithmetic,
 * and nothing animated but transforms and opacity.
 *
 * Decorative, hidden from assistive tech, and driven by CSS alone: a mark
 * that needs the JS bundle to appear is a mark that sometimes does not.
 */
export default function PulseBeat() {
  return (
    <div className="pulse-beat" aria-hidden="true">
      <Line className="pulse-beat-rest" />
      <div className="pulse-beat-window">
        <Line className="pulse-beat-live" />
      </div>
    </div>
  );
}
