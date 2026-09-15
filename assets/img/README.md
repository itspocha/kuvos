# assets/img — photography slots

Only `og-card.jpg` is here so far. The page ships with CSS-drawn device mockups and
gradient fields, so it works with zero photography. These slots are where real
photography plugs in.

Use **product and home-life imagery**. Never fitness or celebrity imagery (bible §4).
Bright, spacious, calm. Real homes, real living rooms, real ages.

| File | Where it goes | Aspect | Min width |
|---|---|---|---|
| `hero-home.jpg` | Behind `.hero` — person in a living room, TV + phone visible | 16:9 | 2400px |
| `care-circle.jpg` | Served-user section, beside `.circle-card` | 4:3 | 1600px |
| `accessibility.jpg` | Three-surface section, beside `.a11y` | 4:3 | 1600px |
| `reviewer.jpg` | Controls section, beside `.rev` — clinician reviewing on a laptop | 4:3 | 1600px |
| `og-card.jpg` | Social preview — **already present**, generated from the brand system. Replace only if real photography is approved for it. | 1200×630 | exact |

Export JPEG at quality 80, plus a `.webp` twin if you have it.

## The landing-page opening sequence

`index.html` reserves slots for the animated sequence. They are commented out, so the
page works with nothing in them — drop files in and uncomment.

| Slot | Element | Goes where |
|---|---|---|
| Opening loop | `.open-media` in `index.html` | full-bleed behind the headline |
| Statement 1 | `.say-media` in `#say-1` | behind "For anyone facing incapacity" |
| Statement 2 | `.say-media` in `#say-2` | behind the human-authorization line |
| Statement 3 | `.say-media` in `#say-3` | behind "One protocol. Three surfaces." |

**Opening loop** — `assets/video/open-loop.mp4` (+ `.webm`), 1920×1080, 8–12s seamless,
**no audio**, under 4 MB, plus `assets/img/open-poster.jpg` as the first frame. Uncomment
the `<video>` already written into `.open-media` and delete the two `.glow` spans beside it.

`muted` and `playsinline` are both required or iOS will not autoplay.

**Statement stills** — `assets/img/say-1.jpg`, `say-2.jpg`, `say-3.jpg`, 16:9, min 2400px:

```html
<div class="say-media" aria-hidden="true">
  <img src="assets/img/say-1.jpg" alt="" loading="lazy" width="2400" height="1350">
</div>
```

The CSS already sets `object-fit:cover`, drops them to 26% opacity and lays a navy
scrim over the top, so headline contrast holds without you tuning anything. Keep
`aria-hidden="true"` on the slot and `alt=""` on the image — these carry no meaning,
and the test suite checks for it.

Content direction: slow, calm, ambient. Real homes, real ages, real light. No fast
cuts, no text, no faces in close-up, and never fitness or celebrity imagery (bible §4).

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) { .open-media video { display:none } }
```

## Activating a slot

Hero — uncomment in `styles.css`:

```css
.hero-bg { background: url("../img/hero-home.jpg") center/cover no-repeat; }
.hero-bg::after { content:""; position:absolute; inset:0;
                  background: linear-gradient(90deg, #050D1C 18%, rgba(5,13,28,.72) 60%, rgba(5,13,28,.45)); }
```

The overlay is not optional — hero type must stay AA-contrast over the photo.

Section photos — add to the section's `.rv` column:

```html
<img src="assets/img/care-circle.jpg" alt="" loading="lazy"
     style="border-radius:var(--r-l);box-shadow:var(--sh-l)">
```

Decorative photos take `alt=""`. Anything carrying meaning needs a real alt.

## Brand-illustration option

The product docs also specify illustrated modules (hero illustration, Care Circle
illustration, accessibility illustration). If Vipasana supplies those instead of photos,
same slots, same filenames, PNG with transparency where it helps.
