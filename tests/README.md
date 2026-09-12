# tests

An automated check of the live page, driven through the Chrome DevTools Protocol.
**No npm dependencies** — Node built-ins plus the Chrome already on the machine.
Nothing here ships to the site.

```bash
node tests/run.mjs
```

It starts a static server on :8765, launches headless Chrome, runs every suite and
exits non-zero if anything fails.

| Suite | Covers |
|---|---|
| `1-endpoints.mjs` | Every asset returns 200, manifest/sitemap/robots valid, no console errors, no failed requests, head/SEO/JSON-LD, links and anchors, claim-discipline sentences, buyer hierarchy, section order, JS-built content |
| `2-accessibility.mjs` | Skip link, alt text, decorative SVGs hidden, touch targets, focus ring, tablist ARIA, FAQ ARIA, drawer inert/focus-trap/Escape, table scopes, and every tab / FAQ / drawer / announcement interaction |
| `3-responsive-motion.mjs` | No horizontal scroll at 14 widths (320→1920), header integrity, hero device layering, table and tab scroll containers, motion spec compliance, all 47 reveals, reduced motion, page weight, FCP, the 404 page |
| `4-framerate.mjs` | Records every frame while scrolling the whole page; reports median/p95/worst frame time and dropped frames |

## Gotchas

**Launch Chrome with GPU rasterisation.** `run.mjs` passes `--enable-gpu
--ignore-gpu-blocklist --enable-gpu-rasterization`. Without them the blurred hero
glows rasterise on the CPU and `4-framerate.mjs` reports ~15fps that real browsers
never see. With them it is a locked 60fps.

**Don't use Python's `http.server`.** It is single-threaded and doesn't handle
keep-alive, which crashes Node's `fetch` mid-suite. `serve.mjs` exists for this.

**Full-page screenshots need a tall viewport, not `captureBeyondViewport`.** That
flag re-renders the page and the scroll reveals come back invisible, so you get
blank bands. Emulate a tall viewport instead, in segments under 8000px.

## Adding a test

Suites use the tiny harness in `cdp.mjs`:

```js
await t('what it should do', async () => {
  eq(await ev(`document.querySelectorAll('.thing').length`), 3);
  return 'optional detail shown in the report';
});
```

`t` records pass/fail, `eq` deep-compares, `ok` asserts, `ev` evaluates in the page,
`key` dispatches a real keypress, `goto` navigates at a given viewport.
