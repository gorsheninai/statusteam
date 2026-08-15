/**
 * Rendered-page verification for ПУЛЬС КОНТИНЕНТА.
 *
 *   npm run build && npm start
 *   node tests/verify.mjs [url]
 *
 * Checks the things this design can break silently:
 *   - console/page errors and broken media
 *   - horizontal overflow at every breakpoint
 *   - text clipped inside an overflow:hidden reveal mask (the document does
 *     NOT scroll when this happens, so an overflow check alone misses it)
 *   - WCAG AA contrast for text on solid grounds
 *   - the seven scenes, in order, with the anchors the nav points at
 *   - the interactions: menu, ticket path, doors, FAQ, reel, forms, keyboard
 *   - the pinned chapter actually advances
 *   - prefers-reduced-motion leaves nothing hidden and runs no GSAP
 *
 * Screenshots land in ./test-results.
 */
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2] ?? "http://localhost:4311";
const OUT = "test-results";
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  ["1440", 1440, 900],
  ["1280", 1280, 800],
  ["1024", 1024, 768],
  ["768", 768, 1024],
  ["430", 430, 932],
  ["390", 390, 844],
  ["360", 360, 780],
];

/* The seven scenes, in the order the show runs. */
const SCENES = [
  ["hero", "#hero"],
  ["statusteam", "#statusteam"],
  ["pulse", "#pulse"],
  ["experience", "#experience"],
  ["tickets", "#tickets"],
  ["join", "#join"],
  ["faq", "#faq"],
];

const pass = [];
const fail = [];
const check = (ok, label, extra = "") =>
  (ok ? pass : fail).push(label + (extra ? ` — ${extra}` : ""));

/* The preloader owns the first ~2.1s of every fresh session. */
const settle = (page) => page.waitForTimeout(2400);

const browser = await chromium.launch();

/* ---------------- layout sweep ---------------- */
for (const [name, width, height] of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(350);

  check(errors.length === 0, `[${name}] no console errors`, errors.join(" | ").slice(0, 90));

  const ov = await page.evaluate(() => {
    const de = document.documentElement;
    return { doc: de.scrollWidth, client: de.clientWidth };
  });
  check(ov.doc <= ov.client + 1, `[${name}] no horizontal overflow`, `${ov.doc}>${ov.client}`);

  const clipped = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".pulse-line, .struct, .campaign"))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${el.textContent.trim().slice(0, 18)} ${el.scrollWidth}>${el.clientWidth}`));
  check(clipped.length === 0, `[${name}] no mask-clipped text`, clipped.join(" | "));

  const missing = await page.evaluate(() =>
    Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src));
  check(missing.length === 0, `[${name}] all media loads`, missing.join(", "));

  await page.addStyleTag({ content: ".nav{display:none!important}" });
  for (const [sname, sel] of SCENES) {
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    try { await el.screenshot({ path: `${OUT}/${name}-${sname}.png` }); } catch { /* over limit */ }
  }
  await ctx.close();
}

/* ---------------- structure ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "networkidle" });

  const order = await page.evaluate((ids) =>
    ids.map((id) => {
      const el = document.querySelector(id);
      return el ? el.getBoundingClientRect().top + window.scrollY : -1;
    }), SCENES.map(([, sel]) => sel));

  check(order.every((v) => v >= 0), "all seven anchors exist",
    SCENES.filter((_, i) => order[i] < 0).map(([n]) => n).join(", "));
  check(order.every((v, i) => i === 0 || v > order[i - 1]),
    "scenes run in order: hero → statusteam → pulse → experience → tickets → join → faq");

  const gone = await page.evaluate(() =>
    ["#manifest", "#show", "#archive", "#casting", "#partners", ".world", ".roles"]
      .filter((s) => document.querySelector(s)));
  check(gone.length === 0, "old sections and anchors removed", gone.join(", "));

  const heroCta = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll(".hero-inner a"));
    return { n: links.length, href: links[0]?.getAttribute("href") };
  });
  check(heroCta.n === 1 && heroCta.href === "#tickets",
    "hero offers one control and it points at the tickets", `${heroCta.n} → ${heroCta.href}`);

  check(await page.locator(".faq-row").count() === 6, "FAQ has six questions");
  check(await page.locator(".tier").count() === 3, "three ticket categories");
  check(await page.locator(".wave").count() === 3, "three price waves");
  check(await page.locator(".zone").count() === 3, "three ways in, including press");
  check(await page.locator(".zone [data-form='press']").count() === 1, "press accreditation form present");
  check(await page.locator("#tickets [data-form='subscribe']").count() === 1, "newsletter form in the ticket scene");
  check(await page.locator(".foot [data-form='subscribe']").count() === 1, "newsletter form in the footer");
  check(await page.locator(".tenet").count() === 4, "four tenets in the pinned chapter");
  check((await page.locator("#tickets").innerText()).match(/кастинг|партнёрств/i) === null,
    "the ticket scene does not redirect a buyer to casting");

  const navHrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".nav-links a, .nav-tickets")).map((a) => a.getAttribute("href")));
  check(
    ["#statusteam", "#pulse", "#experience", "#join", "#tickets"].every((h) => navHrefs.includes(h)),
    "header points at the new anchors", navHrefs.join(" "));
  await page.close();
}

/* ---------------- the ticket path ---------------- */
for (const [label, width, height] of [["desktop", 1280, 800], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  check(await page.locator(".nav-tickets").isVisible(), `[${label}] ticket button visible over the hero`);

  await page.locator(".hero-inner a").click();
  await page.waitForTimeout(2200);
  const landed = await page.evaluate(() => {
    const t = document.querySelector("#tickets").getBoundingClientRect();
    return t.top < window.innerHeight * 0.5 && t.bottom > 0;
  });
  check(landed, `[${label}] one click from the hero lands in the ticket scene`);
  check(await page.locator(".nav-tickets").isVisible(), `[${label}] ticket button still visible deep in the page`);
  await page.close();
}

/* ---------------- interactions ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  await page.click(".nav-burger");
  await page.waitForTimeout(900);
  check(await page.locator(".menu").isVisible(), "mobile menu opens");
  check(await page.evaluate(() => document.documentElement.classList.contains("is-locked")),
    "background scroll locked behind the menu");

  await page.locator(".menu-list a", { hasText: "Участие" }).click();
  await page.waitForTimeout(2200);
  check(!(await page.locator(".menu").isVisible()), "menu closes on nav");
  check(await page.evaluate(() => {
    const j = document.querySelector("#join").getBoundingClientRect();
    return j.top < window.innerHeight * 0.6 && j.bottom > 0;
  }), "menu link scrolled to the section");

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator(".reel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  check((await page.locator(".reel video").count()) === 0, "the reel does not autoload");
  await page.click(".reel-play");
  await page.waitForTimeout(1200);
  check((await page.locator(".reel video").count()) === 1, "reel mounts on intent");
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "networkidle" });

  /* Doors */
  const model = page.locator(".zone").first();
  check(!(await model.locator(".panel").isVisible()) ||
    (await model.locator(".panel").evaluate((el) => el.getBoundingClientRect().height < 4)),
    "participation forms are folded away until asked for");
  await model.locator(".zone-head").click();
  await page.waitForTimeout(500);
  check((await model.getAttribute("class")).includes("is-open"), "a door opens");
  check(await page.locator("#casting-name").isVisible(), "the casting form is inside it");

  /* FAQ */
  const faq = page.locator(".faq-row").nth(2);
  await faq.locator(".faq-q").click();
  await page.waitForTimeout(400);
  check((await faq.getAttribute("class")).includes("is-open"), "FAQ row opens");

  /* Ticket access */
  await page.locator(".btn-buy").click();
  await page.waitForTimeout(500);
  check(await page.locator("#access-name").isVisible(), "the ticket CTA opens the access form");
  check(await page.locator("#access-consent").count() === 1, "access form asks for data consent");

  /* Forms never fake a send */
  await page.fill("#casting-name", "Тест");
  await page.fill("#casting-age", "22");
  await page.fill("#casting-city", "Москва");
  await page.fill("#casting-height", "175");
  await page.fill("#casting-contact", "@test");
  await page.locator("[data-form='casting'] button[type=submit]").click();
  await page.waitForTimeout(400);
  const note = await page.locator("[data-form='casting'] .form-note").innerText();
  const wired = Boolean(process.env.NEXT_PUBLIC_FORM_ENDPOINT);
  check(wired || !/отправлена/i.test(note), "no fake success while the form is unwired", note.slice(0, 50));

  /* Keyboard */
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  check(String(await page.evaluate(() => document.activeElement?.className)).includes("skip-link"),
    "skip link is the first tab stop");
  let outlined = 0;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    /* Reduced motion pins every transition at 0.01ms rather than removing
       it, so an outline read in the same task still reports its start value.
       One frame of settle reads what the eye actually gets. */
    await page.waitForTimeout(40);
    if (await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    })) outlined++;
  }
  check(outlined >= 10, "focus ring stays visible while tabbing", `${outlined}/12`);
  await page.close();
}

/* ---------------- the pinned chapter ---------------- */
for (const [label, width, height] of [["desktop", 1280, 800], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  check(await page.evaluate(() =>
    document.querySelector(".tenets")?.classList.contains("is-pinned")),
    `[${label}] the tenets chapter pins`);

  await page.evaluate(() => {
    const t = document.querySelector(".tenets");
    window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY + 10);
  });
  await page.waitForTimeout(700);
  const first = await page.evaluate(() =>
    Number(getComputedStyle(document.querySelectorAll(".tenet-shot")[0]).opacity));

  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, height * 0.25);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(900);
  const second = await page.evaluate(() => {
    const shots = document.querySelectorAll(".tenet-shot");
    return Array.from(shots).map((s) => Number(getComputedStyle(s).opacity));
  });
  check(first > 0.9, `[${label}] the first tenet is the one showing on arrival`, String(first));
  check(second.slice(1).some((o) => o > 0.5), `[${label}] scrolling advances to a later tenet`,
    second.map((o) => o.toFixed(2)).join(" "));
  await page.close();
}

/* ---------------- contrast ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "networkidle" });
  const bad = await page.evaluate(() => {
    const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
    const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
    const solid = (el) => { let n = el; while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor); if (c.a > 0.95) return c; n = n.parentElement; }
      return { r: 16, g: 13, b: 12 }; };
    const eff = (el) => { let o = 1, n = el; while (n && n !== document.documentElement) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } return o; };

    const out = [];
    document.querySelectorAll("p,h1,h2,h3,a,li,span,label,small,button,dd,dt,figcaption,b,i").forEach((el) => {
      const t = el.textContent?.trim();
      if (!t || el.children.length) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      // text over imagery is scrim-dependent and can't be judged statically
      if (el.closest(".hero, .media, .menu, .tenets, .posters, .zone, .preloader")) return;
      const cs = getComputedStyle(el), bg = solid(el);
      const col = parse(cs.color);
      const fg = over({ ...col, a: col.a * eff(el) }, bg);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
      const cr = ratio(fg, bg);
      if (cr < (large ? 3 : 4.5)) out.push(`"${t.slice(0, 22)}" ${cr.toFixed(2)}`);
    });
    return out;
  });
  check(bad.length === 0, "contrast: text on solid grounds meets WCAG AA", bad.join(" | "));
  await page.close();
}

/* ---------------- reduced motion ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "networkidle" });
  const hidden = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-reveal],[data-hero]")).filter((el) => {
      const cs = getComputedStyle(el);
      const shifted = cs.transform !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(cs.transform);
      return parseFloat(cs.opacity) < 0.15 || cs.visibility === "hidden" || shifted;
    }).length);
  check(hidden === 0, "reduced motion hides or displaces nothing", String(hidden));

  const inline = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-reveal],[data-hero]"))
      .filter((e) => e.style.opacity !== "" || e.style.transform !== "").length);
  check(inline === 0, "reduced motion runs no GSAP", String(inline));

  check(await page.evaluate(() => getComputedStyle(document.querySelector(".preloader")).display === "none"),
    "reduced motion skips the preloader");
  check(await page.evaluate(() =>
    !document.documentElement.classList.contains("lenis-on") &&
    !document.documentElement.classList.contains("js-motion")),
    "reduced motion runs neither Lenis nor the motion pass");
  check(await page.evaluate(() =>
    Array.from(document.querySelectorAll(".tenet-shot"))
      .every((s) => Number(getComputedStyle(s).opacity) > 0.9)),
    "reduced motion leaves every tenet on the page");
  await page.close();
}

await browser.close();
console.log(`PASS (${pass.length}):\n  ` + pass.join("\n  "));
console.log(fail.length ? `\nFAIL (${fail.length}):\n  ` + fail.join("\n  ") : "\nFAIL: none");
process.exit(fail.length ? 1 : 0);
