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
const expectedAnswers = [
  "Показ 18+. На входе потребуется документ, удостоверяющий личность.",
  "Evening / Cocktail attire. Главное — соответствовать эстетике вечера.",
  "Показ пройдёт в Москве. Точные дата, площадка и время будут объявлены позже.",
  "Возврат осуществляется по правилам билетного оператора до даты проведения шоу.",
  "Съемка на смартфоны приветствуется. Профессиональная техника — строго по аккредитации для СМИ.",
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
    const layout = document.querySelector(".faq-layout");
    const intro = document.querySelector(".faq-intro");
    const sectionStyle = section ? getComputedStyle(section) : null;
    const layoutStyle = layout ? getComputedStyle(layout) : null;
    const introStyle = intro ? getComputedStyle(intro) : null;
    const headingBox = heading?.getBoundingClientRect();
    const listBox = list?.getBoundingClientRect();
    const introBox = intro?.getBoundingClientRect();
    return {
      paddingTop: parseFloat(sectionStyle?.paddingTop || "0"),
      paddingBottom: parseFloat(sectionStyle?.paddingBottom || "0"),
      columns: layoutStyle?.gridTemplateColumns || "",
      sticky: introStyle?.position || "",
      introLeft: introBox?.left || 0,
      introRight: introBox?.right || 0,
      introBottom: introBox?.bottom || 0,
      listLeft: listBox?.left || 0,
      listTop: listBox?.top || 0,
      listWidth: listBox?.width || Infinity,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const questions = (await page.locator(".faq-q > span:first-child").allTextContents()).map((q) => q.trim());
  const answers = (await page.locator(".panel-inner p").allTextContents()).map((a) => a.trim());
  expect(JSON.stringify(questions) === JSON.stringify(expectedQuestions), `[${name}] FAQ uses the approved five questions`);
  expect(JSON.stringify(answers) === JSON.stringify(expectedAnswers), `[${name}] FAQ uses the approved five answers`);
  expect(state.paddingTop === (width >= 768 ? 112 : 80), `[${name}] section top padding follows the editorial rhythm`, `${state.paddingTop}px`);
  expect(state.paddingBottom === (width >= 768 ? 112 : 80), `[${name}] section bottom padding follows the editorial rhythm`, `${state.paddingBottom}px`);
  expect(width >= 768 ? state.introRight < state.listLeft : state.listTop > state.introBottom, `[${name}] editorial layout switches cleanly`);
  expect(width >= 768 ? state.sticky === "sticky" : state.sticky !== "sticky", `[${name}] introduction is sticky on desktop only`, state.sticky);
  expect(width >= 768 ? state.columns.split(" ").length === 2 : state.columns.split(" ").length === 1, `[${name}] correct grid column count`, state.columns);
  expect(state.listWidth <= 720, `[${name}] accordion stays within the editorial measure`, `${state.listWidth}px`);
  expect(state.overflow <= 1, `[${name}] FAQ creates no horizontal overflow`, `${state.overflow}px`);

  expect((await heading.textContent())?.trim() === "Что нужно знать", `[${name}] heading text is preserved`);
  expect((await page.locator(".faq-copy").textContent())?.replace(/\s+/g, " ").trim() === "Ответы на главные вопросы о шоу, дресс-коде и билетах. Остались вопросы?", `[${name}] supporting copy is present`);
  expect((await page.locator(".faq-contact").textContent())?.replace(/\s+/g, " ").trim() === "Служба заботы / Telegram ↗", `[${name}] concierge link is present`);
  expect((await page.locator(".faq-contact").getAttribute("href")) === "https://t.me/statusteamru", `[${name}] concierge link opens STATUS TEAM Telegram`);

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
