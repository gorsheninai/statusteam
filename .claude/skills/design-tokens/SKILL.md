---
name: design-tokens
description: The visual system for ПУЛЬС КОНТИНЕНТА — palette, the two type faces and their three roles, the fluid scale, scene grounds, and the media rules. Use this skill whenever you add or restyle a section, component, button, form or card; whenever you are about to pick a colour, a font size, a spacing value or an image; whenever type looks wrong at some width; and whenever someone asks for gold, a gradient, an accent colour, a new font, or a stock photograph. Consult it before writing CSS rather than after.
---

# The visual system

Burgundy leads. It lives in **type, rules and flat fields — never tinted onto the
photography.** The photography supplies the secondary colour, which is why the
palette is this short.

## Palette

| Token | Value | Use |
|---|---|---|
| `--burgundy` | `#761028` | brand field, primary CTA |
| `--wine` | `#4b0718` | participation scene, menu, the curtain |
| `--red` | `#b51f2e` | small marks on paper |
| `--red-bright` | `#d8394a` | large type on ink (AA needs the lighter one) |
| `--ink` | `#100d0c` | warm-shifted black |
| `--paper` | `#f1eee8` | quiet chapters |
| `--sand` | `#c6a87c` | hairlines and small caps only |

No gold gradients, no black-and-gold clichés, no accent colours beyond this set.
When a brief asks for "gold", it means `--sand`, used as a rule or as small caps.

Sand is a hairline colour, so it fails AA as body text on ink at small sizes. On a
dark ground, dim paper rather than reaching for sand: `opacity: 0.58` is the floor
for small text on ink, below which the contrast check fails.

## Type — two faces, three roles

- `--font-display` (Tenor Sans) — **large only**: the lock-up, chapter titles,
  statements, composed numerals. One weight exists; there is no bold.
- `--font-ui` (Onest) — small uppercase: nav, buttons, labels, chapter numbers, form
  labels, credits, footer. Never above 500.
- `--font-body` (Onest) — running copy and forms.

`--font-ui` and `--font-body` resolve to the same family on purpose; they stay
separate roles so UI tracking can move without touching running copy.

Both faces are self-hosted and **subset to Latin + Cyrillic + the punctuation this
page uses**. Re-subset before introducing a new glyph — Tenor Sans has no `→`, `↗`
or `₽` at all, so those live in Onest UI only. `font-synthesis: none` on `body` must
stay: without it a stray `font-weight` renders Tenor Sans as faux bold.

Next/font variables are `--ff-*`. Do not rename them to `--font-sans`; Tailwind v4
defines that as a theme token on `:root` and would shadow it.

### Tenor Sans is wide

It replaced a condensed face, and several sizes are now pinned by the longest
Cyrillic word rather than by taste. The hero lock-up is the sharpest case:
«КОНТИНЕНТА» at ≥900px is sized against `.hero-inner`'s 68% box **at open tracking**,
which is its resting state, not its narrowest. It clips inside a mask, silently.
Any change to a display size means re-running the clipped-text check — and checking
it at live tracking, not only under reduced motion, where CSS pins the letter-spacing
narrower than the page actually renders.

Use the fluid scale (`--fs-*`) and the rhythm tokens (`--chapter-pad`,
`--chapter-pad-quiet`, `--gutter`) rather than new magic numbers. A new clamp is a
decision to justify, not a default.

## Scene grounds

Chapters alternate loud and quiet — a media chapter is always followed by a
breathing one. Preserve that rhythm when adding sections.

| Anchor | Ground |
|---|---|
| `#hero` | ink |
| `#statusteam` | burgundy |
| `#pulse` | ink |
| `#experience` | paper |
| `#tickets` | ink |
| `#join` | wine |
| `#faq` | ink |

A section declares its ground with `data-bg="ink|burgundy|wine|paper"`; the shared
field reads it. A paper scene has ink type, so its ground is not decorative.

## Media

`public/media/MEDIA_INDEX.md` is the source of truth — what each asset shows, its
crop tolerance, whether type may sit on it, and where it belongs. Read it before
placing any image. The rules that are not negotiable:

- `poster-*` files already carry the printed title lock-up. Never put type on them,
  and never use one as the ground of a scene that has its own title.
- `archive-*` and the reel are real photography from the previous show
  (СЛАВЯНСКИЙ ВЗГЛЯД, фото Паша Доренский). The credit stays visible; never filter
  them.
- Campaign imagery and archive imagery are two different shows. Do not mix them in
  one chapter.
- Curate. Unused key-art variants are held in reserve on purpose.

Originals stay in the repository root; only derivatives are served from
`public/media/`. The `header_*` originals are 6.5 and 7.1 MB — putting either in the
served directory ships it to the edge and puts it in front of the LCP.
