/* The phone hand-off between screen 1 and screen 2.

   Everything here is driven through CDP's Input.dispatchTouchEvent rather
   than synthetic TouchEvents: only a trusted touch actually scrolls the
   page, and half of what this file asserts is that the page does NOT
   scroll — which a synthetic event could never prove. */
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";

const browser = await chromium.launch();
const failures = [];
const expect = (value, message, detail = "") => {
  if (!value) failures.push(`${message}${detail ? ` — ${detail}` : ""}`);
};

const openPhone = async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  return { context, page, cdp };
};

const swipe = async (cdp, distance, { steps = 6, settle = 16 } = {}) => {
  const from = distance > 0 ? 640 : 240;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: from }],
  });
  for (let i = 1; i <= steps; i += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195, y: from - (distance * i) / steps }],
    });
    await new Promise((r) => setTimeout(r, settle));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};

const scrollY = (page) => page.evaluate(() => window.scrollY);

/* The hand-off marks the document while it runs. Waiting on the mark rather
   than on a scroll position is the difference between "arrived" and
   "finished": the last frames of the travel would otherwise overwrite
   anything the test does in between. */
const settled = (page) =>
  page.waitForFunction(
    () => !document.documentElement.classList.contains("is-gated"),
    undefined,
    { timeout: 5000 },
  );

/* ---------------- phone ---------------- */
{
  const { context, page, cdp } = await openPhone();

  expect(
    await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    "the emulated phone reports a coarse pointer",
  );

  const gate = await page.evaluate(() => {
    const stage = document.querySelector(".hero-stage");
    return stage.getBoundingClientRect().bottom + window.scrollY;
  });
  expect(gate > 500, "screen 2 starts one viewport down", `${gate}px`);

  expect((await scrollY(page)) === 0, "the page opens on screen 1");

  /* Under the threshold the gate must hold — and the platform must not be
     allowed to scroll the page underneath it either. */
  await swipe(cdp, 40);
  await page.waitForTimeout(400);
  expect(
    (await scrollY(page)) === 0,
    "a swipe under 60px leaves screen 1 in place",
    `${await scrollY(page)}px`,
  );

  /* Over it, the hand-off plays to completion on its own. Sample the travel
     from inside the page so the curve is measured against its own clock
     rather than against the test's. */
  await page.evaluate(() => {
    window.__gate = [];
    const t0 = performance.now();
    let seen = false;
    const sample = () => {
      const running = document.documentElement.classList.contains("is-gated");
      if (running) seen = true;
      window.__gate.push([performance.now() - t0, window.scrollY, running]);
      /* Runs until the hand-off has both started and finished, with a hard
         stop so a failure cannot leave a rAF loop spinning. */
      if ((!seen || running) && performance.now() - t0 < 6000) {
        requestAnimationFrame(sample);
      }
    };
    requestAnimationFrame(sample);
  });

  await swipe(cdp, 150);
  await settled(page);

  const curve = await page.evaluate(() => window.__gate);
  /* Bracketed by the mark, not by the first non-zero scroll: this easing is
     so flat at the start that the page has not visibly moved for the first
     tenth of it, which would put the whole curve out of phase. */
  const moving = curve.filter(([, , running]) => running);
  const startedAt = moving.length ? moving[0][0] : 0;
  const finishedAt = moving.length ? moving[moving.length - 1][0] : 0;
  const duration = finishedAt - startedAt;

  expect(
    duration > 780 && duration < 1050,
    "the hand-off runs for its 850-950ms",
    `${Math.round(duration)}ms`,
  );

  /* cubic-bezier(0.76, 0, 0.24, 1): heavy at both ends, symmetric through
     the middle. A quarter of the way through, barely a tenth of the travel
     has happened; halfway through, exactly half of it has. */
  const at = (fraction) => {
    const target = startedAt + duration * fraction;
    const point = moving.reduce((best, p) =>
      Math.abs(p[0] - target) < Math.abs(best[0] - target) ? p : best,
    );
    return point[1] / gate;
  };

  expect(
    at(0.25) < 0.15,
    "the transition starts heavy rather than snapping away",
    at(0.25).toFixed(3),
  );
  expect(
    Math.abs(at(0.5) - 0.5) < 0.08,
    "it is symmetric through the middle",
    at(0.5).toFixed(3),
  );
  expect(
    at(0.75) > 0.85,
    "and lands heavy rather than drifting in",
    at(0.75).toFixed(3),
  );

  expect(
    Math.abs((await scrollY(page)) - gate) < 2,
    "it settles exactly on the top of screen 2",
    `${await scrollY(page)} vs ${gate}`,
  );

  /* Nothing faded, blurred or scaled on the way. */
  const optics = await page.evaluate(() => {
    const stage = getComputedStyle(document.querySelector(".hero-stage"));
    const frame = getComputedStyle(document.querySelector(".hero-frame"));
    const st = getComputedStyle(document.querySelector(".st"));
    return {
      stageOpacity: stage.opacity,
      stageFilter: stage.filter,
      frameTransform: frame.transform,
      radius: parseFloat(st.borderTopLeftRadius),
      shadow: st.boxShadow,
    };
  });
  expect(optics.stageOpacity === "1", "the hero never fades", optics.stageOpacity);
  expect(optics.stageFilter === "none", "the hero is never blurred", optics.stageFilter);
  expect(
    optics.frameTransform === "none" || optics.frameTransform === "matrix(1, 0, 0, 1, 0, 0)",
    "the hero is never scaled",
    optics.frameTransform,
  );
  expect(optics.radius === 0, "screen 2 has no card lip", `${optics.radius}px`);
  expect(optics.shadow === "none", "screen 2 casts no card shadow", optics.shadow);

  /* Past the seam the site scrolls normally again. */
  await swipe(cdp, 220);
  await page.waitForTimeout(600);
  expect(
    (await scrollY(page)) > gate + 40,
    "screen 2 hands the page back to normal scrolling",
    `${await scrollY(page)} vs ${gate}`,
  );

  /* Back at the exact top of screen 2, a downward swipe returns to the hero. */
  await page.evaluate((target) => window.scrollTo(0, target), gate);
  await page.waitForTimeout(300);
  await swipe(cdp, -150);
  await settled(page);
  expect((await scrollY(page)) < 2, "a downward swipe returns to screen 1",
    `${await scrollY(page)}px`);

  /* And a small one does not. */
  await page.evaluate((target) => window.scrollTo(0, target), gate);
  await page.waitForTimeout(300);
  await swipe(cdp, -40);
  await page.waitForTimeout(400);
  expect(
    Math.abs((await scrollY(page)) - gate) < 3,
    "a downward swipe under 60px stays on screen 2",
    `${await scrollY(page)} vs ${gate}`,
  );

  await context.close();
}

/* ---------------- desktop keeps its own hand-off ---------------- */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(300);
  expect(
    (await scrollY(page)) > 200,
    "a pointer device is never gated",
    `${await scrollY(page)}px`,
  );
  await context.close();
}

/* ---------------- reduced motion is a plain document ---------------- */
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await swipe(cdp, 150);
  await page.waitForTimeout(500);
  expect(
    (await scrollY(page)) > 0,
    "reduced motion scrolls the page instead of gating it",
    `${await scrollY(page)}px`,
  );
  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(`Hero gate: ${failures.length} failure(s)`);
  failures.forEach((f) => console.error(`- ${f}`));
  process.exitCode = 1;
} else {
  console.log("Hero gate: PASS (holds, commits, returns, stays optical-free)");
}
