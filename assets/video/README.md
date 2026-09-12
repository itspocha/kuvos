# assets/video — hero loop

The hero currently animates with CSS glow drifts. A brand loop can play behind it.

| File | Spec |
|---|---|
| `kuvos-loop.mp4` | H.264, 1920×1080, 8–12s seamless loop, **no audio**, under 3 MB |
| `kuvos-loop.webm` | VP9 twin, optional |
| `hero-poster.jpg` | First frame, 1920×1080, shown before the video decodes |

Content direction: slow, calm, ambient. A home interior, light moving, a screen waking. No
fast cuts, no text, no faces in close-up. It sits at 32% opacity behind navy — treat it as
texture, not a film.

## Activating

In `index.html`, inside `.hero-bg`, uncomment:

```html
<video autoplay muted loop playsinline poster="assets/video/hero-poster.jpg">
  <source src="assets/video/kuvos-loop.mp4" type="video/mp4">
</video>
```

`muted` and `playsinline` are required or iOS will not autoplay. Keep the `.glow` spans —
they layer over the video and carry the Electric Aqua cue.

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) { .hero-bg video { display:none } }
```
