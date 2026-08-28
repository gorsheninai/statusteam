import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "no-preference",
});
const page = await context.newPage();
const failures = [];
const check = (ok, message, detail = "") => {
  if (!ok) failures.push(`${message}${detail ? ` — ${detail}` : ""}`);
};

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2400);

const heroControls = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll(".hero-cta .btn")];
  const labels = [...document.querySelectorAll(".hero-btn-label")];
  const lineCounts = labels.map((label) => {
    const range = document.createRange();
    range.selectNodeContents(label);
    return range.getClientRects().length;
  });
  const buttonStyles = buttons.map((button) => getComputedStyle(button));
  const arrowStyles = buttons.map((button) => getComputedStyle(button.querySelector(".arrow")));
  const labelStyles = labels.map((label) => getComputedStyle(label));
  return {
    singleLine: lineCounts.every((count) => count === 1),
    sharedType:
      buttonStyles[0].fontFamily === buttonStyles[1].fontFamily &&
      buttonStyles[0].fontSize === buttonStyles[1].fontSize &&
      buttonStyles[0].fontWeight === buttonStyles[1].fontWeight &&
      buttonStyles[0].letterSpacing === buttonStyles[1].letterSpacing,
    paperLabels: labelStyles.every((style) => style.color === "rgb(241, 238, 232)"),
    sandRules: buttonStyles.every((style) => /rgba?\(198, 168, 124/.test(style.borderTopColor)),
    /* One stub, on the paying action. */
    oneSandStub:
      arrowStyles[0].backgroundColor === "rgb(198, 168, 124)" &&
      arrowStyles[1].backgroundColor === "rgba(0, 0, 0, 0)",
    stacked: buttons[0].getBoundingClientRect().bottom <= buttons[1].getBoundingClientRect().top + 1,
  };
});
check(heroControls.singleLine, "both mobile CTA labels stay on one line");
check(
  heroControls.sharedType &&
    heroControls.paperLabels &&
    heroControls.sandRules &&
    heroControls.oneSandStub,
  "both mobile CTAs share paper type and sand rules, with one sand stub",
  JSON.stringify(heroControls),
);
check(
  heroControls.stacked,
  "the two CTAs stack on a phone rather than sharing the width",
  JSON.stringify(heroControls),
);

const swipeUp = async () => {
  await page.locator("body").dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 195, clientY: 700 }],
  });
  await page.locator("body").dispatchEvent("touchmove", {
    touches: [{ identifier: 1, clientX: 195, clientY: 600 }],
  });
};

/* Sample both planes every frame. A single mid-flight probe is not enough:
   when the start state is transitioned into rather than out of, the incoming
   plane still reports a few pixels of travel before it is reversed, and a
   `0 < top < viewport` assertion passes on a hand-off the eye reads as a cut. */
const traceTravel = () =>
  page.evaluate(() => {
    const hero = document.querySelector(".hero-stage");
    const status = document.querySelector(".st-page-two");
    window.__travel = [];
    const t0 = performance.now();
    const nav = document.querySelector(".nav");
    const tick = () => {
      const navStyle = getComputedStyle(nav);
      window.__travel.push([
        Math.round(hero.getBoundingClientRect().top),
        Math.round(status.getBoundingClientRect().top),
        navStyle.visibility === "visible" && navStyle.opacity !== "0",
        document.documentElement.classList.contains("mobile-screen-swap"),
      ]);
      if (performance.now() - t0 < 1000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

await traceTravel();
await swipeUp();
await page.waitForTimeout(120);

const active = await page.evaluate(() => {
  const hero = document.querySelector(".hero-stage").getBoundingClientRect();
  const status = document.querySelector(".st-page-two").getBoundingClientRect();
  return {
    active: document.documentElement.classList.contains("mobile-screen-swap--to-status"),
    heroTop: hero.top,
    statusTop: status.top,
    navVisibility: getComputedStyle(document.querySelector(".nav")).visibility,
  };
});

check(active.active, "the forward hand-off reaches its animated state");
check(
  active.heroTop === 0 && active.statusTop > 0 && active.statusTop < 844,
  "screen two is mid-travel while screen one holds its position",
  JSON.stringify(active),
);
check(active.navVisibility === "hidden", "the mobile header leaves with screen one");

await page.waitForTimeout(950);

const travel = await page.evaluate(() => window.__travel ?? []);
/* The hand-off's own frames, marked by the class rather than by geometry:
   screen two sits one viewport down both before the gesture and in its armed
   start state, so its position cannot tell the two apart. */
const moving = travel.filter(([, , , swap]) => swap);
const statusStart = Math.max(...moving.map(([, top]) => top));
const statusSteps = new Set(moving.map(([, top]) => top)).size;
check(
  statusStart >= 760,
  "screen two starts a full viewport below and slides up",
  `highest sampled top ${statusStart} of 844`,
);
check(statusSteps >= 12, "screen two travels over many frames rather than cutting", String(statusSteps));

/* One plane travels. Screen one is covered, never pushed — and it holds still
   to the pixel while it is uncovered, which is what the hero hold is for. */
const heroTops = moving.map(([top]) => top);
const heroSpread = Math.max(...heroTops) - Math.min(...heroTops);
check(
  heroSpread === 0,
  "screen one does not move while screen two comes over it",
  `${heroSpread}px of travel across ${moving.length} frames`,
);

/* The hand-off's own hide is a class on <html>; Nav's is React state behind a
   scroll listener. If the first is dropped before the second commits, the
   header paints over the film for a couple of frames right at the landing. */
const landing = travel.slice(travel.indexOf(moving[0]));
const headerFrames = landing.filter(([, , navVisible]) => navVisible).length;
check(
  headerFrames === 0,
  "the header never flashes back while screen two lands",
  `${headerFrames} frame(s) of ${landing.length} with a visible header`,
);
const landed = await page.evaluate(() => ({
  swapActive: document.documentElement.classList.contains("mobile-screen-swap"),
  impactTop: document.querySelector(".st2-impact").getBoundingClientRect().top,
  navVisibility: getComputedStyle(document.querySelector(".nav")).visibility,
}));
check(!landed.swapActive, "temporary transition classes clear after landing");
check(Math.abs(landed.impactTop) <= 2, "screen two lands exactly at the viewport top", String(landed.impactTop));
check(landed.navVisibility === "hidden", "the header stays hidden across the film screen");

await page.evaluate(() => document.querySelector(".st2-vanguard").scrollIntoView());
await page.waitForTimeout(120);
const afterFilm = await page.evaluate(() => ({
  visible: getComputedStyle(document.querySelector(".nav")).visibility === "visible",
  scrollY: window.scrollY,
  impact: document.querySelector(".st2-impact").getBoundingClientRect().toJSON(),
  archive: document.querySelector(".st2-vanguard").getBoundingClientRect().toJSON(),
  navClass: document.querySelector(".nav").className,
}));
check(afterFilm.visible, "the header returns after the film screen", JSON.stringify(afterFilm));

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
await page.waitForTimeout(120);
await swipeUp();
await page.waitForTimeout(120);
check(
  await page.evaluate(() => !document.documentElement.classList.contains("mobile-screen-swap")),
  "the cinematic hand-off plays only once",
);

await browser.close();

if (failures.length) {
  console.error(`Mobile hand-off: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Mobile hand-off: PASS (smooth forward motion, one play, film header hidden)");
}
