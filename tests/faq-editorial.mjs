import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const viewports = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["mobile-small", 320, 720],
];
const expectedQuestions = [
  "С какого возраста вход?",
  "Какой предусмотрен дресс-код?",
  "Где и во сколько проходит показ?",
  "Как оформить возврат или передать билет?",
  "Разрешена ли профессиональная фотосъёмка?",
];
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
  await page.goto(`${URL}/#faq`, { waitUntil: "domcontentloaded" });
  const heading = page.locator(".faq-h");
  const faq = page.locator(".faq");
  const state = await page.evaluate(() => {
    const section = document.querySelector(".faq-scene");
    const heading = document.querySelector(".faq-h");
    const list = document.querySelector(".faq");
    const headingStyle = heading ? getComputedStyle(heading) : null;
    const sectionStyle = section ? getComputedStyle(section) : null;
    const headingBox = heading?.getBoundingClientRect();
    const listBox = list?.getBoundingClientRect();
    return {
      paddingTop: parseFloat(sectionStyle?.paddingTop || "0"),
      paddingBottom: parseFloat(sectionStyle?.paddingBottom || "0"),
      headingWhiteSpace: headingStyle?.whiteSpace,
      headingFontSize: parseFloat(headingStyle?.fontSize || "0"),
      headingHeight: headingBox?.height || 0,
      headingLineHeight: parseFloat(headingStyle?.lineHeight || "0"),
      titleGap: headingBox && listBox ? listBox.top - headingBox.bottom : Infinity,
      listWidth: listBox?.width || Infinity,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const questions = (await page.locator(".faq-q > span:first-child").allTextContents()).map((q) => q.trim());
  expect(JSON.stringify(questions) === JSON.stringify(expectedQuestions), `[${name}] FAQ uses the approved five questions`);
  expect(state.paddingTop === (width >= 768 ? 80 : 64), `[${name}] compact section top padding`, `${state.paddingTop}px`);
  expect(state.paddingBottom === (width >= 768 ? 80 : 64), `[${name}] compact section bottom padding`, `${state.paddingBottom}px`);
  expect(state.headingWhiteSpace === "nowrap", `[${name}] heading stays on one line`, state.headingWhiteSpace);
  expect(state.headingHeight <= state.headingLineHeight * 1.1, `[${name}] heading does not wrap`, `${state.headingHeight}px`);
  expect(state.headingFontSize >= 28 && state.headingFontSize <= 44, `[${name}] heading uses restrained fluid sizing`, `${state.headingFontSize}px`);
  expect(state.titleGap >= 32 && state.titleGap <= 49, `[${name}] title-to-accordion gap is compact`, `${state.titleGap}px`);
  expect(state.listWidth <= Math.min(896, width), `[${name}] accordion stays within the editorial measure`, `${state.listWidth}px`);
  expect(state.overflow <= 1, `[${name}] FAQ creates no horizontal overflow`, `${state.overflow}px`);

  const row = page.locator(".faq-row").nth(1);
  const button = row.locator(".faq-q");
  expect((await button.evaluate((el) => el.getBoundingClientRect().height)) >= 44, `[${name}] question has a touch-safe target`);
  await button.click();
  expect((await button.getAttribute("aria-expanded")) === "true", `[${name}] accordion exposes its open state`);
  expect((await row.locator(".panel").getAttribute("aria-hidden")) === "false", `[${name}] answer becomes accessible`);
  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(`FAQ editorial: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("FAQ editorial: PASS (desktop, tablet, mobile, accordion)");
}
