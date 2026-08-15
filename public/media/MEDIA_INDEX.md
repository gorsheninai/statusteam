# MEDIA INDEX — STATUS TEAM

Semantic index of the project media library. Originals live untouched in the repository root
(`1.png … 9.png`, `style1–7.png`, `pre1–4.PNG`, `video.mp4`). Everything in `public/media/`
is a **derived web asset** (WebP / compressed MP4) generated from those originals.

Two distinct bodies of material exist and must never be mixed:

| Set | Source | Shows | Role on site |
|---|---|---|---|
| `hero-*` | `header_16_9.png`, `header_9_16.png` | **ПУЛЬС КОНТИНЕНТА** (new show) | The opening frame, in two crops |
| `campaign-*`, `poster-*`, `detail-*`, `runway-*` | `1–9.png`, `style1–7.png` | **ПУЛЬС КОНТИНЕНТА** (new show, Africa) | Desire, atmosphere, art direction |
| `archive-*`, `show-reel*` | `pre1–4.PNG`, `video.mp4` | **СЛАВЯНСКИЙ ВЗГЛЯД** (previous show) | Proof — real photography, real audience |

The `archive-*` stills and the reel are **real event photography/footage**. Photo credit visible in
source: **Паша Доренский**. The campaign set is concept/key-art imagery for the upcoming show.

---

## NEW SHOW — ПУЛЬС КОНТИНЕНТА

### hero-wide · from `header_16_9.png` · hero-tall · from `header_9_16.png`
- **Type / orientation** — images, 2720×1536 (1.77) and 1536×2720 (0.56); served as
  `hero-wide-{1200,1800,2560}.webp` and `hero-tall-{720,1080,1440}.webp`
- **Content** — two models in black couture with gold jewellery and cowrie shells, on a dark ground
- **Mood** — the show's own poster: frontal, lit, expensive
- **Overlay** — ★★★ on the wide crop, whose **left half is an empty field** and is where the
  lock-up sits. ★ on the tall crop: the figures fill it, so type only sits on the scrim at the foot
- **Best use** — **HERO**, full-bleed. A `<picture>` swaps the crops at 900px, so neither is ever
  squeezed into the other's box
- **Priority** — 1
- **Notes** — Client-supplied. The originals are 6.5 / 7.1 MB PNGs and live in the repository root
  with the other originals — **never serve them**; re-run the WebP derivation if they are replaced.

### campaign-silhouette-sun · from `style3.png`
- **Type / orientation** — image, portrait 816×1456 (0.56)
- **Content** — full silhouette of a model against the setting sun, acacia behind, savanna grass
- **Mood** — graphic, hot, monumental, restrained
- **Overlay** — ★★★ excellent. The upper ~45% is near-empty sky
- **Best use** — the ground of the ticket scene (`#tickets`), under a heavy scrim
- **Priority** — 1
- **Notes** — Reads as pure shape; no face, no skin focus. Carried the hero until the client's own header art arrived; it now closes the page instead of opening it.

### campaign-silhouette-drapes · from `style2.png`
- **Type / orientation** — image, portrait
- **Content** — figure in a fringed gown between hanging drapes, backlit acacia beyond
- **Mood** — cinematic, theatrical, dust-and-light
- **Overlay** — ★★★ large calm areas top and sides
- **Best use** — «ДВИЖЕНИЕ» in the pinned tenets chapter (`#pulse`); also the mobile menu ground
- **Priority** — 1

### campaign-sand-drape · from `style1.png`
- **Type / orientation** — image, portrait
- **Content** — model in cream lingerie among sculptural draped fabric, acacia, sand palette
- **Mood** — quiet luxury, controlled, editorial
- **Overlay** — ★★ upper third usable
- **Best use** — «РИТМ», the first beat of the pinned tenets chapter (`#pulse`)
- **Priority** — 2

### campaign-beaded-dusk · from `7.png`
- **Type / orientation** — image, portrait 1728×2304 (0.75)
- **Content** — beadwork and textile look, orange dusk sky, acacia silhouettes
- **Mood** — warm, saturated, frontal
- **Overlay** — ★ busy; use as full image, not a text bed
- **Best use** — «СИЛА» in the pinned tenets chapter (`#pulse`)
- **Priority** — 2

### campaign-palms-gold · from `8.png`
- **Type / orientation** — image, portrait 1856×2304 (0.81)
- **Content** — deep green palms, gold collar and cuffs, misted light
- **Mood** — lush, jewelled, green counterpoint to the sand palette
- **Overlay** — ★★ dark leaf areas hold text
- **Best use** — «СВОБОДА», the last beat of the pinned tenets chapter (`#pulse`); the only strong green in the library — use once
- **Priority** — 2
- **Notes** — Crop to upper body (`object-position: center 22%`).

### campaign-silver-portrait · from `9.png`
- **Type / orientation** — image, portrait 1856×2304 (0.81)
- **Content** — coin-and-chain silver headpiece and necklaces, vessel raised overhead, teal sky
- **Mood** — sculptural, frontal, powerful
- **Overlay** — ★★ flat teal sky at top
- **Best use** — the «Я модель» door in `#join` — it reads as *portrait of a participant*
- **Priority** — 1
- **Notes** — Teal is the one cool colour in the library; it makes burgundy sing. Crop high (`center 18%`).

### runway-walk · from `style5.png`
- **Type / orientation** — image, portrait
- **Content** — model walking a runway, sheer train, spotlights, photographers and seated audience
- **Mood** — live, in-motion, show-scale
- **Overlay** — ★★ dark upper-right
- **Best use** — the VENUE block closing `#experience` — the only campaign frame containing an audience, so it stands in for the Kinema photograph
- **Priority** — 1

### detail-chains · `style4.png` · detail-cuff · `style6.png` · detail-profile · `style7.png`
- **Type / orientation** — images, portrait, macro
- **Content** — body-chain and sequin detail; carved cuff and gold fabric; profile of jaw, neck, shoulder in low light
- **Mood** — intimate, tactile, materials-first
- **Overlay** — ✗ never overlay type
- **Best use** — the trailing hover frames on the «Что вас ждёт» index (`#experience`). Small, never full-bleed
- **Priority** — 2
- **Notes** — These carry the craft story: beadwork, metal, textile.

### poster-key-art · `2.png` · poster-train · `6.png` · poster-duo-dusk · `5.png`
- **Type / orientation** — images, portrait
- **Content** — official campaign key art **with burned-in typography**
- **Overlay** — ✗ **never** — they already contain the title lock-up
- **Best use** — shown *as posters* — framed, at intrinsic ratio, in the gallery closing `#tickets`. **Never as the ticket scene's background**: they already carry the printed lock-up and the scene's own title would double. That ground is `campaign-silhouette-sun`, the hero frame returning as a bookend
- **Priority** — 2
- **Notes** — `poster-key-art` (`2.png`) carries the confirmed show data: «показ lingerie Africa Luxury», **7 ноября**, venue **kinema**. Treat as the source of truth for event facts.

### Unused originals — deliberate
`1.png`, `3.png`, `4.png` — additional key-art variants carrying the same burned-in lock-up as
`5/6`. Three posters is already the ceiling; showing six would turn the tickets chapter into a
contact sheet. Held in reserve.

---

## PREVIOUS SHOW — СЛАВЯНСКИЙ ВЗГЛЯД (real)

### show-reel.mp4 (+ show-reel-poster.webp) · from `video.mp4`
- **Type** — video, landscape 1280×720 → served 1152×648, **46.3 s**, H.264 + AAC
- **Content** — official aftermovie. Gold «СЛАВЯНСКИЙ» title card, then wide stage, lighting rig,
  seated audience, choreography, full finale lineup
- **Mood** — large-scale live production
- **Best use** — beat 2 of `#statusteam`. Poster-first on every width, `playsInline`, mounted only on intent — it is never in the DOM until someone asks for it
- **Priority** — 1
- **Notes** — Original is 24 MB; the served file is 5.7 MB. Never ship the original to the browser.

### archive-lineup · from `pre2.PNG`
- **Type / orientation** — image, **landscape** 1600×1202 (1.33) — the only landscape still
- **Content** — full runway lineup, wings and flower crowns, stage lighting, audience at tables
- **Mood** — scale, occasion, real
- **Overlay** — ★★ dark upper band
- **Best use** — the «Я бренд / партнёр» door in `#join` — proof of a full house — and a guest-wall placeholder
- **Priority** — 1
- **Notes** — Photographer watermark bottom-right. Do not crop it out; credit instead.

### archive-backstage-bw · from `pre1.PNG`
- **Type / orientation** — image, portrait 1067×1600
- **Content** — black-and-white backstage portrait, veil, grain
- **Mood** — quiet, film, intimate
- **Overlay** — ★★★ large dark negative space at left
- **Best use** — the «Я СМИ / блогер» door in `#join`, and the guest wall; already monochrome, needs no filter
- **Priority** — 1

### archive-black-wings · from `pre3.PNG` · archive-flower-crown · from `pre4.PNG`
- **Type / orientation** — images, portrait 1202×1600
- **Content** — black-feather wings look on the runway; flower-crown look mid-walk with audience behind
- **Mood** — theatrical / joyful — the two poles of the previous show
- **Overlay** — ★ figure is centred; keep captions outside the frame
- **Best use** — the guest wall in `#statusteam`, paired
- **Priority** — 2
- **Notes** — Both carry the photographer watermark.

---

## Art-direction rules for this library

1. **Never** put type over `poster-*` or `detail-*`.
2. Campaign imagery is warm sand / ochre / dusk. Burgundy is the *brand* colour and lives in type,
   rules and flat fields — it is not tinted onto the photography.
3. `campaign-palms-gold` (green) and `campaign-silver-portrait` (teal) are the two colour outliers.
   Use each exactly once, far apart.
4. Real archive photography is never filtered. `archive-backstage-bw` is already monochrome.
5. Portrait sources dominate (17 of 20). Any full-bleed landscape band must come from
   `archive-lineup` or the reel.
