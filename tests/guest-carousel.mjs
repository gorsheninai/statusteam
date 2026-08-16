import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const OUT = "test-results";
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
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
  await page.waitForTimeout(2500);
  const section = page.locator(".st2-vanguard");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);

  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(await section.isVisible(), `[${name}] carousel section is visible`);
  expect(
    (await page.locator(".st2-guest").count()) === 8,
    `[${name}] carousel contains eight guest cards`,
  );
  expect(
    (await page.locator(".st2-vanguard-head p").count()) === 0,
    `[${name}] carousel subtitle is removed`,
  );
  expect(
    (await page.locator(".st2-guest-nav, .st2-guest-footer").count()) === 0,
    `[${name}] arrows and isolated footer controls are removed`,
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    `[${name}] no horizontal overflow`,
  );

  const geometry = await page.evaluate(() => {
    const active = document.querySelector(".st2-guest.is-active");
    const cards = [...document.querySelectorAll(".st2-guest")];
    const side = cards.find((card) => getComputedStyle(card).opacity === "0.45");
    const outer = cards.find((card) => getComputedStyle(card).opacity === "0.2");
    const viewport = document.querySelector(".st2-guest-viewport");
    const stage = document.querySelector(".st2-guest-stage");
    const stats = document.querySelector(".st2-scale");
    const title = document.querySelector(".st2-vanguard-head h2");
    const box = active?.getBoundingClientRect();
    const stageBox = stage?.getBoundingClientRect();
    const statsBox = stats?.getBoundingClientRect();
    const titleBox = title?.getBoundingClientRect();
    const viewportBox = viewport?.getBoundingClientRect();
    return {
      activeOpacity: active ? getComputedStyle(active).opacity : "0",
      activeZ: active ? getComputedStyle(active).zIndex : "0",
      activeTransform: active?.style.transform || "",
      activeRim: active ? getComputedStyle(active.querySelector(".st2-guest-card"), "::after").borderColor : "",
      transitionDuration: active ? getComputedStyle(active).transitionDuration : "",
      sideOpacity: side ? Number(getComputedStyle(side).opacity) : 1,
      sideFilter: side ? getComputedStyle(side).filter : "none",
      sideTransform: side?.style.transform || "",
      outerOpacity: outer ? Number(getComputedStyle(outer).opacity) : 1,
      outerFilter: outer ? getComputedStyle(outer).filter : "none",
      outerTransform: outer?.style.transform || "",
      allVisibleCardsClickable: cards
        .filter((card) => getComputedStyle(card).visibility === "visible")
        .every((card) => {
          const button = card.querySelector("button");
          return getComputedStyle(card).pointerEvents === "auto" && Boolean(button);
        }),
      center: box ? box.left + box.width / 2 : 0,
      viewportCenter: window.innerWidth / 2,
      perspective: viewport ? getComputedStyle(viewport).perspective : "none",
      titleGap: titleBox && viewportBox ? viewportBox.top - titleBox.bottom : Infinity,
      statsGap: stageBox && statsBox ? statsBox.top - stageBox.bottom : Infinity,
    };
  });

  expect(geometry.activeOpacity === "1", `[${name}] active card is fully opaque`);
  expect(geometry.activeZ === "40", `[${name}] active card owns the front plane`);
  expect(
    geometry.activeTransform.includes("0px) rotateY(0deg) scale(1.1)"),
    `[${name}] active card uses the exact front transform`,
    geometry.activeTransform,
  );
  expect(
    geometry.activeRim === "rgba(212, 175, 55, 0.4)",
    `[${name}] active card has the 40% gold rim`,
    geometry.activeRim,
  );
  expect(
    geometry.transitionDuration.split(",")[0].trim() === "0.75s",
    `[${name}] 3D movement settles over 750ms`,
    geometry.transitionDuration,
  );
  expect(geometry.sideOpacity < 0.7, `[${name}] side cards are visually recessed`);
  expect(geometry.sideFilter.includes("grayscale(0.3)"), `[${name}] side cards use 30% grayscale`, geometry.sideFilter);
  expect(geometry.sideTransform.includes("-200px)"), `[${name}] side cards sit at -200px depth`, geometry.sideTransform);
  expect(geometry.outerOpacity === 0.2, `[${name}] outer cards recede to 20% opacity`);
  expect(geometry.outerFilter.includes("grayscale(0.7)"), `[${name}] outer cards use 70% grayscale`, geometry.outerFilter);
  expect(geometry.outerTransform.includes("-380px)"), `[${name}] outer cards sit at -380px depth`, geometry.outerTransform);
  expect(geometry.allVisibleCardsClickable, `[${name}] every visible card is interactive`);
  expect(Math.abs(geometry.center - geometry.viewportCenter) < 3, `[${name}] active card is centered`);
  expect(geometry.perspective !== "none", `[${name}] 3D perspective is active`);
  expect(
    geometry.titleGap >= 24 && geometry.titleGap <= 33,
    `[${name}] title-to-carousel spacing is 24–32px`,
    `${geometry.titleGap}px`,
  );
  expect(
    geometry.statsGap >= 47 && geometry.statsGap <= 49,
    `[${name}] stats follow the carousel within 48px`,
    `${geometry.statsGap}px`,
  );

  const beforeAutoplay = await page.locator(".st2-guest-stage").getAttribute("data-active-index");
  await page.waitForTimeout(3450);
  expect(
    (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) !== beforeAutoplay,
    `[${name}] autoplay advances carousel`,
  );

  await page.locator(".st2-guest-stage").hover();
  await page.waitForTimeout(750);
  const pausedIndex = await page.locator(".st2-guest-stage").getAttribute("data-active-index");
  await page.waitForTimeout(3450);
  expect(
    (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === pausedIndex,
    `[${name}] autoplay pauses on hover`,
  );

  await page.locator(".st2-guest").nth(7).locator("button").dispatchEvent("click");
  await page.mouse.move(1, 1);
  await page.waitForTimeout(3450);
  expect(
    (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === "0",
    `[${name}] infinite loop crosses Guest 08 → Guest 01 without resetting the track`,
  );

  await page.locator(".st2-guest-stage").focus();
  const beforeKeyboard = Number(
    await page.locator(".st2-guest-stage").getAttribute("data-active-index"),
  );
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(800);
  expect(
    Number(await page.locator(".st2-guest-stage").getAttribute("data-active-index")) ===
      (beforeKeyboard + 1) % 8,
    `[${name}] keyboard advances carousel`,
  );

  const beforeClick = Number(
    await page.locator(".st2-guest-stage").getAttribute("data-active-index"),
  );
  const sideIndex = (beforeClick + 2) % 8;
  const sideCard = page.locator(".st2-guest").nth(sideIndex);
  const sideCardBehavior = await sideCard.evaluate((card) => ({
    pointerEvents: getComputedStyle(card).pointerEvents,
    visibility: getComputedStyle(card).visibility,
    cursor: getComputedStyle(card.querySelector("button")).cursor,
    customCursor: document.documentElement.classList.contains("has-cursor"),
  }));
  expect(
    sideCardBehavior.pointerEvents === "auto" &&
      sideCardBehavior.visibility === "visible" &&
      (sideCardBehavior.cursor === "pointer" || sideCardBehavior.customCursor),
    `[${name}] visible side card is clickable and tappable`,
    JSON.stringify(sideCardBehavior),
  );
  await sideCard.locator("button").dispatchEvent("click");
  await page.waitForTimeout(800);
  expect(
    Number(await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === sideIndex,
    `[${name}] clicking a visible side card centers it`,
  );

  const viewportBox = await page.locator(".st2-guest-viewport").boundingBox();
  if (viewportBox) {
    const y = viewportBox.y + viewportBox.height * 0.42;
    const startX = viewportBox.x + viewportBox.width * 0.56;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - Math.min(280, viewportBox.width * 0.5), y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(800);
    expect(
      Number(await page.locator(".st2-guest-stage").getAttribute("data-active-index")) !== sideIndex,
      `[${name}] drag gesture rotates carousel`,
    );
  }

  await section.screenshot({ path: `${OUT}/guest-carousel-${name}.png` });
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`Guest carousel: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Guest carousel: PASS (desktop, tablet, mobile)");
}
