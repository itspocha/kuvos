"""
Turn the client's stills into WHOOP-style full-bleed backgrounds.

Source frames are small (312-512px), so they carry a 3-5x upscale. The grade is
built to absorb that: desaturate, warm-grade, add a golden light bloom, vignette,
then lay real grain over the top. Grain is doing structural work here, not
decoration — it gives the eye high-frequency detail to lock onto so the upscale
reads as film rather than as a low-resolution image.
"""
from PIL import Image, ImageEnhance, ImageFilter, ImageChops
import numpy as np
import os

OUT_W, OUT_H = 1280, 720          # 16:9; sits under a scrim at ~30% opacity,
                                  # so 1280 is ample for a 1920 viewport and a third the weight

# retro golden — warm amber highlights over cool-brown shadows
SHADOW = np.array([34, 26, 22], dtype=float)
MID    = np.array([150, 120, 88], dtype=float)
HIGH   = np.array([255, 214, 150], dtype=float)


def smart_crop(im, tw, th):
    """Cover-crop to the target ratio, biased slightly above centre so faces survive."""
    w, h = im.size
    scale = max(tw / w, th / h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = int((nh - th) * 0.40)
    return im.crop((left, top, left + tw, top + th))


def upscale(im, tw, th):
    """Two-stage upscale: LANCZOS, a whisper of blur to kill stair-stepping,
    then unsharp to put micro-contrast back. Beats a single hard resize."""
    im = smart_crop(im, tw, th)
    im = im.filter(ImageFilter.GaussianBlur(0.5))
    im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=115, threshold=2))
    return im


def auto_exposure(a, target=118.0, max_gain=2.6):
    """Lift each frame to a common working brightness before grading.

    The delivered stills range from near-silhouette to bright daylight. Grading
    them identically leaves the dark ones invisible once the navy scrim lands on
    top, so normalise first and grade second. Percentile-based, so a small blown
    highlight or a black corner does not drag the whole frame."""
    lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
    lo, hi = np.percentile(lum, 3), np.percentile(lum, 97)
    if hi - lo > 6:                       # stretch the usable range to 8..244
        a = (a - lo) * (236.0 / (hi - lo)) + 8.0
        lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
    med = float(np.median(lum))
    if med > 1:
        a = a * np.clip(target / med, 1 / max_gain, max_gain)
    return np.clip(a, 0, 255)


def tritone(a, strength=0.72):
    """Map luminance onto shadow->mid->high. This is what makes it read 'retro'."""
    lum = (a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114) / 255.0
    lum = np.clip(lum, 0, 1)[..., None]
    lo = SHADOW + (MID - SHADOW) * (lum / 0.5)
    hi = MID + (HIGH - MID) * ((lum - 0.5) / 0.5)
    mapped = np.where(lum < 0.5, lo, hi)
    return a * (1 - strength) + mapped * strength


def golden_bloom(w, h, cx=0.72, cy=0.22, radius=0.95, power=1.0):
    """A warm light source bleeding in from one corner — the 'glow' the client asked for."""
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    d = np.sqrt(((xx / w - cx) * 1.35) ** 2 + ((yy / h - cy) * 1.0) ** 2) / radius
    fall = np.clip(1.0 - d, 0, 1) ** 2.1
    glow = np.zeros((h, w, 3))
    for i, c in enumerate((255, 196, 118)):
        glow[..., i] = fall * c * power
    return glow


def vignette(w, h, amount=0.46):
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    d = np.sqrt((xx / w - .5) ** 2 + (yy / h - .5) ** 2) / 0.72
    return np.clip(1.0 - (d ** 2.3) * amount, 0, 1)[..., None]


def grain(w, h, amount=9.0, seed=7):
    rng = np.random.default_rng(seed)
    g = rng.normal(0, amount, (h, w))
    g = np.asarray(Image.fromarray(np.clip(g + 128, 0, 255).astype(np.uint8))
                   .filter(ImageFilter.GaussianBlur(0.48))).astype(float) - 128
    return g[..., None]


def process(src, dst_base, bloom_at=(0.72, 0.22), seed=7):
    im = Image.open(src).convert('RGB')
    im = upscale(im, OUT_W, OUT_H)
    im = ImageEnhance.Color(im).enhance(0.55)          # pull saturation before the grade
    a = np.asarray(im).astype(float)
    a = auto_exposure(a)
    a = tritone(a, 0.72)
    a = a + golden_bloom(OUT_W, OUT_H, *bloom_at) * 0.34
    a = a * vignette(OUT_W, OUT_H)
    a = a + grain(OUT_W, OUT_H, 6.0, seed)
    a = np.clip(a, 0, 255).astype(np.uint8)
    out = Image.fromarray(a)
    out = ImageEnhance.Contrast(out).enhance(1.06)
    out.save(dst_base + '.jpg', quality=74, optimize=True, progressive=True)
    out.save(dst_base + '.webp', quality=70, method=6)
    return out


if __name__ == '__main__':
    SRC = 'D:/kuvos/client-images'
    SP = 'C:/Users/roizl/AppData/Local/Temp/claude/d--kuvos/cc3e26c5-fd2d-4410-91b4-b28eeb91aa15/scratchpad'
    OUT = SP + '/bg'
    os.makedirs(OUT, exist_ok=True)
    # watermark-free versions replace the two that carried the Gemini sparkle
    OVERRIDE = {
        'guy-with-a-dumble-doing-exercise.jpg': SP + '/clean-dumbbell2.jpg',
        'member-sitting-on-coach-watching-laptop.jpg': SP + '/clean-sofa.jpg',
    }
    BLOOM = {  # keep the light away from where the headline sits in each section
        'old-man-watching-tv.jpg': (0.74, 0.20),
        'two-people-talking-on-sofa.jpg': (0.78, 0.18),
        'medicines-out-of-the-jar.jpg': (0.68, 0.24),
        'member-sitting-on-coach-watching-laptop.jpg': (0.80, 0.22),
        'man-watching-his-watch.jpg': (0.70, 0.20),
        'guy-with-a-dumble-doing-exercise.jpg': (0.76, 0.24),
        'member-checking-his-health.jpg': (0.72, 0.20),
        'member-eating-healthy-food.jpg': (0.74, 0.26),
    }
    for i, f in enumerate(sorted(os.listdir(SRC))):
        if not f.lower().endswith('.jpg'):
            continue
        src = OVERRIDE.get(f, os.path.join(SRC, f))
        stem = f[:-4]
        process(src, os.path.join(OUT, stem), BLOOM.get(f, (0.72, 0.22)), seed=7 + i)
        print('graded', stem)
