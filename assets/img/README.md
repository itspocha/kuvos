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
