import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const OUT = "test-results";
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["mobile-small", 320, 720],
];

const expectedNumbers = ["60K+", "10M+", "2", "600+"];
const failures = [];
const expect = (value, message, detail = "") => {
  if (!value) failures.push(`${message}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();

for (const [name, width, height] of viewports) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const band = page.locator("[data-st2-stats-band]");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const state = await page.evaluate(() => {
    const band = document.querySelector("[data-st2-stats-band]");
    const grid = document.querySelector(".st2-stats");
    const style = band ? getComputedStyle(band) : null;
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
    const stage = document.querySelector(".st2-guest-strip");
    const bandBox = band?.getBoundingClientRect();
    const stageBox = stage?.getBoundingClientRect();
    return {
      columns,
      radius: parseFloat(style?.borderRadius || "0"),
      background: style?.backgroundColor,
      borderTop: style?.borderTopColor,
      borderRightWidth: style?.borderRightWidth,
      borderBottomWidth: style?.borderBottomWidth,
      borderLeftWidth: style?.borderLeftWidth,
      backdrop: style?.backdropFilter || style?.webkitBackdropFilter,
      shadow: style?.boxShadow,
      numbers: [...document.querySelectorAll(".st2-stat-figure")].map((el) => el.textContent?.trim()),
      labelsUppercase: [...document.querySelectorAll(".st2-stat-label")].every(
        (el) => getComputedStyle(el).textTransform === "uppercase",
      ),
      integrationGap: bandBox && stageBox ? bandBox.top - stageBox.bottom : Infinity,
      noOverflow:
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    };
  });

  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(state.columns === (width >= 768 ? 4 : 2), `[${name}] responsive stats grid is correct`, String(state.columns));
  expect(state.radius === 0, `[${name}] stats band has no rounded container`, `${state.radius}px`);
  expect(state.background === "rgba(0, 0, 0, 0)", `[${name}] stats band has no card fill`, state.background);
  expect(state.borderTop === "rgba(255, 255, 255, 0.1)", `[${name}] stats band uses one subtle top rule`, state.borderTop);
  expect(
    [state.borderRightWidth, state.borderBottomWidth, state.borderLeftWidth].every((value) => value === "0px"),
    `[${name}] stats band has no enclosing border`,
  );
  expect(state.backdrop === "none", `[${name}] stats band has no dashboard blur`, state.backdrop);
  expect(state.shadow === "none", `[${name}] stats band has no widget shadow`, state.shadow);
  expect(JSON.stringify(state.numbers) === JSON.stringify(expectedNumbers), `[${name}] metric values remain unchanged`, state.numbers.join(" | "));
  expect(state.labelsUppercase, `[${name}] labels remain uppercase utility type`);
  expect(
    state.integrationGap >= 63 && state.integrationGap <= 65,
    `[${name}] stats band begins 64px below the carousel`,
    `${state.integrationGap}px`,
  );
  expect(state.noOverflow, `[${name}] no horizontal overflow`);

  await band.screenshot({ path: `${OUT}/stats-band-${name}.png` });
  await context.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(100);

  const firstCounter = page.locator("[data-st2-count]").first();
  expect((await firstCounter.textContent()) === "0", "count-up starts at zero before entering view");

  const band = page.locator("[data-st2-stats-band]");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const midValue = Number(await firstCounter.textContent());
  expect(midValue > 0 && midValue < 60, "counter progresses through an intermediate value", String(midValue));

  await page.waitForTimeout(1300);
  const finalNumbers = await page.locator(".st2-stat-figure").allTextContents({ timeoutMs: 5000 });
  expect(JSON.stringify(finalNumbers.map((value) => value.trim())) === JSON.stringify(expectedNumbers), "count-up completes with all suffixes");

  await page.waitForTimeout(800);
  const shimmer = await page.locator("[data-st2-stat-sheen]").first().evaluate((el) => ({
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));
  expect(shimmer.opacity === "0", "metallic sheen settles back to transparent", shimmer.opacity);
  expect(shimmer.transform !== "none", "metallic sheen completes a horizontal sweep", shimmer.transform);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`Stats podium: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Stats band: PASS (desktop, tablet, mobile, count-up, shimmer)");
}
