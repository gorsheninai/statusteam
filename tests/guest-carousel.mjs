/* The archive carousel in «Славянский взгляд»: ten unique frames in the
   requested order, desktop controls, a seamless 10 → 1 loop and a larger
   swipe-only editorial rail on mobile. */
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
    (await page.locator('.st2-guest[data-carousel-copy="1"]').count()) === 10,
    `[${name}] the accessible carousel run contains exactly ten frames`,
  );
  const order = await page.locator('.st2-guest[data-carousel-copy="1"] img').evaluateAll((images) =>
    images.map((image) => image.getAttribute("src")?.match(/show-(\d+)-/)?.[1]),
  );
  expect(
    order.join(" ") === "1 2 3 5 4 7 6 9 8 10",
    `[${name}] archive frames keep the requested order`,
    order.join(" → "),
  );

  /* Controls stay in the accessible DOM, but phones use swipe only. */
  expect(
    (await page.locator(".st2-guest-nav-button").count()) === 2,
    `[${name}] both carousel controls exist`,
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

    /* Largest gap between consecutive frames: the designed hairline is 3px. */
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
      buttons: document.querySelectorAll(".st2-guest-nav-button").length,
      navDisplay: getComputedStyle(document.querySelector(".st2-guest-nav")).display,
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
  expect(geometry.buttons === 2, `[${name}] the strip has two controls`);
  expect(
    width < 768 ? geometry.navDisplay === "none" : geometry.navDisplay !== "none",
    `[${name}] carousel arrows follow the desktop/mobile brief`,
    geometry.navDisplay,
  );
  expect(
    geometry.maxGap >= 2 && geometry.maxGap <= 3.5,
    `[${name}] frames keep the narrow editorial gap`,
    `${geometry.maxGap}px`,
  );
  expect(
    Math.abs(geometry.aspect - (2 / 3)) < 0.02,
    `[${name}] every frame keeps the enlarged 2/3 portrait box`,
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

  /* Desktop holds three frames; phones enlarge the portraits so one complete
     frame and a strong preview of the second remain visible. */
  const visible = geometry.stripWidth / geometry.frameWidth;
  expect(
    width >= 768 ? visible > 2.95 && visible < 3.1 : visible > 1.55 && visible < 1.7,
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

  /* Put frame 10 on the leading edge, advance once, and confirm the next
     visible frame is 1 even if the loop correction swaps technical copies. */
  await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    const tenth = document.querySelector('.st2-guest[data-carousel-copy="1"][data-carousel-slide="10"]');
    strip.scrollLeft = tenth.offsetLeft;
  });
  await page.waitForTimeout(150);
  if (width >= 768) {
    await page.locator(".st2-guest-nav-button.is-next").click();
  } else {
    await page.evaluate(() => {
      const strip = document.querySelector(".st2-guest-strip");
      const frame = strip.querySelector(".st2-guest");
      const gap = Number.parseFloat(getComputedStyle(strip).gap) || 0;
      strip.scrollBy({ left: frame.getBoundingClientRect().width + gap });
    });
  }
  await page.waitForTimeout(700);
  const loopedSlide = await page.evaluate(() => {
    const strip = document.querySelector(".st2-guest-strip");
    const edge = strip.getBoundingClientRect().left;
    return [...document.querySelectorAll(".st2-guest")]
      .map((frame) => ({
        slide: frame.dataset.carouselSlide,
        distance: Math.abs(frame.getBoundingClientRect().left - edge),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.slide;
  });
  expect(loopedSlide === "1", `[${name}] frame 10 advances directly to frame 1`, loopedSlide);

  await section.screenshot({ path: `${OUT}/guest-strip-${name}.png` });
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`Archive strip: ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Archive carousel: PASS (10 frames, seamless loop, two controls)");
}
