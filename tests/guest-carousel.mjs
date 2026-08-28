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
  /* Three copies of the ten frames: the loop hops between them, so the seam
     between the last and the first never renders. */
  expect(
    (await page.locator(".st2-guest").count()) === 30,
    `[${name}] the strip carries three copies of the ten frames`,
  );
  expect(
    (await page.locator(".st2-guest[aria-hidden='true']").count()) === 20,
    `[${name}] only one copy is announced to assistive technology`,
  );

  /* The card chrome the redesign removed must not creep back. */
  expect(
    (await page.locator(
      ".st2-guest-card, .st2-guest-shade, .st2-guest-viewport, .st2-guest-track",
    ).count()) === 0,
    `[${name}] cards, shades and the 3D track stay gone`,
  );
  expect(
    (await page.locator(".st2-guest-nav-button").count()) === 2,
    `[${name}] both arrows are present`,
  );

  const geometry = await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    const stage = document.querySelector(".st2-guest-stage");
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

    /* Gaps between consecutive frames: a hairline of the chapter ground, and
       the same hairline everywhere — an uneven pitch would make the loop's
       re-centring visible. */
    const gaps = [];
    for (let i = 1; i < boxes.length; i += 1) {
      gaps.push(boxes[i].left - boxes[i - 1].right);
    }
    const maxGap = Math.max(...gaps);
    const minGap = Math.min(...gaps);

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
      bleedLeft: columnBox.left - stage.getBoundingClientRect().left,
      bleedRight: stage.getBoundingClientRect().right - columnBox.right,
      buttons: strip.querySelectorAll("button").length,
      maxGap,
      minGap,
      stageWidth: stage.getBoundingClientRect().width,
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
  expect(geometry.buttons === 0, `[${name}] the arrows sit outside the scroller`);
  expect(
    geometry.maxGap >= 3 && geometry.maxGap <= 5,
    `[${name}] frames are separated by a hairline, not a gutter`,
    `${geometry.maxGap}px`,
  );
  expect(
    geometry.maxGap - geometry.minGap < 1,
    `[${name}] the pitch is uniform across the loop seam`,
    `${geometry.minGap} → ${geometry.maxGap}`,
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

  /* Two frames on phones, three from 900px, and they fit exactly — the
     arrows carry the affordance now, so a cut frame would just read as a
     mistake. */
  const expected = width >= 900 ? 3 : 2;
  const visible = geometry.stripWidth / (geometry.frameWidth + geometry.maxGap);
  expect(
    Math.abs(visible - expected) < 0.05,
    `[${name}] exactly ${expected} frames fill the strip`,
    visible.toFixed(3),
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

  /* The viewer starts on the middle copy, so there is runway in both
     directions before the loop has to correct anything. */
  const rest = await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    return { left: strip.scrollLeft, setWidth: strip.scrollWidth / 3 };
  });
  expect(
    Math.abs(rest.left - rest.setWidth) < 2,
    `[${name}] the strip rests on the middle copy`,
    `${rest.left} vs ${rest.setWidth}`,
  );

  /* An arrow advances exactly one frame. */
  const pitch = rest.setWidth / 10;
  await page.locator(".st2-guest-nav-button.is-next").click();
  await page.waitForTimeout(700);
  const afterNext = await page.evaluate(
    () => document.querySelector(".st2-guest-strip").scrollLeft,
  );
  expect(
    Math.abs(afterNext - (rest.left + pitch)) < 3,
    `[${name}] the next arrow advances one frame`,
    `${afterNext} vs ${rest.left + pitch}`,
  );

  await page.locator(".st2-guest-nav-button.is-prev").click();
  await page.waitForTimeout(700);
  const afterPrev = await page.evaluate(
    () => document.querySelector(".st2-guest-strip").scrollLeft,
  );
  expect(
    Math.abs(afterPrev - rest.left) < 3,
    `[${name}] the previous arrow steps back one frame`,
    `${afterPrev} vs ${rest.left}`,
  );

  /* Past the tenth frame the strip must land back inside the middle copy
     without the viewer seeing it: the correction is only valid if the frame
     at the left edge is the same photograph before and after the hop. The
     helper reports both, plus the frame index within the copy. */
  const edgeFrame = () =>
    page.evaluate(() => {
      const strip = document.querySelector(".st2-guest-strip");
      const stripLeft = strip.getBoundingClientRect().left;
      const frames = [...strip.querySelectorAll(".st2-guest")];
      const nearest = frames.reduce((best, frame) =>
        Math.abs(frame.getBoundingClientRect().left - stripLeft) <
        Math.abs(best.getBoundingClientRect().left - stripLeft)
          ? frame
          : best,
      );
      return {
        src: nearest.querySelector("img").getAttribute("src"),
        left: strip.scrollLeft,
        setWidth: strip.scrollWidth / 3,
      };
    });

  /* Forwards, off the end of the middle copy. */
  await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    strip.scrollLeft = (strip.scrollWidth / 3) * 2 + 40;
  });
  await page.waitForTimeout(80);
  const beforeForward = await edgeFrame();
  await page.waitForTimeout(500);
  const afterForward = await edgeFrame();

  expect(
    afterForward.src === beforeForward.src,
    `[${name}] the wrap keeps the same photograph at the edge`,
    `${beforeForward.src} → ${afterForward.src}`,
  );
  expect(
    afterForward.left > afterForward.setWidth * 0.5 &&
      afterForward.left < afterForward.setWidth * 1.5,
    `[${name}] scrolling past the last frame returns to the middle copy`,
    `${afterForward.left} of ${afterForward.setWidth}`,
  );

  /* And the same backwards, off the front of it. */
  await page.evaluate(() => {
    document.querySelector(".st2-guest-strip").scrollLeft = 40;
  });
  await page.waitForTimeout(80);
  const beforeBack = await edgeFrame();
  await page.waitForTimeout(500);
  const afterBack = await edgeFrame();

  expect(
    afterBack.src === beforeBack.src,
    `[${name}] the backwards wrap keeps the same photograph at the edge`,
    `${beforeBack.src} → ${afterBack.src}`,
  );
  expect(
    afterBack.left > afterBack.setWidth * 0.5 &&
      afterBack.left < afterBack.setWidth * 1.5,
    `[${name}] scrolling before the first frame returns to the middle copy`,
    `${afterBack.left} of ${afterBack.setWidth}`,
  );

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
          document.documentElement.clientWidth <=
        1,
    ),
    `[${name}] scrolling the strip does not push the page`,
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
