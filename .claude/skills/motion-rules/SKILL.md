---
name: motion-rules
description: How scroll choreography works on this site — GSAP + ScrollTrigger + Lenis, the degrade-by-class pattern, and the invariants that break silently. Use this skill whenever you add, change or debug an animation, a pin, a scroll trigger, a reveal, a parallax, a hover effect or the preloader curtain; whenever motion misbehaves (a ground changes a chapter early, a pin overlaps the next section, an anchor lands short); and before adding any animation dependency. Also use it when someone proposes Framer Motion, a component-animation library, or WebGL.
---

# Motion on ПУЛЬС КОНТИНЕНТА

`components/Motion.tsx` is the entire scroll pass. It returns before building a
single tween when `prefers-reduced-motion: reduce` is set — the reduced-motion page
is not a degraded version, it is the plain document. Keep that shape: anything you
add goes inside that guard.

## The stack is closed

GSAP + ScrollTrigger for scroll, Lenis for inertia, plain CSS for component state.
Framer Motion was removed deliberately — ~40 KB gzip to animate two accordions and a
menu, against a 150 KB budget the page is already over. Disclosure widgets use the
`.panel` primitive (`grid-template-rows: 0fr → 1fr`); the menu uses a `clip-path`
transition. If you find yourself wanting a component-animation library, you want the
`.panel` primitive instead.

Transform and opacity only. The two exceptions are named in the brief and are
layout by nature: the disclosure panels and the participation doors (`flex-grow`).

## Degrade by class, not by hope

Layout that only makes sense while GSAP is driving is switched on from JS:

- `html.js-motion` — makes `[data-bg]` sections **and `body`** transparent so the
  fixed `.bg-field` shows through.
- `.tenets.is-pinned` — stacks the four beats absolutely for the pin. Without it
  they are an ordinary vertical sequence, which is what a reader with no JS gets.
- `.exp-list.is-trailing` — lifts the hover imagery out of the flow.

The test: turn JS off and every one of these must still be a readable document.
`#experience` is the canary — it has ink type on a paper ground, so if the field
mechanism breaks it becomes black on black.

## Four invariants that break silently

**Pins refresh first.** `.tenets` and `.reel-zoom` both pin, and a pin adds several
screens of spacer that every trigger below is measured against. Both carry
`refreshPriority: 1`. Drop it and everything below fires roughly one chapter early —
with no error, and only visible if you happen to watch the ground colour.

**Position, not crossings.** The ground is chosen by reading `scrollY` against a
table of section offsets measured on ScrollTrigger refresh. Never drive it from
`onEnter`/`onEnterBack`: a flung wheel, an anchor jump or a deep link can skip a
boundary entirely, but it cannot skip a position. This applies to anything that must
be correct at every scroll position rather than merely animate on the way past.

**`body` paints after negative-z children.** `.bg-field` sits at `z-index: -2`, so
`body`'s own background would cover it. `html` keeps the ink for overscroll and for
the no-JS case; `.js-motion body` goes transparent.

**Discrete properties need both keyframes.** `visibility` interpolates discretely,
so `@keyframes x { to { visibility: hidden } }` leaves the element visible for the
whole active period. At a 1ms duration that is the entire animation — the curtain
cleared visually and went on eating clicks for the rest of the session. Put the
value on `from` **and** `to`.

## Reveals

Initial states come **from JS, never CSS**, so the page stays readable if the bundle
never arrives. `data-reveal="lines" | "mask" | "up"` cover almost everything.

Line reveals use `lib/split-lines.ts`, not GSAP's SplitText (7 KB the budget cannot
spare). It measures rendered line boxes, so it must run after `document.fonts.ready`
or it breaks lines against fallback metrics; it reverts to plain text once the reveal
has played so headings re-wrap normally on rotate.

## Scroll ownership

Lenis owns the scroll and only Lenis. Anchors go through `lib/scroll.ts`; so does the
menu lock (`lenis.stop()`, not a fixed body). Touch keeps the platform's own
scrolling — `syncTouch: false` is a decision, not a default to tidy up.

`scrollToAnchor` defers the travel by one frame and passes `force: true`. Both are
load-bearing: a link inside the mobile menu closes it, and that unlock lands in
React's commit *after* the click handler, so an immediate scroll goes nowhere.

An anchor that lands short is almost never a scroll bug — it is an image below the
target with no reserved box. Check `aspect-ratio` on the `.media` frame or
`width`/`height` on the tag before touching the scroll code.

## The curtain

Pure CSS, once per session, and it must open even if the JS bundle never arrives —
it covers the whole page. Its schedule (line 0.1–1.05s, wings 1.05–2.0s) is what
`OPEN` in `Motion.tsx` is tuned against; the hero starts while the wings are still
travelling. Change one and change the other. The wings are 50.4% wide each so they
overlap: at exactly 50% a strip of the page flashes through the seam before they
move.
