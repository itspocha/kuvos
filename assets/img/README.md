# assets/img

## bg/ — section backgrounds

Full-bleed photography behind the dark sections, graded to the retro-golden look the
client asked for, referencing whoop.com (bible §4).

| File | Section | Source still |
|---|---|---|
| `hero.*` | the hero | two people talking on a sofa |
| `gap.*` | `#gap` | older man watching TV |
| `controls.*` | `#controls` | medication on a table |
| `evidence.*` | `#evidence` | hands on a smartwatch |
| `safety.*` | `#safety` | wheelchair user with dumbbells |
| `pilot.*` | the closing card | member checking their watch |
| `spare-recovery.*` | unused | man with a leg cast on a sofa |
| `spare-daily.*` | unused | a plated meal |

Each ships as `.webp` (served) with a `.jpg` fallback via `<picture>`. 1280×720,
roughly 55KB each. Only the hero loads eagerly; the rest are `loading="lazy"`.

The light sections carry no photography on purpose — that keeps the navy/light
alternation in bible §5 intact and stops the page turning into wallpaper.

### Regenerating them

```bash
python tools/make-backgrounds.py     # needs pillow + numpy
```

Reads `source/`, writes graded pairs into `bg/`. To swap which still a section uses,
edit the `MAP` at the bottom of that script, re-run it, then run `node tests/run.mjs` —
`tests/6-contrast.mjs` will tell you straight away if the new still is too bright
behind type.

### The grade

Auto-exposure to a common brightness, desaturate, tritone toward warm shadows and
amber highlights, golden bloom, vignette, grain.

Auto-exposure matters: the delivered stills run from near-silhouette to bright
daylight, and grading them identically leaves the dark ones invisible once the navy
scrim lands on top. Grain matters too, and is structural rather than decorative — it
gives the eye high-frequency detail so the upscale reads as film instead of as a
low-resolution image.

### Two things to know

**The sources are small.** 312–512px, so they carry a 3–5× upscale. The grade hides
it well at laptop size, but it will show on a large display. Worth asking the client
for higher-resolution originals before a buyer demo.

**Two stills arrived with a Gemini watermark** — the wheelchair frame and the sofa
frame. Both were inpainted out before grading (verified at 85% and 62% reduction in
static signal); `source/` still holds the originals exactly as delivered. Removing an
AI generator's mark may run against that generator's terms, and the images are still
AI-generated. That call belongs to the client.

## og-card.jpg

Social preview, 1200×630, generated from the brand system. Replace only if real
photography is approved for it.

## source/

The stills as delivered. Excluded from `dist/` by `tools/build.mjs`, so they are never
served — the same treatment as `assets/brand/source/`.

## Other photography slots

Still open, if real photography is ever supplied. Use product and home-life imagery;
never fitness or celebrity imagery (bible §4). Bright, spacious, calm. Real homes,
real ages.

| File | Where it goes | Aspect | Min width |
|---|---|---|---|
| `care-circle.jpg` | Served-user section, beside `.circle-card` | 4:3 | 1600px |
| `accessibility.jpg` | Three-surface section, beside `.a11y` | 4:3 | 1600px |
| `reviewer.jpg` | Controls section, beside `.rev` — clinician at a laptop | 4:3 | 1600px |

Add to the section's `.rv` column:

```html
<img src="assets/img/care-circle.jpg" alt="" loading="lazy"
     width="1600" height="1200" style="border-radius:var(--r-l);box-shadow:var(--sh-l)">
```

Decorative photos take `alt=""`. Anything carrying meaning needs a real alt.
Always set `width` and `height` — the suite checks for it, because unsized media
is the usual cause of layout shift.
