# assets/brand

## Files

| File | What it is |
|---|---|
| `kuvos-mark.svg` | The ring mark, standalone, transparent background |
| `kuvos-lockup.svg` | Horizontal lockup — mark + `KUVOS AI` + tagline, for light grounds |
| `kuvos-lockup-stacked.svg` | Stacked lockup with the aqua tagline rules, matching the supplied artwork |
| `apple-touch-icon.png` | 180×180, mark on navy |
| `icon-192.png`, `icon-512.png` | PWA icons, referenced by `/site.webmanifest` |
| `icon-maskable-512.png` | Same, with the 20% maskable safe zone |
| `source/` | The original supplied artwork (JPEG) the vectors were traced from |

`favicon.ico` lives at the repo root because browsers look for it there. It is a
multi-size ICO (16 → 256) of the mark on navy.

## The mark

It is **not** a constant-width ring. It is a tapered enso sweep, traced from
`source/mark.jpeg`: a 340° arc on a true circle whose stroke runs from a blunt
terminal at the upper right, widest through the upper left, tapering to a point
back at the right. The measured centreline is a circle to within ~1.3px, so the
taper is the only thing that varies.

That shape is a single `<path>`. Do not replace it with a `<circle>` and a
`stroke-dasharray` — that was the old approximation and it loses the taper.

The mark is inlined once in `index.html` as `<g id="mark">` inside the sprite
`<defs>`, and the header, footer and drawer all reference it with
`<use href="#mark"/>`. **If you change the mark here, change it there too** —
they are two copies of the same path.

## Gradient

`url(#lg)`, aqua → signal → navy, running upper-right → lower-left
(`x1="72%" y1="2%" x2="30%" y2="96%"`) so the aqua lands on the blunt terminal,
as in the supplied artwork.

The supplied artwork's midtone is a cyan-blue (~`#0A91D1`) rather than
`--signal` `#1E5BFF`. The bible's three stops were kept. If you want an exact
match to the JPEG instead, change the middle stop — in `kuvos-mark.svg`,
`kuvos-lockup*.svg` **and** the `#lg` gradient in `index.html`.

## Type

The wordmark is **Montserrat**; everything else on the site stays Manrope. The weights
are measured from the supplied artwork rather than guessed:

| Asset | Set in | Measured stem/cap |
|---|---|---|
| `KUVOS AI` (header lockup) | Montserrat **700** | artwork 0.216 · Montserrat 700 = 0.225 |
| `kuvos` (stacked artwork) | Montserrat **400** | artwork 0.118 · Montserrat 400 = 0.138 |
| tagline | Montserrat **500** | artwork 0.133 · Montserrat 500 = 0.145 |

Montserrat 800 measures 0.275 — noticeably heavier than the logo. Don't use it.

## Lockup rules (bible §4)

- `KUVOS AI` — `AI` in Electric Aqua `#19D3E8`
- Tagline `INTELLIGENT ADHERENCE PROTOCOLS`, letter-spacing `.17em`, sized to
  match the wordmark width, hidden below 560px in the site header
- Mark on white, cloud-blue, or deep-ink surfaces only

The lockup SVGs set type as live `<text>` in Manrope with a system fallback, so
they render correctly anywhere Manrope is available and acceptably where it is
not. For print or a deck where the exact letterforms matter, convert the text to
outlines in a design tool first — that needs a font engine this repo does not have.
