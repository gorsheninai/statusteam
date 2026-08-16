import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const OUT = "test-results";
fs.mkdirSync(OUT, { recursive: true });

const sizes = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["mobile-small", 360, 780],
];

const browser = await chromium.launch();
const failures = [];
const expect = (value, message, detail = "") => {
  if (!value) failures.push(`${message}${detail ? ` — ${detail}` : ""}`);
};

for (const [name, width, height] of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const intro = page.locator(".pulse-intro");
  await intro.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const state = await page.evaluate(() => {
    const intro = document.querySelector(".pulse-intro");
    const title = document.querySelector(".pulse-title");
    const titleFit = document.querySelector(".pulse-title-fit");
    const introBox = intro?.getBoundingClientRect();
    const titleBox = titleFit?.getBoundingClientRect();
    const titleStyle = title ? getComputedStyle(title) : null;
    const introStyle = intro ? getComputedStyle(intro) : null;
    const grainStyle = intro ? getComputedStyle(intro, "::after") : null;
    return {
      text: title?.textContent?.trim(),
      subtitleCount: document.querySelectorAll(".pulse-intro p").length,
      whiteSpace: titleStyle?.whiteSpace,
      background: introStyle?.backgroundColor,
      paddingTop: parseFloat(introStyle?.paddingTop || "0"),
      paddingLeft: parseFloat(introStyle?.paddingLeft || "0"),
      introHeight: introBox?.height || 0,
      fits:
        Boolean(introBox && titleBox) &&
        titleBox.left >= introBox.left - 1 &&
        titleBox.right <= introBox.right + 1,
      visible: titleStyle?.opacity === "1" && titleStyle?.visibility !== "hidden",
      grainOpacity: grainStyle?.opacity,
      grainImage: grainStyle?.backgroundImage,
      noOverflow:
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    };
  });

  const isDesktopPadding = width >= 768;
  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(state.text === "ПУЛЬС КОНТИНЕНТА", `[${name}] exact title is rendered`);
  expect(state.subtitleCount === 0, `[${name}] no subtitle or metadata remains`);
  expect(state.whiteSpace === "nowrap", `[${name}] title stays on one line`);
  expect(state.background === "rgb(10, 10, 10)", `[${name}] section uses #0A0A0A`);
  expect(state.paddingTop === (isDesktopPadding ? 64 : 40), `[${name}] vertical padding is compact`);
  expect(state.paddingLeft === (isDesktopPadding ? 24 : 16), `[${name}] horizontal padding matches spec`);
  expect(state.introHeight < (isDesktopPadding ? 240 : 150), `[${name}] title section remains compact`, `${state.introHeight}px`);
  expect(state.fits, `[${name}] single-line title fits without clipping`);
  expect(state.visible, `[${name}] reduced motion leaves the title visible`);
  expect(state.grainOpacity === "0.04", `[${name}] film grain is kept at 4% opacity`);
  expect(state.grainImage !== "none", `[${name}] procedural grain texture is present`);
  expect(state.noOverflow, `[${name}] no horizontal overflow`);

  await intro.screenshot({ path: `${OUT}/pulse-title-${name}.png` });
  await context.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(100);
  const title = page.locator(".pulse-title");
  expect(Number(await title.evaluate((node) => getComputedStyle(node).opacity)) < 0.1, "animation starts concealed");
  await page.locator(".pulse-intro").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1650);
  const end = await title.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      opacity: Number(style.opacity),
      filter: style.filter,
      transform: style.transform,
      maskPosition: style.maskPosition,
    };
  });
  expect(end.opacity > 0.99, "ScrollTrigger fully reveals the title");
  expect(end.filter === "blur(0px)" || end.filter === "none", "sand haze resolves to sharp type", end.filter);
  expect(end.transform === "matrix(1, 0, 0, 1, 0, 0)" || end.transform === "none", "physical lift settles at zero", end.transform);
  expect(end.maskPosition.startsWith("100%"), "sand mask completes its left-to-right sweep", end.maskPosition);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`Pulse title: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Pulse title: PASS (desktop, tablet, mobile, animation)");
}
