import { chromium } from "playwright";
import fs from "node:fs";

fs.mkdirSync("test-results", { recursive: true });

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const viewports = [
  ["desktop", 1440, 900],
  ["laptop", 1024, 768],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["mobile-small", 360, 780],
];

const browser = await chromium.launch();
const failures = [];
const expect = (value, message, detail = "") => {
  if (!value) failures.push(`${message}${detail ? ` — ${detail}` : ""}`);
};

for (const [name, width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2400);
  const section = page.locator(".st2-vanguard");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(await section.isVisible(), `[${name}] archive section is visible`);
  expect(
    (await page.locator(".st2-guest").count()) === 7,
    `[${name}] carousel contains seven unique frames`,
  );

  const order = await page.locator(".st2-guest img").evaluateAll((images) =>
    images.map((image) => image.getAttribute("src")?.match(/show-(\d+)-/)?.[1]),
  );
  expect(
    order.join(" ") === "1 2 3 5 4 7 6",
    `[${name}] frames keep the curated order`,
    order.join(" → "),
  );
  expect(
    (await page.getByText("Предыдущий показ · Москва", { exact: true }).count()) === 1,
    `[${name}] previous-show context is present`,
  );
  expect(
    (await page.locator(".st2-guest-nav-button").count()) === 2,
    `[${name}] both desktop controls exist`,
  );

  const geometry = await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    const card = document.querySelector(".st2-guest");
    const stage = document.querySelector(".st2-guest-stage");
    const lead = document.querySelector(".st2-vanguard-intro");
    const heading = document.querySelector(".st2-vanguard-head");
    const title = document.querySelector(".st2-vanguard-tag");
    const scaleTitle = document.querySelector(".st2-scale-title");
    const nav = document.querySelector(".st2-guest-nav");
    const footer = document.querySelector(".st2-guest-footer");
    const stripBox = strip.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    const leadBox = lead.getBoundingClientRect();
    const headingBox = heading.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    return {
      gap: parseFloat(getComputedStyle(strip).columnGap),
      aspect: cardBox.width / cardBox.height,
      stripWidth: stripBox.width,
      cardWidth: cardBox.width,
      alignment: Math.abs(stripBox.left - headingBox.left),
      titleFits: titleBox.right <= headingBox.right + 1,
      titleSizeDelta: Math.abs(
        parseFloat(getComputedStyle(title).fontSize) -
          parseFloat(getComputedStyle(scaleTitle).fontSize),
      ),
      titleLineHeightDelta: Math.abs(
        parseFloat(getComputedStyle(title).lineHeight) -
          parseFloat(getComputedStyle(scaleTitle).lineHeight),
      ),
      copyGap: stageBox.top - leadBox.bottom,
      navDisplay: getComputedStyle(nav).display,
      footerDisplay: getComputedStyle(footer).display,
      counter: document.querySelector(".st2-guest-counter")?.textContent?.replace(/\s+/g, " ").trim(),
      firstDisabled: document.querySelector(".st2-guest-nav-button.is-prev")?.disabled,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(geometry.gap >= 11.5 && geometry.gap <= 12.5, `[${name}] cards use a 12px gap`, `${geometry.gap}px`);
  expect(Math.abs(geometry.aspect - 0.75) < 0.02, `[${name}] cards use a 3:4 editorial ratio`, geometry.aspect.toFixed(3));
  expect(geometry.alignment < 1.5, `[${name}] carousel aligns with the copy`, `${geometry.alignment}px`);
  expect(geometry.copyGap >= 32 && geometry.copyGap <= 58, `[${name}] copy and imagery have a deliberate pause`, `${geometry.copyGap}px`);
  expect(geometry.footerDisplay === "grid", `[${name}] progress and counter are visible`);
  expect(geometry.firstDisabled, `[${name}] previous control is disabled at the start`);
  expect(geometry.pageOverflow <= 1, `[${name}] no page-level horizontal overflow`, `${geometry.pageOverflow}px`);

  if (width < 768) {
    expect(geometry.titleFits, `[${name}] archive title fits without clipping`);
    expect(
      geometry.titleSizeDelta < 0.1 && geometry.titleLineHeightDelta < 0.1,
      `[${name}] archive and scale titles use the same mobile size`,
      `${geometry.titleSizeDelta}px / ${geometry.titleLineHeightDelta}px`,
    );
    expect(geometry.navDisplay === "none", `[${name}] phone navigation is swipe-only`);
    expect(geometry.counter === "01 / 07", `[${name}] phone counter starts at 01 / 07`, geometry.counter);
    expect(geometry.cardWidth / width >= 0.79 && geometry.cardWidth / width <= 0.83, `[${name}] one large card plus a controlled next-card peek`, `${geometry.cardWidth}px`);
  } else {
    expect(geometry.navDisplay !== "none", `[${name}] desktop arrows are visible`);
    expect(geometry.counter === "01–03 / 07", `[${name}] desktop counter shows the visible range`, geometry.counter);
    expect(Math.abs(geometry.cardWidth - (geometry.stripWidth - 24) / 3) < 1.5, `[${name}] desktop shows exactly three frames`, `${geometry.cardWidth}px`);
  }

  if (width >= 768) {
    await page.locator(".st2-guest-nav-button.is-next").click();
    await page.waitForTimeout(500);
    expect(
      (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === "1",
      `[${name}] next control advances by one frame`,
    );
  }

  await page.screenshot({ path: `test-results/guest-carousel-${name}.png`, fullPage: false });
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Guest carousel verified at desktop, laptop, tablet and phone widths.");
