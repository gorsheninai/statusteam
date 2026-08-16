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
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    `[${name}] no horizontal overflow`,
  );

  const geometry = await page.evaluate(() => {
    const active = document.querySelector(".st2-guest.is-active");
    const side = [...document.querySelectorAll(".st2-guest")].find((card) => card !== active);
    const nav = document.querySelector(".st2-guest-nav");
    const viewport = document.querySelector(".st2-guest-viewport");
    const box = active?.getBoundingClientRect();
    return {
      activeOpacity: active ? getComputedStyle(active).opacity : "0",
      sideOpacity: side ? Number(getComputedStyle(side).opacity) : 1,
      center: box ? box.left + box.width / 2 : 0,
      viewportCenter: window.innerWidth / 2,
      navWidth: nav?.getBoundingClientRect().width ?? 0,
      navHeight: nav?.getBoundingClientRect().height ?? 0,
      perspective: viewport ? getComputedStyle(viewport).perspective : "none",
    };
  });

  expect(geometry.activeOpacity === "1", `[${name}] active card is fully opaque`);
  expect(geometry.sideOpacity < 0.7, `[${name}] side cards are visually recessed`);
  expect(Math.abs(geometry.center - geometry.viewportCenter) < 3, `[${name}] active card is centered`);
  expect(geometry.navWidth >= 44 && geometry.navHeight >= 44, `[${name}] navigation touch target is at least 44px`);
  expect(geometry.perspective !== "none", `[${name}] 3D perspective is active`);

  await page.locator(".st2-guest-nav.is-next").click();
  await page.waitForTimeout(650);
  expect(
    (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === "1",
    `[${name}] arrow advances carousel`,
  );

  await page.locator(".st2-guest-stage").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(650);
  expect(
    (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === "2",
    `[${name}] keyboard advances carousel`,
  );

  const fourthCard = page.getByRole("button", { name: "Гость 04. Показать в центре" });
  await fourthCard.dispatchEvent("click");
  await page.waitForTimeout(650);
  expect(
    (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) === "3",
    `[${name}] clicking a card centers it`,
  );

  const viewportBox = await page.locator(".st2-guest-viewport").boundingBox();
  if (viewportBox) {
    const y = viewportBox.y + viewportBox.height * 0.42;
    const startX = viewportBox.x + viewportBox.width * 0.56;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - Math.min(280, viewportBox.width * 0.5), y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(650);
    expect(
      (await page.locator(".st2-guest-stage").getAttribute("data-active-index")) !== "3",
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
