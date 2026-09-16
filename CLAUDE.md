# CLAUDE.md — working instructions for this repo

## Read this first

Before your first edit in any session, read **`KUVOS-BIBLE.md`** in full. It is the source
of truth for brand, palette, motion, page order, customer hierarchy, and the claim-discipline
rules. If a request conflicts with the bible, say so and ask before proceeding.

This is a healthcare product. Copy accuracy is a legal matter, not a style preference.

## What this is

A static marketing site for Kuvos — a Cross-Screen Adherence Protocol for hospitals,
insurers and healthcare-data buyers. No build step, no framework, no dependencies.
Open `index.html` in a browser and it runs.

```
index.html               all markup + inline SVG sprite (the mark lives here as #mark)
404.html                 not-found page, reuses styles.css unchanged
favicon.ico              multi-size, mark on navy
site.webmanifest         PWA icons + theme colours
robots.txt / sitemap.xml
assets/css/styles.css    design tokens first, then components in page order, print last
assets/js/main.js        content data arrays + all interactions, single IIFE
assets/img/              photography + og-card.jpg — see its README
assets/video/            hero loop — see its README
assets/brand/            marks, lockups, app icons, source artwork — see its README
tests/                   automated checks, no dependencies — see its README
```

## Conventions

- **Vanilla only.** No npm, no bundler, no framework, no CSS preprocessor. If you think a
  dependency is needed, ask first.
- **Content lives in `main.js`**, in the arrays at the top: `BUYERS`, `PATH`, `INSURER`,
  `METRICS`, `PROOF`, `FAQ`. Edit data, not markup, for content changes.
- **Colours come from custom properties.** Never hardcode a hex in a component rule. If a
  colour isn't in the token list, it doesn't belong on the page.
- **Animate transform and opacity only.** Two easing curves exist (`--e`, `--e-out`); use
  them. No new easings, no bounce.
- Plain ES5-compatible JS, no build target concerns. Match the existing style.
- Keep CSS in page order so the file reads like the page.

## Non-negotiables — do not change without explicit approval

1. `<meta name="color-scheme" content="light only">` in `<head>`. Removing it breaks the
   page in WhatsApp and Instagram browsers.
2. The page section order (bible §5).
3. The customer hierarchy — institutions are the buyer, patients are served users (bible §2).
4. Any sentence in the claim-discipline table (bible §3), especially the receipt caveat and
   the "where available" qualifier on reference checks.
5. The footer disclaimer.

## Before you finish any task

- Check the header at 360px — it has broken twice
- Check that nothing scrolls the page body sideways
- Check `prefers-reduced-motion` still shows final state, not blank elements
- Check contrast on navy sections uses `--on-dark`, not `--muted`
- Check the keyboard path: skip link → header → tabs (arrow keys) → FAQ → drawer
  (focus enters it, Escape returns focus to the burger)
- Don't leave `TODO` in shipped markup; put it in bible §11 instead
- If you touch anything behind the section photography, re-run the suite —
  `tests/6-contrast.mjs` measures real text against the real composited background
  and is the only check that can see a photograph washing out body copy

Then run the suite — it covers all of the above and 114 more checks:

```bash
node tests/run.mjs
```

It must be 128/128 before you call a task done. Add a case to `tests/` for any bug
you fix, so it cannot come back.

## Common tasks

**Add a photo** → read `assets/img/README.md`, it lists every slot with the exact filename
and the one CSS rule to activate it.

**Add the hero video** → read `assets/video/README.md`. The markup is already in
`.hero-bg`, commented out.

**Add a new section** → place it per the bible's sequence, alternate navy/light so bands
don't collide, use `.rv` for reveal, register any scroll-fired animation in the `fire()`
function in `main.js`.

**Change copy** → check it against bible §3 and §10 before writing it.

**Split into pages** → `/for-families` is planned but not built. It reuses `styles.css`
unchanged. Do not fork the stylesheet.

## What I'd like you to push back on

If I ask for something that would:
- put patients in the primary-buyer position,
- state or imply a clinical outcome, adherence proof, or readmission effect,
- add streak, shame, or fear-based language,
- introduce crypto or token language into the main narrative,
- or remove an accessibility affordance,

…tell me it conflicts with the bible and why, before doing it.
