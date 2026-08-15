import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const OUT = "test-results/polish";
fs.mkdirSync(OUT, { recursive: true });

const sizes = [
  ["desktop-1440", 1440, 900],
  ["desktop-1280", 1280, 800],
  ["tablet-1024", 1024, 768],
  ["tablet-768", 768, 1024],
  ["phone-430", 430, 932],
  ["phone-390", 390, 844],
  ["phone-360", 360, 780],
];

const pass = [];
const fail = [];
const check = (ok, label, extra = "") =>
  (ok ? pass : fail).push(label + (extra ? ` — ${extra}` : ""));

const settle = async (page) => {
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
};

const browser = await chromium.launch();

for (const [name, width, height] of sizes) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`PAGEERROR ${e.message}`));

  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  check(errors.length === 0, `[${name}] no console/page errors`, errors.join(" | ").slice(0, 180));

  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  check(
    overflow.scroll <= overflow.client + 1,
    `[${name}] no horizontal overflow`,
    `${overflow.scroll}>${overflow.client}`,
  );

  const clipped = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".pulse-line, .struct, .campaign"))
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        return el.scrollWidth > el.clientWidth + 1;
      })
      .map((el) => `${(el.textContent || "").trim().slice(0, 24)} ${el.scrollWidth}>${el.clientWidth}`),
  );
  check(clipped.length === 0, `[${name}] display type is not clipped`, clipped.join(" | "));

  check(await page.locator(".nav-tickets").isVisible(), `[${name}] ticket CTA stays visible`);
  check(await page.locator("#hero").isVisible(), `[${name}] hero renders`);
  check(await page.locator("#statusteam").count() === 1, `[${name}] STATUS section exists once`);

  // Current direction: the aftermovie is a real autoplaying muted video,
  // not a click-to-mount placeholder.
  await page.locator("#statusteam").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  check(await page.locator(".reel video").count() === 1, `[${name}] aftermovie video is mounted`);
  check(await page.locator(".reel-sound").isVisible(), `[${name}] aftermovie sound control is reachable`);

  if (width >= 1200) {
    await page.evaluate((vh) => window.scrollTo(0, vh * 0.5), height);
    await page.waitForTimeout(500);
    const stack = await page.evaluate(() => {
      const hero = document.querySelector("#hero")?.getBoundingClientRect();
      const st = document.querySelector("#statusteam")?.getBoundingClientRect();
      return {
        heroTop: hero?.top ?? 9999,
        statusTop: st?.top ?? 9999,
        radius: parseFloat(getComputedStyle(document.querySelector("#statusteam")).borderTopLeftRadius),
      };
    });
    // Lenis can leave the sticky composited layer a few subpixels from zero;
    // anything inside one CSS pixel at normal DPR is visually flush.
    check(Math.abs(stack.heroTop) < 8, `[${name}] hero stays pinned during the hand-off`, String(stack.heroTop));
    check(
      stack.statusTop > height * 0.2 && stack.statusTop < height * 0.8,
      `[${name}] STATUS rises over hero as a card`,
      String(Math.round(stack.statusTop)),
    );
    check(stack.radius > 6, `[${name}] foreground reads as a card mid-transition`, String(stack.radius));

    await page.evaluate((vh) => window.scrollTo(0, vh), height);
    await page.waitForTimeout(500);
    const landed = await page.evaluate(() => ({
      stTop: document.querySelector("#statusteam")?.getBoundingClientRect().top ?? 9999,
      radius: parseFloat(getComputedStyle(document.querySelector("#statusteam")).borderTopLeftRadius),
    }));
    check(Math.abs(landed.stTop) < 4, `[${name}] STATUS resolves to a full second screen`, String(landed.stTop));
    check(landed.radius < 4, `[${name}] card radius resolves away at full screen`, String(landed.radius));

    await page.locator("#pulse").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const heroGone = await page.evaluate(() => {
      const r = document.querySelector("#hero")?.getBoundingClientRect();
      return r ? r.bottom < 1 : false;
    });
    check(heroGone, `[${name}] hero cannot leak underneath screen three`);
  }

  if (width <= 767) {
    await page.locator("#pulse").scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    const mobileTenets = await page.evaluate(() => {
      const tenets = document.querySelector(".tenets");
      const shots = Array.from(document.querySelectorAll(".tenet-shot"));
      const tops = shots.map((el) => el.getBoundingClientRect().top + window.scrollY);
      return {
        pinned: tenets?.classList.contains("is-pinned") ?? false,
        visible: shots.every((el) => Number(getComputedStyle(el).opacity) > 0.9),
        ordered: tops.every((v, i) => i === 0 || v > tops[i - 1]),
      };
    });
    check(!mobileTenets.pinned, `[${name}] phone pulse chapter uses native flow`);
    check(mobileTenets.visible, `[${name}] all four pulse images remain visible in native flow`);
    check(mobileTenets.ordered, `[${name}] pulse cards remain in document order`);
  }

  // The first Experience row is intentionally open on load. Open the second
  // one to verify that the accordion changes state rather than merely exists.
  await page.locator("#experience").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const exp = page.locator(".exp-item").nth(1);
  if (await exp.count()) {
    await exp.locator(".exp-trigger").click();
    await page.waitForTimeout(450);
    check((await exp.getAttribute("class")).includes("is-open"), `[${name}] experience accordion opens`);
  }

  // Reload before screenshots so every capture has a deterministic scroll
  // origin; Lenis deliberately owns scroll and window.scrollTo alone can keep
  // momentum from the interaction checks above.
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/${name}-hero.png`, fullPage: false });
  await page.locator("#statusteam").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-status.png`, fullPage: false });
  await page.locator("#tickets").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-tickets.png`, fullPage: false });

  await ctx.close();
}

// Reduced motion must remain conventional and readable.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "networkidle" });
  const state = await page.evaluate(() => ({
    lenis: document.documentElement.classList.contains("lenis-on"),
    motion: document.documentElement.classList.contains("js-motion"),
    preloader: getComputedStyle(document.querySelector(".preloader")).display,
  }));
  check(!state.lenis && !state.motion, "reduced motion disables Lenis and GSAP motion pass");
  check(state.preloader === "none", "reduced motion skips the preloader");
  await page.close();
}

await browser.close();

console.log(`PASS (${pass.length}):\n  ${pass.join("\n  ")}`);
console.log(fail.length ? `\nFAIL (${fail.length}):\n  ${fail.join("\n  ")}` : "\nFAIL: none");
process.exit(fail.length ? 1 : 0);
