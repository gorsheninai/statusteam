# STATUS TEAM — ПУЛЬС КОНТИНЕНТА

Single-page site for the STATUS TEAM fashion show **ПУЛЬС КОНТИНЕНТА / PULSE OF THE
CONTINENT**. Interface language is Russian. Next.js App Router, Tailwind v4 preflight
plus a hand-written token system, GSAP for scroll choreography, Framer Motion for
component state.

## Commands

```bash
npm run dev        # local dev
npm run build      # static export -> ./out
npm start          # serve ./out on :4311  (next start does NOT work with output: export)
npm run verify     # drive the rendered page in a browser (34 checks)
npm run lint
npm run typecheck
npm run deploy     # build + wrangler deploy to Cloudflare
```

**Verify against a fresh build.** The static server snapshots `out/` at boot —
rebuild, then restart, or you are testing the previous build.

## Deployment — Cloudflare

The site is a **static export**. `wrangler.jsonc` declares an assets-only Worker
(no `main`), so Cloudflare serves `out/` from the edge and no Worker runs per
request. Nothing here needs a server: no route handlers, no server actions, no
per-request data.

`npm run deploy` needs `CLOUDFLARE_API_TOKEN` in the environment — wrangler cannot
authenticate non-interactively without it. The target Worker is named `statusteam`.

Keep `output: "export"` and `images.unoptimized` together: dropping either breaks
the other.

## Repository rules

- All work lives in **`gorsheninai/statusteam`**. `gorsheninai/statusteam-website` is
  the client-approved visual baseline and is **read-only reference**.
- Original media (`1–9.png`, `style1–7.png`, `pre1–4.PNG`, `video.mp4`) stays in the
  repo root, untouched. Everything served to the browser is a derivative in
  `public/media/`.

## Visual identity

Burgundy leads. It lives in **type, rules and flat fields — it is never tinted onto the
photography.**

| Token | Value | Use |
|---|---|---|
| `--burgundy` | `#761028` | brand field, primary CTA |
| `--wine` | `#4b0718` | archive chapter, mobile menu |
| `--red` | `#b51f2e` | small marks on paper |
| `--red-bright` | `#d8394a` | large type on ink (AA needs it) |
| `--ink` | `#100d0c` | warm-shifted black, sits under savanna imagery |
| `--paper` | `#f1eee8` | quiet chapters |
| `--sand` | `#c6a87c` | hairlines and small caps only — never a gradient, never "gold" |

No gold gradients, no black-and-gold clichés, no accent colours beyond this set. The
photography supplies the secondary colour.

### Typography — three roles, no script face

- **`--font-campaign`** (Prata) — the didone of the printed key art. Large only.
- **`--font-struct`** (Oswald) — condensed. Chapter titles, numerals, labels, buttons.
- **`--font-body`** (Geist) — body, forms, navigation.

The reference site's Caveat script accent was **dropped deliberately**; it belonged to
the previous Slavic show, not this one. Do not reintroduce it.

Next/font variables are named `--ff-*` and set on `<html>`. Do **not** rename them to
`--font-sans`: Tailwind v4 defines that as a theme token on `:root` and would shadow it.

### Signature — the breathing lock-up

`ПУЛЬС КОНТИНЕНТА` recurs exactly three times (hero → show → tickets). Its tracking
opens and closes on scroll, the two words moving in opposition, so the pair reads as one
breath. The final instance settles compressed — the pulse resolves. GSAP writes
`--pulse` (0–1); CSS multiplies it by `--pulse-spread`.

`--pulse-spread` is `0.05em` on phones and `0.14em` from 900px. **This is a
correctness constraint, not taste:** "КОНТИНЕНТА" at full tracking will slide under the
reveal mask's `overflow: hidden` and clip silently — the document never scrolls, so an
overflow check will not catch it. If you change the hero/tickets font size, re-run the
clipped-text check.

Pulse is never drawn as an ECG line.

### Structure

Numbered chapters (01–09) are legitimate here: a show runs in order. Chapters alternate
loud and quiet — a media chapter is always followed by a breathing one. Preserve that
rhythm when adding sections.

## Media policy

`public/media/MEDIA_INDEX.md` is the source of truth: what each asset shows, its crop
tolerance, whether type may sit on it, and where it belongs. **Read it before placing
any image.**

Non-negotiables:

- The `poster-*` files already carry the printed title lock-up. **Never** put type on them.
- `archive-*` and the reel are **real photography from the previous show** (СЛАВЯНСКИЙ
  ВЗГЛЯД), by **Паша Доренский**. Credit stays visible; never filter them.
- Campaign imagery and archive imagery are two different shows. Do not mix them in one
  chapter.
- Curate. Three unused key-art variants are held in reserve on purpose.

## Quality floor

Every change must hold: no horizontal overflow and no mask-clipped text at 360–1440;
WCAG AA contrast; visible focus rings; 48px touch targets; every hover affordance has a
touch equivalent; `prefers-reduced-motion` disables GSAP entirely and leaves nothing
faded or offset.

Reveals set their initial state **from JS, never CSS**, so the page stays readable if
JS fails.

## Not yet wired

- **Ticket sales URL** — the CTA is built and styled but points nowhere by design.
- **Form delivery** — set `NEXT_PUBLIC_FORM_ENDPOINT` and both forms POST JSON to it.
  Without it they say so plainly. Never fake a successful submission.
- **Social / contact links** — omitted rather than invented.
