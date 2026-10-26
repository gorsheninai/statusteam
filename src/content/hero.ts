/**
 * The hero art, as layers.
 *
 * Two crops of the same frame, not two art directions: `wide` (16:9) carries
 * the figures on the right with an empty field on the left, which is where
 * the lock-up sits; `tall` (9:16) is the same pair recomposed for a phone.
 * The browser picks by orientation, so neither is ever squeezed into the
 * other's box.
 *
 * `model` and `foreground` are optional transparent cut-outs (PNG/WebP) that
 * let part of the figure — hair, a shoulder, a piece of jewellery — sit
 * *outside* the media area, over the black. Both slots are fully wired:
 * markup, stacking, the overflow they need and their own parallax depth.
 * They render only when a file exists, so the hero costs nothing extra until
 * such a frame is delivered.
 *
 * TODO: replace-content — derived from header_16_9.png / header_9_16.png in
 * assets/originals/pulse-continent/hero/. Re-run the WebP derivation if those are replaced.
 */
export const HERO_ART: {
  wide: { name: string; widths: number[] };
  tall: { name: string; widths: number[] };
  alt: string;
  model: string | null;
  foreground: string | null;
} = {
  wide: { name: "hero-wide", widths: [1200, 1800, 2560] },
  tall: { name: "hero-tall", widths: [720, 1080, 1440] },
  alt: "Две модели в чёрных образах с золотыми украшениями и ракушечными подвесками на тёмном фоне",
  model: null,
  foreground: null,
};
