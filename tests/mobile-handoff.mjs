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
  const labels = [...document.querySelectorAll(".hero-btn-label")];
  const lineCounts = labels.map((label) => {
    const range = document.createRange();
    range.selectNodeContents(label);
    return range.getClientRects().length;
  });
  const pulse = document.querySelector(".btn-pulse");
  const divider = pulse.querySelector(".arrow");
  return {
    singleLine: lineCounts.every((count) => count === 1),
    text: getComputedStyle(pulse).color,
    divider: getComputedStyle(divider).borderInlineStartColor,
  };
});
check(heroControls.singleLine, "both mobile CTA labels stay on one line");
check(
  heroControls.text === "rgb(255, 255, 255)" &&
    heroControls.divider === "rgb(181, 31, 46)",
  "the participation CTA keeps white text and a red divider",
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
  active.heroTop < 0 && active.statusTop > 0 && active.statusTop < 844,
  "both planes move through intermediate positions instead of jumping",
  JSON.stringify(active),
);
check(active.navVisibility === "hidden", "the mobile header leaves with screen one");

await page.waitForTimeout(950);
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
