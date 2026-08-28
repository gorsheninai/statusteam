/* The archive strip in «Славянский взгляд».
   The previous version of this file specified a 3D coverflow — rotation
   angles, gold borders, grayscale side cards. That carousel is gone: the
   chapter is now a flat, full-bleed contact sheet moved by the platform's
   own horizontal scroll. What follows is the contract of that strip, and
   most of it is the absence of the old one. */
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2] ?? "http://127.0.0.1:4311";
const OUT = "test-results";
fs.mkdirSync(OUT, { recursive: true });

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
  page.on("console", (message) =>
    message.type() === "error" && errors.push(message.text()),
  );
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  /* The preloader curtain owns the first ~2.1s of a fresh session and would
     otherwise be what the screenshots capture. */
  await page.waitForTimeout(2400);
  const section = page.locator(".st2-vanguard");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  expect(errors.length === 0, `[${name}] no browser errors`, errors.join(" | "));
  expect(await section.isVisible(), `[${name}] archive section is visible`);
  expect(
    (await page.locator(".st2-guest").count()) === 10,
    `[${name}] all ten archive frames are in the strip`,
  );

  /* The chrome the redesign removed must not creep back. */
  expect(
    (await page.locator(
      ".st2-guest-nav, .st2-guest-card, .st2-guest-shade, .st2-guest-viewport, .st2-guest-track",
    ).count()) === 0,
    `[${name}] arrows, cards and shades stay gone`,
  );

  const geometry = await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    const frames = [...document.querySelectorAll(".st2-guest")];
    const first = frames[0];
    const firstStyle = getComputedStyle(first);
    const img = first.querySelector("img");
    const imgStyle = getComputedStyle(img);
    const boxes = frames.map((f) => f.getBoundingClientRect());
    const stripBox = strip.getBoundingClientRect();
    /* The content column inside the shell's gutter — what the strip has to
       escape on both sides to read as full bleed. */
    const column = document.querySelector(".st2-vanguard-head");
    const columnBox = column.getBoundingClientRect();

    /* Largest gap between consecutive frames: the strip is a contact sheet,
       so this has to be zero, not "small". */
    let maxGap = 0;
    for (let i = 1; i < boxes.length; i += 1) {
      maxGap = Math.max(maxGap, boxes[i].left - boxes[i - 1].right);
    }

    return {
      borderWidth: parseFloat(firstStyle.borderTopWidth),
      radius: parseFloat(firstStyle.borderTopLeftRadius),
      boxShadow: firstStyle.boxShadow,
      filter: firstStyle.filter,
      transform: firstStyle.transform,
      opacity: Number(firstStyle.opacity),
      transition: firstStyle.transitionProperty,
      imgFilter: imgStyle.filter,
      imgTransition: imgStyle.transitionProperty,
      imgFit: imgStyle.objectFit,
      aspect: boxes[0].width / boxes[0].height,
      perspective: getComputedStyle(strip).perspective,
      overflowX: getComputedStyle(strip).overflowX,
      scrollable: strip.scrollWidth - strip.clientWidth,
      frameWidth: boxes[0].width,
      stripWidth: stripBox.width,
      /* Full bleed: the strip escapes the shell's gutter on both sides. */
      bleedLeft: columnBox.left - stripBox.left,
      bleedRight: stripBox.right - columnBox.right,
      buttons: strip.querySelectorAll("button").length,
      maxGap,
      pageOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    };
  });

  expect(
    geometry.borderWidth === 0 && geometry.radius === 0,
    `[${name}] frames carry no border and no radius`,
    `${geometry.borderWidth}px / ${geometry.radius}px`,
  );
  expect(
    geometry.boxShadow === "none",
    `[${name}] frames carry no shadow`,
    geometry.boxShadow,
  );
  expect(
    geometry.filter === "none" && geometry.imgFilter === "none",
    `[${name}] no photograph is tinted, greyed or dimmed`,
    `${geometry.filter} / ${geometry.imgFilter}`,
  );
  expect(
    geometry.transform === "none" && geometry.opacity === 1,
    `[${name}] frames sit flat and fully opaque`,
    `${geometry.transform} @ ${geometry.opacity}`,
  );
  expect(
    geometry.transition === "all" || geometry.transition === "none",
    `[${name}] frames declare no motion of their own`,
    geometry.transition,
  );
  expect(
    geometry.perspective === "none",
    `[${name}] the 3D perspective is gone`,
    geometry.perspective,
  );
  expect(geometry.buttons === 0, `[${name}] the strip has no controls`);
  expect(
    Math.abs(geometry.maxGap) < 1,
    `[${name}] frames butt against each other`,
    `${geometry.maxGap}px`,
  );
  expect(
    Math.abs(geometry.aspect - 0.8) < 0.02,
    `[${name}] every frame keeps the reserved 4/5 box`,
    geometry.aspect.toFixed(3),
  );
  expect(
    geometry.imgFit === "cover",
    `[${name}] photographs fill their box without distortion`,
  );
  expect(
    geometry.overflowX === "auto" && geometry.scrollable > 40,
    `[${name}] the strip scrolls horizontally on its own`,
    `${geometry.overflowX} / ${geometry.scrollable}px`,
  );

  /* The affordance is the cut frame at the edge, so the visible count has to
     stay fractional — a whole number reads as a finished row. */
  const visible = geometry.stripWidth / geometry.frameWidth;
  expect(
    Math.abs(visible - Math.round(visible)) > 0.1,
    `[${name}] a frame is cut by the edge`,
    visible.toFixed(2),
  );
  expect(
    width >= 900 ? visible > 3.4 && visible < 5.2 : visible > 1.8 && visible < 3.6,
    `[${name}] the strip shows the right number of frames`,
    visible.toFixed(2),
  );

  expect(
    geometry.bleedLeft > 8 && geometry.bleedRight > 8,
    `[${name}] the strip runs full-bleed past the shell gutter`,
    `${geometry.bleedLeft.toFixed(1)} / ${geometry.bleedRight.toFixed(1)}`,
  );
  expect(
    geometry.pageOverflow <= 1,
    `[${name}] no horizontal page overflow`,
    `${geometry.pageOverflow}px`,
  );

  /* Scrolling the strip must not drag the page sideways with it. */
  await page.evaluate(() => {
    document.querySelector(".st2-guest-strip").scrollLeft = 400;
  });
  await page.waitForTimeout(200);
  const afterScroll = await page.evaluate(() => ({
    left: document.querySelector(".st2-guest-strip").scrollLeft,
    pageOverflow:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(afterScroll.left > 100, `[${name}] the strip actually scrolls`);
  expect(
    afterScroll.pageOverflow <= 1,
    `[${name}] scrolling the strip does not push the page`,
    `${afterScroll.pageOverflow}px`,
  );

  await section.screenshot({ path: `${OUT}/guest-strip-${name}.png` });
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`Archive strip: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Archive strip: PASS (flat, full-bleed, scrolls, no chrome)");
}
