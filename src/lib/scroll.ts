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

/** Freeze the page behind the mobile menu / a cinematic hand-off. */
export function lockScroll() {
  lenis?.stop();
  document.documentElement.classList.add("is-locked");
}

export function unlockScroll() {
  lenis?.start();
  document.documentElement.classList.remove("is-locked");
}

/**
 * Put an element exactly on the viewport top, synchronously.
 *
 * This is intentionally NOT an anchor helper: there is no sticky-header
 * offset and no easing. It is used while an opaque transition covers the
 * screen, so the destination can be placed perfectly underneath before the
 * curtain opens. Updating Lenis through its own API also keeps its internal
 * target in sync; a naked window.scrollTo while Lenis is running can be
 * pulled back towards the previous target on the next frame.
 */
export function jumpToElement(target: HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { immediate: true, force: true });
    return;
  }

  const y = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y, behavior: "auto" });
}

/**
 * Jump to an anchor. The sticky header would otherwise sit on top of the
 * target's first line, so every landing is offset by its height.
 */
export function scrollToAnchor(hash: string) {
  const id = hash.replace(/^#/, "");
  const target = id === "top" ? 0 : document.getElementById(id);
  if (target === null) return false;

  /*
   * The phone menu locks the page while open. Wait one frame so React can
   * close it and release that lock before reading the destination geometry.
   * The first STATUS TEAM scene hides the header on phones, so it must begin
   * at the actual viewport top rather than leaving a stale header-sized gap.
   */
  requestAnimationFrame(() => {
    const nav = document.querySelector<HTMLElement>(".nav");
    const immersiveMobileStart =
      id === "statusteam" &&
      window.matchMedia("(max-width: 767px)").matches;
    const offset =
      target === 0 || immersiveMobileStart
        ? 0
        : -((nav?.offsetHeight ?? 0) + 8);

    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.35, force: true });
      return;
    }

    const y =
      target === 0
        ? 0
        : (target as HTMLElement).getBoundingClientRect().top +
          window.scrollY +
          offset;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    window.scrollTo({ top: y, behavior });
  });
  return true;
}
