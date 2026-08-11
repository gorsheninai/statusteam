/**
 * Rendered-page verification for ПУЛЬС КОНТИНЕНТА.
 *
 *   npm run build && npm start -- -p 4311
 *   node tests/verify.mjs [url]
 *
 * Checks the things this design can break silently:
 *   - console/page errors and broken media
 *   - horizontal overflow at every breakpoint
 *   - text clipped inside an overflow:hidden reveal mask (the document does
 *     NOT scroll when this happens, so an overflow check alone misses it)
 *   - WCAG AA contrast for text on solid grounds
 *   - the interactions: mobile menu, accordion, reel, forms, keyboard
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

const SECTIONS = [
  ["hero", ".hero"], ["manifest", ".manifest"], ["scale", ".scale"],
  ["show", ".show"], ["materials", ".materials"], ["archive", ".archive"],
  ["world", ".world"], ["casting", ".casting"], ["partners", ".partners"],
  ["tickets", ".tickets"], ["foot", ".foot"],
];

const pass = [], fail = [];
const check = (ok, label, extra = "") =>
  (ok ? pass : fail).push(label + (extra ? ` — ${extra}` : ""));

const browser = await chromium.launch();

/* ---------------- layout sweep ---------------- */
for (const [name, width, height] of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width, height }, reducedMotion: "reduce", deviceScaleFactor: 1,
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
  for (const [sname, sel] of SECTIONS) {
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    try { await el.screenshot({ path: `${OUT}/${name}-${sname}.png` }); } catch { /* over limit */ }
  }
  await ctx.close();
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
    document.querySelectorAll("p,h1,h2,h3,a,li,span,label,small,button,dd,dt,figcaption").forEach((el) => {
      const t = el.textContent?.trim();
      if (!t || el.children.length) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      // text over imagery is scrim-dependent and can't be judged statically
      if (el.closest(".hero, .media, .menu, .show-panel figcaption, .posters")) return;
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

/* ---------------- interactions ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.click(".nav-burger");
  await page.waitForTimeout(800);
  check(await page.locator(".menu").isVisible(), "mobile menu opens");
  check(await page.evaluate(() => getComputedStyle(document.body).position) === "fixed", "background scroll locked");
  await page.locator(".menu-list a", { hasText: "Кастинг" }).click();
  await page.waitForTimeout(900);
  check(!(await page.locator(".menu").count()), "menu closes on nav");
  check((await page.evaluate(() => window.scrollY)) > 500, "anchor scrolled");

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator(".reel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  check((await page.locator(".reel video").count()) === 0, "phone does not autoload the reel");
  await page.click(".reel-play");
  await page.waitForTimeout(1200);
  check((await page.locator(".reel video").count()) === 1, "reel mounts on intent");
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  const first = page.locator(".role").first(), third = page.locator(".role").nth(2);
  await third.locator("button").click();
  await page.waitForTimeout(500);
  check((await third.getAttribute("class")).includes("is-open"), "accordion opens");
  check(!(await first.getAttribute("class")).includes("is-open"), "accordion closes the previous row");

  await page.fill("#casting-name", "Тест");
  await page.fill("#casting-age", "22");
  await page.fill("#casting-city", "Москва");
  await page.fill("#casting-height", "175");
  await page.fill("#casting-contact", "@test");
  await page.locator(".casting .form button[type=submit]").click();
  await page.waitForTimeout(400);
  const note = await page.locator(".casting .form-note").innerText();
  const wired = Boolean(process.env.NEXT_PUBLIC_FORM_ENDPOINT);
  check(wired || !/отправлена/i.test(note), "no fake success while the form is unwired", note.slice(0, 50));

  // fresh load: focus is still inside the form after the submit above
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  check(String(await page.evaluate(() => document.activeElement?.className)).includes("skip-link"),
    "skip link is the first tab stop");
  let outlined = 0;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => { const el = document.activeElement;
      if (!el || el === document.body) return false;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0; })) outlined++;
  }
  check(outlined >= 10, "focus ring stays visible while tabbing", `${outlined}/12`);
  await page.close();
}
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
  await page.close();
}

await browser.close();
console.log(`PASS (${pass.length}):\n  ` + pass.join("\n  "));
console.log(fail.length ? `\nFAIL (${fail.length}):\n  ` + fail.join("\n  ") : "\nFAIL: none");
process.exit(fail.length ? 1 : 0);
