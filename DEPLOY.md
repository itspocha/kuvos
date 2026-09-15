# Deploying Kuvos

The site is static. There is no build step — `index.html` in the repo root is the
site. `tools/` exists only so deployment-specific values are not hardcoded.

---

## Configuration

Three values are configurable. They live in `site.config.json` and are applied to
the files by `tools/configure.mjs`.

| Key | Env var | What it sets |
|---|---|---|
| `origin` | `KUVOS_ORIGIN` | `<link rel=canonical>`, `og:url`, `og:image`, `twitter:image`, the JSON-LD block, `robots.txt`, `sitemap.xml` |
| `email` | `KUVOS_EMAIL` | the three `mailto:` links and the JSON-LD `email` |
| `basePath` | `KUVOS_BASE_PATH` | the root-absolute paths in `404.html` and `site.webmanifest` — only needed when the site is **not** served from `/` |
| — | `KUVOS_CNAME` | writes a `CNAME` file into `dist/` for a GitHub Pages custom domain |

```bash
node tools/configure.mjs --check                     # show current values, find stale ones
node tools/configure.mjs --origin https://kuvos.ai --email hello@kuvos.ai
node tools/configure.mjs --base-path kuvos           # served from example.com/kuvos/
node tools/configure.mjs --base-path root            # served from the domain root
```

An unset **or empty** value means "keep what is configured", so CI can pass every
variable whether or not it is defined. To deliberately move the site back to the
root, pass the literal word `root` — a bare `/` gets rewritten by Git Bash before
Node ever sees it, and the script will stop you if that happens.

The committed files always contain real, working values, so `index.html` opens
straight from disk at any time. `configure.mjs` is idempotent and round-trips
losslessly.

---

## GitHub Pages

### 1. Create the repository and push

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

### 2. Turn Pages on

Repository → **Settings** → **Pages** → **Source: GitHub Actions**.

Do *not* pick "Deploy from a branch" — the workflow in
`.github/workflows/deploy.yml` publishes `dist/`, which excludes the docs, tests,
tooling and brand source artwork.

### 3. Set the variables

Repository → **Settings** → **Secrets and variables** → **Actions** → **Variables**.

**Custom domain** (`kuvos.ai`):

| Variable | Value |
|---|---|
| `KUVOS_ORIGIN` | `https://kuvos.ai` |
| `KUVOS_EMAIL` | the real contact address |
| `KUVOS_BASE_PATH` | `root` |
| `KUVOS_CNAME` | `kuvos.ai` |

Then point DNS at GitHub — an `ALIAS`/`ANAME` on the apex to `<you>.github.io`, or
four `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
`185.199.111.153`. Add `www` as a `CNAME` to `<you>.github.io`.

**Project site** (`<you>.github.io/<repo>/`):

| Variable | Value |
|---|---|
| `KUVOS_ORIGIN` | `https://<you>.github.io` |
| `KUVOS_EMAIL` | the real contact address |
| `KUVOS_BASE_PATH` | `<repo>` |

This path is tested — with `basePath` set, every asset, the manifest icons and the
404 page all resolve under the subdirectory.

**User site** (`<you>.github.io`): same as the custom-domain column but with
`KUVOS_ORIGIN=https://<you>.github.io`, `KUVOS_BASE_PATH=root`, and no CNAME.

### 4. Push

Every push to `main` runs the 121-check suite and, if it passes, deploys. Pull
requests run the tests but never publish.

> The test job runs headless Chrome on the runner. It passes locally on every run,
> but I could not verify it on an actual GitHub runner from here. If it turns out to
> be flaky in CI, either drop `needs: test` from the `deploy` job or delete the
> `test` job — deployment does not depend on it.

---

## Vercel — currently live

`vercel.json` is committed, so a connected Vercel project needs no dashboard setup:

```json
"buildCommand": "node tools/configure.mjs && node tools/build.mjs",
"outputDirectory": "dist"
```

This matters: without it Vercel publishes the **repo root**, which serves
`KUVOS-BIBLE.md`, `CLAUDE.md`, the tests and Vipasana's original artwork in
`assets/brand/source/` to anyone who guesses the path. Building to `dist/` leaves
all of it behind.

To override the origin per-environment, set `KUVOS_ORIGIN` (and optionally
`KUVOS_EMAIL`) in **Project → Settings → Environment Variables**. Unset means the
committed `site.config.json` value is used, so nothing breaks if you set nothing.

Headers set in `vercel.json`: `nosniff`, `SAMEORIGIN`, a strict referrer policy,
a week of caching on brand assets, and **must-revalidate on CSS and JS** — those
filenames are not fingerprinted, so a long cache there would serve stale styling
after a deploy.

## Any other static host

Netlify, Cloudflare Pages, S3 — all work the same way.

```bash
node tools/configure.mjs --origin https://your-domain --email you@your-domain
node tools/build.mjs        # writes dist/
```

Publish `dist/`, never the repo root. `404.html` is picked up automatically by
Netlify, Cloudflare Pages and GitHub Pages.

---

## Before you go live

```bash
node tests/run.mjs          # must be 121/121
```

- Confirm the real contact address — `hello@kuvos.ai` is still a placeholder (bible §11)
- Confirm the domain, then re-run `configure.mjs`
- Check the OG card at <https://www.opengraph.xyz> once the domain resolves
- Submit `sitemap.xml` in Google Search Console
