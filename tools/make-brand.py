#!/usr/bin/env python
"""
Generate the Kuvos brand kit: mark, wordmark, and the combined logo.

The wordmark is emitted as outlined paths, not live <text>. A logo has to render
identically on a machine that has never heard of Poppins, so the glyphs are
converted to vectors once, here, rather than depending on a font at display time.

Typeface was identified by measurement rather than eye: the supplied wordmark has
a stem/x-height of 0.120, an ascender/x-height of 1.410 and a width/x-height of
4.980. Poppins Light (300) matches at 0.128 / 1.381 / 4.908 — clearly closer than
Montserrat 300, Poppins 400 or Jost 300.

Proportions come from the supplied combined logo: the ring is 0.544x the wordmark
width, sitting 0.082x above it.

    python tools/make-brand.py

Needs fonttools and pillow. Reads the ring path from assets/brand/kuvos-mark.svg
so the mark stays the single source of truth.
"""
import os
import re
import subprocess
import sys

BRAND = 'assets/brand'
POPPINS = os.environ.get('POPPINS_LIGHT', '')

NAVY = '#0A1424'          # --ink
AQUA, SIGNAL, DEEP = '#19D3E8', '#1E5BFF', '#0A1830'
GRAD = ('<linearGradient id="kuvosGrad" x1="72%" y1="2%" x2="30%" y2="96%">'
        f'<stop offset="0%" stop-color="{AQUA}"/>'
        f'<stop offset="48%" stop-color="{SIGNAL}"/>'
        f'<stop offset="100%" stop-color="{DEEP}"/></linearGradient>')

RING_W_RATIO = 0.544      # ring width as a fraction of wordmark width
GAP_RATIO = 0.082         # gap above the wordmark, same fraction


def ring_path():
    svg = open(f'{BRAND}/kuvos-mark.svg', encoding='utf-8').read()
    return re.search(r'<path[^>]*\sd="([^"]+)"', svg).group(1)


def path_bounds(d):
    xs, ys = [], []
    for m in re.finditer(r'(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)', d):
        xs.append(float(m.group(1)))
        ys.append(float(m.group(2)))
    return min(xs), min(ys), max(xs), max(ys)


def wordmark_outlines(font_path, size=100.0):
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.misc.transform import Transform

    font = TTFont(font_path)
    scale = size / font['head'].unitsPerEm
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']

    parts, x = [], 0.0
    minx = miny = 1e9
    maxx = maxy = -1e9
    for ch in 'kuvos':
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, Transform(scale, 0, 0, -scale, x, 0)))
        d = pen.getCommands()
        if d:
            parts.append(d)
        bp = BoundsPen(gs)
        gs[g].draw(bp)
        if bp.bounds:
            a, b, c, dd = bp.bounds
            minx, maxx = min(minx, a * scale + x), max(maxx, c * scale + x)
            miny, maxy = min(miny, -dd * scale), max(maxy, -b * scale)
        x += hmtx[g][0] * scale
    return ' '.join(parts), (minx, miny, maxx, maxy)


def write(name, body):
    open(f'{BRAND}/{name}', 'w', encoding='utf-8').write(body)
    print(f'  {name}  {os.path.getsize(f"{BRAND}/{name}") // 1024 or 1}KB')


def main():
    if not POPPINS or not os.path.exists(POPPINS):
        sys.exit('Set POPPINS_LIGHT to a Poppins Light (300) .ttf and re-run.\n'
                 'Google Fonts: https://fonts.google.com/specimen/Poppins')

    rp = ring_path()
    rx0, ry0, rx1, ry1 = path_bounds(rp)
    ring_w, ring_h = rx1 - rx0, ry1 - ry0

    wd, (wx0, wy0, wx1, wy1) = wordmark_outlines(POPPINS)
    word_w, word_h = wx1 - wx0, wy1 - wy0

    print('brand kit')

    # ── 1. mark alone ────────────────────────────────────────────────────────
    pad = 4
    write('kuvos-mark.svg',
          f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"\n'
          f'     role="img" aria-label="Kuvos">\n  <title>Kuvos</title>\n'
          f'  <defs>\n    {GRAD}\n  </defs>\n'
          f'  <path fill="url(#kuvosGrad)" d="{rp}"/>\n</svg>\n')

    # ── 2. wordmark alone ────────────────────────────────────────────────────
    write('kuvos-wordmark.svg',
          f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {word_w:.0f} {word_h:.0f}"\n'
          f'     width="{word_w:.0f}" height="{word_h:.0f}" role="img" aria-label="kuvos">\n'
          f'  <title>kuvos</title>\n'
          f'  <path fill="{NAVY}" transform="translate({-wx0:.2f} {-wy0:.2f})" d="{wd}"/>\n</svg>\n')

    # ── 3. combined, stacked ─────────────────────────────────────────────────
    target_ring_w = word_w * RING_W_RATIO
    s = target_ring_w / ring_w
    gap = word_w * GAP_RATIO
    ring_draw_h = ring_h * s
    total_h = ring_draw_h + gap + word_h
    ring_dx = (word_w - target_ring_w) / 2 - rx0 * s
    write('kuvos-logo.svg',
          f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {word_w:.0f} {total_h:.0f}"\n'
          f'     width="{word_w:.0f}" height="{total_h:.0f}" role="img"\n'
          f'     aria-label="Kuvos">\n  <title>Kuvos</title>\n'
          f'  <defs>\n    {GRAD}\n  </defs>\n'
          f'  <g transform="translate({ring_dx:.2f} {-ry0 * s:.2f}) scale({s:.4f})">\n'
          f'    <path fill="url(#kuvosGrad)" d="{rp}"/>\n  </g>\n'
          f'  <path fill="{NAVY}" transform="translate({-wx0:.2f} {ring_draw_h + gap - wy0:.2f})" d="{wd}"/>\n'
          f'</svg>\n')

    # ── 4. reversed combined, for navy grounds ───────────────────────────────
    write('kuvos-logo-reverse.svg',
          f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {word_w:.0f} {total_h:.0f}"\n'
          f'     width="{word_w:.0f}" height="{total_h:.0f}" role="img"\n'
          f'     aria-label="Kuvos">\n  <title>Kuvos</title>\n'
          f'  <defs>\n    {GRAD}\n  </defs>\n'
          f'  <g transform="translate({ring_dx:.2f} {-ry0 * s:.2f}) scale({s:.4f})">\n'
          f'    <path fill="url(#kuvosGrad)" d="{rp}"/>\n  </g>\n'
          f'  <path fill="#FFFFFF" transform="translate({-wx0:.2f} {ring_draw_h + gap - wy0:.2f})" d="{wd}"/>\n'
          f'</svg>\n')

    print(f'\n  wordmark {word_w:.0f}x{word_h:.0f}   ring {target_ring_w:.0f} wide'
          f'   combined {word_w:.0f}x{total_h:.0f}')


if __name__ == '__main__':
    main()
