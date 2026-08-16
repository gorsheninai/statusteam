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
  const podium = page.locator("[data-st2-stats-podium]");
  await podium.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const state = await page.evaluate(() => {
    const podium = document.querySelector("[data-st2-stats-podium]");
    const grid = document.querySelector(".st2-stats");
    const style = podium ? getComputedStyle(podium) : null;
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
    const stage = document.querySelector(".st2-guest-stage");
    const podiumBox = podium?.getBoundingClientRect();
    const stageBox = stage?.getBoundingClientRect();
    return {
      columns,
      radius: parseFloat(style?.borderRadius || "0"),
      background: style?.backgroundColor,
      border: style?.borderColor,
      backdrop: style?.backdropFilter || style?.webkitBackdropFilter,
      shadow: style?.boxShadow,
      numbers: [...document.querySelectorAll(".st2-stat-figure")].map((el) => el.textContent?.trim()),
      labelsUppercase: [...document.querySelectorAll(".st2-stat-label")].every(
        (el) => getComputedStyle(el).textTransform === "uppercase",
      ),
      integrationGap: podiumBox && stageBox ? podiumBox.top - stageBox.bottom : Infinity,
      noOverflow:
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    };
  });

  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(state.columns === (width >= 768 ? 4 : 2), `[${name}] responsive stats grid is correct`, String(state.columns));
  expect(state.radius === 16, `[${name}] podium uses a 16px radius`, `${state.radius}px`);
  expect(state.background === "rgba(255, 255, 255, 0.02)", `[${name}] podium uses 2% glass fill`, state.background);
  expect(state.border === "rgba(212, 175, 55, 0.25)", `[${name}] podium has a subtle metallic edge`, state.border);
  expect(state.backdrop.includes("blur(24px)"), `[${name}] backdrop blur is active`, state.backdrop);
  expect(state.shadow.includes("rgba(0, 0, 0, 0.7)"), `[${name}] floating shadow is present`, state.shadow);
  expect(JSON.stringify(state.numbers) === JSON.stringify(expectedNumbers), `[${name}] metric values remain unchanged`, state.numbers.join(" | "));
  expect(state.labelsUppercase, `[${name}] labels remain uppercase utility type`);
  expect(
    state.integrationGap >= -1 && state.integrationGap <= (width >= 700 ? 1 : 17),
    `[${name}] podium is integrated directly under the carousel`,
    `${state.integrationGap}px`,
  );
  expect(state.noOverflow, `[${name}] no horizontal overflow`);

  await podium.screenshot({ path: `${OUT}/stats-podium-${name}.png` });
  await context.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(100);

  const firstCounter = page.locator("[data-st2-count]").first();
  expect((await firstCounter.textContent()) === "0", "count-up starts at zero before entering view");

  const podium = page.locator("[data-st2-stats-podium]");
  await podium.scrollIntoViewIfNeeded();
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
  console.log("Stats podium: PASS (desktop, tablet, mobile, count-up, shimmer)");
}
