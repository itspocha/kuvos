# Kuvos — landing page

Static site. No build step, no dependencies.

```bash
# open it
open index.html

# or serve it — needed for favicon.ico, site.webmanifest and 404.html,
# which use root-absolute paths
python3 -m http.server 5173
```

## Structure

```
index.html               markup + inline SVG sprite
404.html                 not-found page, same stylesheet
favicon.ico              multi-size, mark on navy
site.webmanifest         PWA icons + theme colours
robots.txt, sitemap.xml
vercel.json              build + headers for the Vercel deployment
assets/css/styles.css    tokens, then components in page order, print rules last
assets/js/main.js        content arrays + interactions
assets/img/              photography + og-card.jpg (README inside)
assets/video/            hero loop (README inside)
assets/brand/            marks, lockups, app icons (README inside)
tests/                   automated checks, no dependencies (README inside)
tools/                   configure.mjs + build.mjs, Node built-ins only
DEPLOY.md                hosting, DNS and CI setup
KUVOS-BIBLE.md           brand, copy rules, claim discipline — read this
CLAUDE.md                instructions for Claude Code
```

## Testing

```bash
node tests/run.mjs     # 121 checks: endpoints, a11y, responsive, motion, perf, 404
```

No npm dependencies — Node built-ins plus the Chrome already installed. See
`tests/README.md`. Run it before every deploy.

## Editing content

Content lives in arrays at the top of `assets/js/main.js`: `BUYERS`, `PATH`, `INSURER`,
`METRICS`, `PROOF`, `FAQ`. Change the data, not the markup.

Colours live in the token block at the top of `assets/css/styles.css`. Never hardcode a
hex in a component rule — if a colour isn't a token, it doesn't belong on the page.

## Before changing copy

Read `KUVOS-BIBLE.md` §3. This is a healthcare product and several sentences on this page
are load-bearing for legal reasons.

## Configuration

The origin, contact address and base path are not hardcoded — they live in
`site.config.json` and are applied by `tools/configure.mjs`:

```bash
node tools/configure.mjs --check
node tools/configure.mjs --origin https://kuvos.ai --email hello@kuvos.ai
```

`hello@kuvos.ai` is still a placeholder (bible §11).

## Deploy

See **`DEPLOY.md`**. Live on Vercel — `vercel.json` builds `dist/` so the docs,
tests and brand source artwork are never served. GitHub Pages is also wired up in
`.github/workflows/deploy.yml`, which runs the suite before it publishes.

For any other host:

```bash
node tools/configure.mjs --origin https://your-domain --email you@your-domain
node tools/build.mjs      # writes dist/ — docs, tests and brand source excluded
```

Publish `dist/`. No build command, no env vars, no install step. `404.html` is
picked up automatically by Netlify, Cloudflare Pages and GitHub Pages.
