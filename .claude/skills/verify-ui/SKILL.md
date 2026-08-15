---
name: verify-ui
description: Run and interpret this project's browser verification suite (npm run verify — Playwright over the built page, 85 checks across 7 breakpoints). Use this skill whenever you have changed anything under app/, components/ or lib/ and want to confirm it still holds; whenever the user asks to test, verify, check or QA the page; whenever a verify run reports failures and you need to tell a real defect from a harness artifact; and before committing any visual or motion change. Also use it when adding a new check to tests/verify.mjs.
---

# Verifying the rendered page

`tests/verify.mjs` drives a real Chromium over the **built** site. It exists because
this design breaks in ways a unit test cannot see: text clipped inside an
`overflow: hidden` mask, a ground colour that fails to change, an anchor that lands
short. Treat a green run as the floor, not the ceiling — it does not look at
composition, and you still need screenshots for that.

## Running it

The static server snapshots `out/` **at boot**. Rebuild and restart, or you are
testing the previous build and will chase ghosts:

```bash
npm run build
fuser -k 4311/tcp 2>/dev/null || true      # free the port
(npx serve out -l 4311 >/dev/null 2>&1 &)  # detach, or it holds the shell
sleep 4
node tests/verify.mjs
```

Do **not** stop the server with `pkill -f "serve out"`. That pattern matches the
shell running the command as well, and the whole invocation dies mid-build with a
confusing exit code. Kill by port.

The suite takes a few minutes; the layout sweep alone loads the page seven times.

## Reading a failure

Every check prints its own measured numbers after an em dash, which is usually
enough to classify it without re-running:

- **`no mask-clipped text`** — a `.pulse-line`, `.struct` or `.campaign` element is
  wider than its box. This is the highest-value check in the file: the mask hides
  the overflow, the document never scrolls, and nothing else catches it. Fix by
  sizing type down or widening the box; never by removing the mask.
- **`no horizontal overflow`** — `html` has `overflow-x: clip`, so if this fires
  something is genuinely escaping. Look at full-bleed rows and marquees first.
- **`contrast`** — the check walks up for the nearest opaque background, so it
  judges text against its *ground*, not against imagery. Raising an opacity is
  usually the honest fix; text over photographs is excluded because a scrim cannot
  be judged statically.
- **`reduced motion hides or displaces nothing`** — something set an initial state
  from CSS instead of JS. Move it into `Motion.tsx`.

## Two known harness artifacts

These have cost real time before. Recognise them rather than "fixing" the page.

**Focus rings read as 0px if you look too early.** The reduced-motion block pins
every transition at `0.01ms` rather than removing it, so a computed `outline-width`
read in the same task as the `Tab` still reports its start value. Settle a frame
(~40ms) before reading. Elements that declare an explicit `transition-property`
are unaffected, which is why only *some* of them looked broken.

**Background/ground checks sampled mid-crossfade look wrong.** The ground tweens
over 0.7s. If you sample a scroll position within that window the colour is
genuinely in between. Settle ≥1.2s before asserting a ground colour.

## Verifying motion, which the suite mostly cannot

The sweep runs with `reducedMotion: "reduce"`, so it never sees GSAP. For anything
animated, drive it yourself in a scratch script and **scroll organically** —
`element.scrollIntoView()` and instant `window.scrollTo` fight ScrollTrigger's pins
and produce states no user will ever be in:

```js
for (let i = 0; i < 600; i++) {
  await page.mouse.wheel(0, 180);
  await page.waitForTimeout(20);
  // read the condition you care about
}
```

## The trap the suite has a blind spot for

The clipped-text check runs under reduced motion, where CSS forces
`letter-spacing: 0.05em` on `.pulse-line`. The **live** page tracks wider than that.
After changing any hero/tickets/pulse type size, sweep the real tracking yourself:

```js
const t = document.querySelector(".hero-title");
for (const v of [0, 0.35, 1]) {
  t.style.setProperty("--pulse", String(v));
  t.getBoundingClientRect();
  // compare scrollWidth vs clientWidth on each .pulse-line
}
```

Check 900, 1024, 1280, 1440 and 1920 — the clamp maxes out at different points.

## Adding a check

Put it in the block that matches its concern, use `check(ok, label, extra)` so the
measured value is always printed, and phrase the label as the property that should
hold ("the curtain clears itself without JS"), not as the mechanism. Keep the
`extra` string free of comparison operators unless the check actually failed —
`"1452px over 1440px"` reads correctly in a passing run; `"1452<1440"` does not.
