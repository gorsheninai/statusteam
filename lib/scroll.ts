import type Lenis from "lenis";

/**
 * The page has exactly one scroll owner. Lenis takes it over when motion is
 * allowed; everything that needs to stop, start or jump the page goes through
 * here so nothing ever fights the smoothing loop.
 *
 * When Lenis is not running (reduced motion, JS still loading) every function
 * falls back to the platform: the page keeps scrolling, anchors keep working.
 */

let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null) {
  lenis = instance;
}

/** Freeze the page behind the mobile menu. */
export function lockScroll() {
  lenis?.stop();
  document.documentElement.classList.add("is-locked");
}

export function unlockScroll() {
  lenis?.start();
  document.documentElement.classList.remove("is-locked");
}

/**
 * Jump to an anchor. The sticky header would otherwise sit on top of the
 * target's first line, so every landing is offset by its height.
 */
export function scrollToAnchor(hash: string) {
  const id = hash.replace(/^#/, "");
  const target = id === "top" ? 0 : document.getElementById(id);
  if (target === null) return false;

  const nav = document.querySelector<HTMLElement>(".nav");
  const offset = target === 0 ? 0 : -((nav?.offsetHeight ?? 0) + 8);

  if (lenis) {
    /* One frame of daylight: a link inside the mobile menu closes it, and
       that unlock lands in React's commit *after* this handler. Starting the
       travel before the page is unlocked would scroll nowhere. `force` covers
       the same race from the other side. */
    requestAnimationFrame(() =>
      lenis?.scrollTo(target, { offset, duration: 1.35, force: true }),
    );
    return true;
  }

  /* No Lenis: the platform still owns the scroll. */
  const y =
    target === 0
      ? 0
      : (target as HTMLElement).getBoundingClientRect().top +
        window.scrollY +
        offset;
  window.scrollTo({ top: y, behavior: "auto" });
  return true;
}
