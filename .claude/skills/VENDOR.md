# Vendored skills — provenance

Every skill in this directory is a **vendored copy** of an upstream source, checked
into the repo on purpose: Claude Code sessions here (web, CI, a fresh clone) get the
skills with no install step and no network fetch, and the exact revision in use is
reviewable in git.

Installed 2026-08-15.

| Skill(s) | Upstream | Revision | Licence |
|---|---|---|---|
| `frontend-design`, `webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills) | `f6656c1` | see each skill's `LICENSE.txt` |
| `gsap-framer-scroll-animation` | [github/awesome-copilot](https://github.com/github/awesome-copilot) `skills/` | `a80885b` | MIT (GitHub, Inc.) |
| `responsive-craft` | [kylezantos/responsive-craft](https://github.com/kylezantos/responsive-craft) | `4863701` | MIT |
| `ui-ux-pro-max` + `ui-styling`, `design-system`, `design`, `brand`, `banner-design`, `slides` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) v2.13.0, its `.claude/skills/` payload | `a38d04c` | MIT |

## Local modifications

Upstream ships these skills as *plugins*, so their script paths are written against
a plugin root that does not exist for a project-level skill. Two placeholders were
rewritten to repo-relative paths; nothing else was touched.

| File(s) | From | To |
|---|---|---|
| `ui-ux-pro-max/SKILL.md` | `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max` | `.claude/skills/ui-ux-pro-max` |
| `responsive-craft/SKILL.md`, `responsive-craft/workflows/*.md` | `${CLAUDE_SKILL_DIR}` | `.claude/skills/responsive-craft` |

Scripts are invoked from the repo root, so keep the working directory there.

`responsive-craft`'s three Node scripts are CommonJS, and this package is
`"type": "module"` — as `.js` they die on the first `require`. They were renamed
`preview.js`/`serve-static.js`/`snapshot.js` → `.cjs`, and every reference in the
skill's own docs updated to match.

## Updating

Re-clone the upstream at the new revision, copy the same subtrees, re-apply the two
path rewrites above, and update the revisions in this table. For the UI/UX Pro Max
kit the upstream CLI (`npx ui-ux-pro-max-cli init --ai claude`) does the same job and
writes the paths correctly — use it if it is not blocked by the sandbox.

## Known gaps

- `responsive-craft/scripts/snapshot.js` shells out to a `dev-browser` CLI that is not
  part of this repo and is not installed. Its sibling `preview.js` (static
  multi-breakpoint preview) works standalone. For real screenshots use `webapp-testing`
  with Playwright, or `npm run verify` — both drive the actual browser.
- `design`, `banner-design` and parts of `ui-styling` reach for image-generation APIs
  (Gemini) and a canvas font set. They are installed for completeness of the kit but
  are not wired to any credentials here.
