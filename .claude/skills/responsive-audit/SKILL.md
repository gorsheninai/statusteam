---
name: responsive-audit
description: How this page behaves from 360px to 1440px — the breakpoint ladder, fluid type, reserved image boxes, touch targets and the failure modes that hide. Use this skill whenever you add or restyle a section, grid, card row, carousel or full-bleed element; whenever something looks wrong, overflows or clips at a particular width; whenever you touch a clamp, an aspect-ratio or an image tag; and whenever a mobile layout, a hover affordance or a deep link misbehaves. Consult it while writing the CSS, not after the screenshot looks wrong.
---

# Holding 360 → 1440

The quality floor: no horizontal overflow and no mask-clipped text anywhere in that
range, WCAG AA contrast, visible focus rings, 48px touch targets, and every hover
affordance has a touch equivalent. `npm run verify` sweeps seven widths
(1440, 1280, 1024, 768, 430, 390, 360) and fails on the first three.

## The ladder

Five breakpoints, each with a job. Add to an existing one before inventing a sixth.

- **base** — phone. Single column; horizontal rows are real scrollers, not squeezed
  grids.
- **≥640** — form grids go two-up; carousels widen their columns.
- **≥900** — compositions split. The hero goes landscape, lists gain a right-hand
  column, posters become a row.
- **≥1024** — desktop navigation appears, the burger goes, and pointer-only
  behaviour switches on: trailing imagery, the widening doors, card tilt.
- **≥1280** — the full editorial composition.

Pointer-only behaviour is gated on `(min-width: 1024px) and (pointer: fine)` **and**
on motion being allowed, and it is switched on by a class from JS rather than by CSS
alone. That way touch, reduced motion and no-JS all fall back to the same in-flow
layout instead of losing content to a hover that can never happen.

`@media (hover: none)` is where hover-only affordances get their resting state — the
zone photographs sit at a low opacity, the card highlight is partly on. If you add a
hover effect, add its coarse-pointer resting state in the same edit.

## Fluid type, not breakpoint type

Sizes come from `clamp()` in the `--fs-*` scale. The reason the middle term is `vw`
rather than a step is that Cyrillic display type has no good place to jump — but it
means **a size can be legal at 1440 and clip at 900**, because the clamp floor and
the container's percentage width move at different rates.

When you change a display size, check the widest word at the *narrowest* width where
that rule applies, not just at the design width. For anything with tracking that
animates, check it at open tracking too — the reduced-motion sweep pins
`letter-spacing` narrower than the live page renders, so a clean verify run is not
proof.

## Every image needs a reserved box

An `aspect-ratio` on its `.media` frame, or `width`/`height` attributes on the tag.
This is not only about CLS. An anchor jump computes its target position before the
images below it have loaded, so one unreserved image lands **every deep link and
every menu link hundreds of pixels short** — which reads as a broken scroll, not as
a broken image. It cost a debugging session before; the posters now carry explicit
intrinsic dimensions for exactly this reason.

If an anchor lands short, look for an unreserved image before you touch the scroll
code.

## Full-bleed and overflow

`html` and `body` carry `overflow-x: clip`, which keeps `position: sticky` working
while hiding stray horizontal escape. That means overflow will not always be visible
to the eye — trust the check, not the screenshot.

Anything wider than the viewport lives inside its own `overflow: hidden` or
`overflow-x: auto` container: the marquees are `overflow: hidden` on a `max-content`
track, the guest wall and the poster row are real scrollers with the gutter as
padding so a card peeks at the edge. Full-bleed sections escape the shell by
`margin-inline: calc(var(--gutter) * -1)`, never by `width: 100vw` — that includes
the scrollbar and overflows on desktop.

## Two orientations of one photograph

The hero uses `<picture>` with a `(min-width: 900px)` source: a 16:9 crop for
landscape, 9:16 for portrait. They are two crops of one frame, not two art
directions — the point is that neither is ever squeezed into the other's box. Scrims
differ accordingly: bottom-up on the phone crop, left-to-right on the wide one,
weighted to clear the type and no more.

## Checking a width quickly

```bash
npm run build && fuser -k 4311/tcp 2>/dev/null; (npx serve out -l 4311 >/dev/null 2>&1 &)
sleep 4 && node tests/verify.mjs
```

Screenshots land in `test-results/<width>-<scene>.png` for every width and scene, so
after a run you can look at the composition rather than only the pass list. They are
captured with reduced motion, which means they show the no-JS fallback layout — for
the animated desktop states, drive the page yourself and scroll with
`page.mouse.wheel`, never `scrollIntoView`.
