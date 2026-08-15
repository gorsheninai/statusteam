/**
 * The oscillograph. One shape, drawn twice: once by the preloader as it
 * writes itself in, and again between chapters as a hairline rule.
 *
 * Deliberately not an ECG cliché — the line is flat for most of its length
 * and spikes once, so it reads as a mark rather than as a medical graphic.
 * Drawn on a 1200 × 40 grid with the baseline at y = 20.
 */
export const PULSE_PATH =
  "M0 20 H470 L492 20 L506 7 L520 33 L534 13 L546 20 L586 20 L600 20 L612 14 L624 20 H1200";
