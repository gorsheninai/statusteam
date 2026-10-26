/**
 * Split an element's text into rendered lines, each in its own mask.
 *
 * Written by hand rather than pulled from GSAP's SplitText: the plugin costs
 * ~7 KB gzip for a page whose whole JS budget is 150 KB, and every heading
 * here is a single plain text node — the case that fits in forty lines.
 *
 * Measure first, rebuild second. Words are wrapped, their offsetTop read in
 * one pass, then grouped: that is the browser's own line-breaking, not a
 * guess at it. Call after the webfonts have loaded or the breaks will be
 * measured against the fallback metrics.
 */
export type Split = {
  /** The inner element of each line — the thing to translate. */
  lines: HTMLElement[];
  /** Put the original markup back. */
  revert: () => void;
};

export function splitLines(el: HTMLElement): Split | null {
  const text = el.textContent?.trim();
  if (!text) return null;

  const original = el.innerHTML;
  const revert = () => {
    el.innerHTML = original;
  };

  /* Pass 1 — every word gets a box we can ask for its position. */
  el.textContent = "";
  const words = text.split(/\s+/).map((word) => {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.textContent = word;
    el.append(span, document.createTextNode(" "));
    return span;
  });

  /* Pass 2 — same offsetTop means same line. */
  const rows: string[][] = [];
  let top: number | null = null;
  words.forEach((span) => {
    const y = span.offsetTop;
    if (top === null || Math.abs(y - top) > 1) {
      rows.push([]);
      top = y;
    }
    rows[rows.length - 1].push(span.textContent ?? "");
  });

  if (!rows.length) {
    revert();
    return null;
  }

  /* Pass 3 — rebuild as masked lines. */
  el.textContent = "";
  const lines = rows.map((row) => {
    const mask = document.createElement("span");
    mask.className = "ln";
    const inner = document.createElement("span");
    inner.className = "ln-in";
    inner.textContent = row.join(" ");
    mask.append(inner);
    el.append(mask);
    return inner;
  });

  return { lines, revert };
}
