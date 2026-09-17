# assets/brand

## The three marks

Supplied 17 Sep 2026. Regenerate with `python tools/make-brand.py`
(set `POPPINS_LIGHT` to a Poppins Light .ttf first).

| File | Use |
|---|---|
| `kuvos-mark.svg` | the ring alone — favicons, avatars, anywhere too small for words |
| `kuvos-wordmark.svg` | `kuvos` alone |
| `kuvos-logo.svg` | combined, stacked — the primary lockup |
| `kuvos-logo-reverse.svg` | combined for navy grounds |
| `apple-touch-icon.png`, `icon-*.png` | app icons, mark on navy |
| `source/` | artwork as supplied, plus the Poppins Light face. Never served. |

`favicon.ico` sits at the repo root, where browsers look for it.

## Rules

**The wordmark is lowercase.** `kuvos` — never `Kuvos`, never `KUVOS`. The `AI`
suffix is retired; the old `kuvos-lockup*.svg` files that carried it are gone.

**The wordmark is outlined, not set.** It is Poppins Light (300) converted to
vector paths, so it renders identically without the font installed. Do not
replace it with a `<text>` element.

On the site it is defined once in the `index.html` sprite as `#wordmark`; the
header, footer and drawer all `<use>` it. Change it in `kuvos-wordmark.svg` and
the sprite together, or better, re-run the generator.

**The mark is a tapered enso sweep**, traced from the supplied artwork: a 340°
arc on a true circle, widest through the upper left, tapering to a point at the
right. It is one `<path>`. Do not rebuild it as a `<circle>` with a dasharray —
that was the old approximation and it loses the taper.

## Measurements behind the files

The typeface was identified by measuring the artwork, not by eye:

| | artwork | Poppins 300 | Montserrat 300 | Poppins 400 |
|---|---|---|---|---|
| stem / x-height | 0.120 | **0.128** | 0.096 | 0.172 |
| ascender / x-height | 1.410 | **1.381** | 1.431 | 1.395 |
| width / x-height | 4.980 | **4.908** | 5.244 | 5.107 |

Layout, from the supplied combined logo: the ring is **0.544×** the wordmark
width and sits **0.082×** above it.

## Gradient

`url(#lg)`, aqua → signal → navy, running upper-right → lower-left
(`x1="72%" y1="2%" x2="30%" y2="96%"`) so the aqua falls on the mark's blunt
terminal, as in the artwork.
