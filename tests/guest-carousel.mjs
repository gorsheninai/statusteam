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

const angleDelta = (from, to) => ((to - from) + 360) % 360;

for (const [name, width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("console", (message) =>
    message.type() === "error" && errors.push(message.text()),
  );
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const section = page.locator(".st2-vanguard");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const stage = page.locator(".st2-guest-stage");
  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(await section.isVisible(), `[${name}] carousel section is visible`);
  expect(
    (await page.locator(".st2-guest").count()) === 8,
    `[${name}] carousel contains eight guest cards`,
  );
  expect(
    (await page.locator(".st2-guest-nav, .st2-guest-footer").count()) === 0,
    `[${name}] arrows and pagination remain absent`,
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
    `[${name}] no horizontal overflow`,
  );
  expect(
    (await stage.getAttribute("data-cycle-seconds")) === "21",
    `[${name}] full cylindrical cycle is 21 seconds`,
  );
  expect(
    (await stage.getAttribute("data-rotating")) === "true",
    `[${name}] carousel starts in autonomous rotation`,
  );

  const samples = [];
  for (let index = 0; index < 6; index += 1) {
    samples.push(Number(await stage.getAttribute("data-rotation-angle")));
    await page.waitForTimeout(140);
  }
  const deltas = samples.slice(1).map((angle, index) =>
    angleDelta(samples[index], angle),
  );
  expect(
    deltas.every((delta) => delta > 0.6 && delta < 4.5),
    `[${name}] rotation advances smoothly every frame without stepping`,
    JSON.stringify(deltas),
  );

  await stage.hover();
  const hoverAngle = Number(await stage.getAttribute("data-rotation-angle"));
  await page.waitForTimeout(420);
  const hoverDelta = angleDelta(
    hoverAngle,
    Number(await stage.getAttribute("data-rotation-angle")),
  );
  expect(
    hoverDelta > 4 && hoverDelta < 11,
    `[${name}] hover does not interrupt autonomous rotation`,
    `${hoverDelta}deg`,
  );

  const activeBeforeClick = Number(await stage.getAttribute("data-active-index"));
  const targetIndex = (activeBeforeClick + 2) % 8;
  const targetButton = page.locator(".st2-guest").nth(targetIndex).locator("button");
  await targetButton.dispatchEvent("click");
  await page.waitForTimeout(820);

  expect(
    Number(await stage.getAttribute("data-active-index")) === targetIndex,
    `[${name}] clicked side card moves to the center`,
  );
  expect(
    (await stage.getAttribute("data-rotating")) === "false",
    `[${name}] click freezes autonomous rotation`,
  );

  const frozenAngle = Number(await stage.getAttribute("data-rotation-angle"));
  await page.waitForTimeout(900);
  const frozenAngleAfter = Number(await stage.getAttribute("data-rotation-angle"));
  expect(
    Math.abs(frozenAngleAfter - frozenAngle) < 0.01,
    `[${name}] selected card remains completely frozen`,
    `${frozenAngle} → ${frozenAngleAfter}`,
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
      cardRadius: active
        ? parseFloat(getComputedStyle(active.querySelector(".st2-guest-card")).borderRadius)
        : 0,
      cardOverflow: active
        ? getComputedStyle(active.querySelector(".st2-guest-card")).overflow
        : "",
      cardIsolation: active
        ? getComputedStyle(active.querySelector(".st2-guest-card")).isolation
        : "",
      cardBorder: active
        ? getComputedStyle(active.querySelector(".st2-guest-card")).borderColor
        : "",
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
          return (
            getComputedStyle(card).pointerEvents === "auto" &&
            getComputedStyle(button).cursor === "pointer" &&
            button.tabIndex === 0
          );
        }),
      center: box ? box.left + box.width / 2 : 0,
      viewportCenter: window.innerWidth / 2,
      cardTop: box?.top ?? Infinity,
      cardBottom: box?.bottom ?? Infinity,
      viewportTop: viewportBox?.top ?? -Infinity,
      viewportBottom: viewportBox?.bottom ?? -Infinity,
      perspective: viewport ? getComputedStyle(viewport).perspective : "none",
      titleGap:
        titleBox && viewportBox ? viewportBox.top - titleBox.bottom : Infinity,
      statsGap:
        stageBox && statsBox ? statsBox.top - stageBox.bottom : Infinity,
    };
  });

  expect(geometry.activeOpacity === "1", `[${name}] focused card is fully opaque`);
  expect(geometry.activeZ === "40", `[${name}] focused card owns the front plane`);
  expect(
    geometry.activeTransform.includes("0px) rotateY(0deg) scale(1.1)"),
    `[${name}] focused card lands on the exact front transform`,
    geometry.activeTransform,
  );
  expect(
    geometry.cardRadius >= 16 && geometry.cardRadius <= 20,
    `[${name}] cards retain the 16–20px radius`,
    `${geometry.cardRadius}px`,
  );
  expect(
    geometry.cardOverflow === "hidden" && geometry.cardIsolation === "isolate",
    `[${name}] media and gradients clip inside the rounded card`,
  );
  expect(
    geometry.cardBorder === "rgba(212, 175, 55, 0.45)",
    `[${name}] focused card uses the 45% gold border`,
    geometry.cardBorder,
  );
  expect(geometry.sideOpacity === 0.45, `[${name}] side cards use 45% opacity`);
  expect(
    geometry.sideFilter.includes("grayscale(0.3)"),
    `[${name}] side cards use 30% grayscale`,
    geometry.sideFilter,
  );
  expect(
    geometry.sideTransform.includes("-200px)"),
    `[${name}] side cards sit at -200px depth`,
    geometry.sideTransform,
  );
  expect(geometry.outerOpacity === 0.2, `[${name}] outer cards use 20% opacity`);
  expect(
    geometry.outerFilter.includes("grayscale(0.7)"),
    `[${name}] outer cards use 70% grayscale`,
    geometry.outerFilter,
  );
  expect(
    geometry.outerTransform.includes("-380px)"),
    `[${name}] outer cards sit at -380px depth`,
    geometry.outerTransform,
  );
  expect(geometry.allVisibleCardsClickable, `[${name}] every visible card is interactive`);
  expect(
    Math.abs(geometry.center - geometry.viewportCenter) < 3,
    `[${name}] focused card is centered`,
  );
  expect(
    geometry.cardTop >= geometry.viewportTop - 1 &&
      geometry.cardBottom <= geometry.viewportBottom + 1,
    `[${name}] complete focused card remains visible`,
  );
  expect(geometry.perspective !== "none", `[${name}] 3D perspective remains active`);
  expect(
    geometry.titleGap >= 24 && geometry.titleGap <= 33,
    `[${name}] title-to-carousel spacing stays compact`,
    `${geometry.titleGap}px`,
  );
  expect(
    geometry.statsGap >= 63 && geometry.statsGap <= 65,
    `[${name}] stats stay 64px below the carousel`,
    `${geometry.statsGap}px`,
  );

  await targetButton.dispatchEvent("click");
  await page.waitForTimeout(350);
  expect(
    (await stage.getAttribute("data-rotating")) === "true",
    `[${name}] clicking the frozen center card resumes rotation`,
  );
  const resumedAngle = Number(await stage.getAttribute("data-rotation-angle"));
  await page.waitForTimeout(420);
  expect(
    angleDelta(
      resumedAngle,
      Number(await stage.getAttribute("data-rotation-angle")),
    ) > 4,
    `[${name}] rotation continues smoothly after resume`,
  );

  await stage.focus();
  const beforeKeyboard = Number(await stage.getAttribute("data-active-index"));
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(820);
  expect(
    Number(await stage.getAttribute("data-active-index")) ===
      (beforeKeyboard + 1) % 8,
    `[${name}] keyboard centers the next guest`,
  );
  expect(
    (await stage.getAttribute("data-rotating")) === "false",
    `[${name}] keyboard selection freezes the carousel`,
  );

  await section.screenshot({ path: `${OUT}/guest-carousel-${name}.png` });
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`Guest carousel: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Guest carousel: PASS (continuous, freeze, responsive)");
}
