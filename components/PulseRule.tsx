import { PULSE_PATH } from "@/lib/pulse-path";

/**
 * The chapter divider — the preloader's line, left behind on the page.
 * Decorative, so it is hidden from assistive tech and costs nothing but a
 * single path.
 */
export default function PulseRule() {
  return (
    <div className="pulse-rule" aria-hidden="true">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" focusable="false">
        <path d={PULSE_PATH} pathLength={1} />
      </svg>
    </div>
  );
}
