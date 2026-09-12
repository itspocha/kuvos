# KUVOS — PROJECT BIBLE

**Version 1.0 · Last updated 12 Sep 2026**

This is the single source of truth for the Kuvos website. If anything in the code
contradicts this file, the code is wrong. If a request contradicts this file, stop
and ask before changing it.

Derived from: *Kuvos Product Document v1.0* and *Kuvos Landing-Page Content*.

---

## 1. WHAT KUVOS IS

**Core promise:** One authorised care plan, made executable for anyone facing incapacity.

**One-liner:** Kuvos connects smartphone, Smart TV, and smartwatch into a practical
Cross-Screen Adherence Protocol that helps anyone with incapacity follow an authorised
healthcare plan one step at a time.

**Category:** A care-plan execution and coordination layer. A trusted agent layer between
the care plan and the home. **Not** an autonomous prescriber, not a diagnostic system, not
a fitness tracker, not a medication reminder app, not a token-first data marketplace.

---

## 2. CUSTOMER HIERARCHY — NON-NEGOTIABLE

Kuvos is a **B2B healthcare infrastructure and workflow platform.**

**Primary commercial customers**
1. Hospitals and health systems
2. Insurers and risk-bearing care organisations
3. Healthcare-data and pharmaceutical research buyers

**Secondary served users**
Patients with temporary, permanent, cognitive, sensory, physical, situational or other
incapacity affecting plan execution; permissioned care circles; relatives; delegated
caregivers; clinicians.

> **Do not describe vulnerable patients as the primary customer or buyer.** The product is
> designed around their needs, but the commercial relationship is with the institution that
> authorises, funds, deploys, or purchases the protocol.

**Mandatory messaging order, everywhere:**
institutional continuity gap → Kuvos protocol infrastructure → patient and care-circle
experience → governed evidence and buyer value.

---

## 3. CLAIM DISCIPLINE — THE HARD RULES

These exist for legal and regulatory reasons. Breaking one is a serious error.

| Rule | Correct | Never write |
|---|---|---|
| No diagnosis or prescription | "Kuvos does not diagnose, prescribe, replace a clinician, or provide emergency care." | Anything implying clinical decision-making |
| Human authorization | "Nothing actionable reaches the patient before human authorization." | "AI approves", "auto-activates" |
| Reference checks | "structured reference cross-checks **where available**" | "verified against the medical registry" |
| Model agreement | Model consensus is **not** clinical approval. Human authorization must visually dominate the AI steps. | Presenting AI steps as peers of the authorization step |
| Receipts | "A receipt proves a configured confirmation event was recorded." | "proves the medicine was taken", "proves adherence", "proves an outcome" |
| Market stats | Demographic context only, with source and caveat | Implying those people are Kuvos users |
| Pilot metrics | Proof **questions** until pilot data exists | Presenting mockups as clinical outcomes |
| Outcomes | "can improve visibility, accessibility, workflow continuity" | "reduces readmissions", "lowers cost" |
| Positioning | "care-transition execution layer" | "readmission-prevention guarantee" |
| Founder claims | Only what is publicly citable | Unverified fundraising or role claims |

**Tone:** measured, confident, precise. Not sentimental, not fear-based, not overly clinical.

---

## 4. BRAND — "TRUSTED SIGNAL"

Two systems exist. Do not mix them up.

- **Trusted Signal** — the public landing page. Deep-navy fields, high contrast, restrained
  Signal Blue actions, Electric Aqua network cues, modular evidence sections, generous
  negative space. Premium and data-led.
- **Clean Signal** — the *product UI* (phone / TV / watch mockups). Bright white, soft
  cloud-blue, deep ink type, cobalt action, aqua progress. Keep this inside the device
  mockups only.

### Palette (CSS custom properties in `styles.css`)

| Token | Hex | Use |
|---|---|---|
| `--navy` | `#050D1C` | Deepest field. Hero, gap, controls, evidence, safety, final CTA |
| `--navy-2` | `#0A1830` | Raised dark surfaces |
| `--ink` | `#0A1424` | Type on light |
| `--signal` | `#1E5BFF` | **Primary action only.** Restrained — one per view |
| `--signal-d` | `#1240C8` | Signal hover |
| `--aqua` | `#19D3E8` | Network cues, live states, progress, eyebrows on dark |
| `--aqua-soft` | `#E0FAFD` | Aqua pill backgrounds |
| `--cloud` | `#EFF5FC` | Light section ground |
| `--white` | `#FFFFFF` | Evidence modules, cards |
| `--lime` | `#8FCB2B` | **Restrained.** Daily Rhythm + watch confirm only |
| `--coral` | `#FF6B5A` | **Attention states only.** Conflict flags, the +50% delta |
| `--muted` | `#57687F` | Body text on light |
| `--on-dark` | `#A9BCD6` | Body text on navy |

**Forbidden:** emerald-heavy themes, muddy greens, dense dashboards, saturated colour
fields, fitness or celebrity imagery.

### Type
- **Manrope** 400–800 — everything structural. Headings at 800, `letter-spacing: -.038em`.
- **Montserrat** — **the wordmark only.** `--f-mark`, applied to `.logo-txt` so the
  header, footer and drawer lockups pick it up together. Nothing else on the page uses
  it. `KUVOS AI` at **700**, tagline at **500**. Those weights are measured from the
  supplied artwork, not chosen: her wordmark has a stem-to-cap ratio of 0.216, and
  Montserrat 700 is 0.225 against 800's 0.275. Do not "round up" to 800 — it is visibly
  heavier than the logo.
- **Instrument Serif italic** — the accent phrase inside a headline. One per heading,
  never more. Wrapped in `<em>`. Examples: *care at home*, *held, not guessed*,
  *observable between encounters*.
- Fluid scale via `clamp()`. Measure: `h2` capped at 18ch, body at 58ch.

> The stacked artwork (`assets/brand/source/logo-stacked.jpeg`) sets *lowercase* "kuvos"
> in Montserrat **400** — a different lockup from the header's uppercase `KUVOS AI`.
> `kuvos-lockup-stacked.svg` reproduces it; `kuvos-lockup.svg` is the header lockup.

### Logo
The Loop Leaf / ring mark is inline SVG using `url(#lg)` — an aqua→signal→navy gradient
running upper-right → lower-left, so the aqua falls on the mark's blunt terminal.

The mark is a **tapered enso sweep** traced from the supplied artwork: a 340° arc on a
true circle, widest through the upper left and tapering to a point at the right. It is a
single `<path>`, defined once as `<g id="mark">` in the `index.html` sprite and referenced
by the header, footer and drawer with `<use href="#mark"/>`.

Lockup is `KUVOS AI` with `AI` in aqua, tagline `INTELLIGENT ADHERENCE PROTOCOLS`.
Files: `assets/brand/kuvos-mark.svg`, `kuvos-lockup.svg`, `kuvos-lockup-stacked.svg` —
see `assets/brand/README.md`. The tagline hides below 560px.

---

## 5. PAGE SEQUENCE — LOCKED

Do not reorder without approval. This is the mandated buyer-first sequence.

1. Announcement rail — claim-discipline lines, pause/play
2. Header — sticky, scroll progress bar
3. **Hero** (navy) — three-surface stage, `See how Kuvos works` / `Talk to the team`
4. Marquee — buyer types
5. **The execution gap** (navy) — AHRQ / NCQA framing, three gap cards
6. **Buyer selector** (white) — 6 tabs, primary buyers first, served users dashed
7. **Three-surface network** (cloud) — phone + TV primary, watch companion, a11y strip
8. **Trusted-agent controls** (navy) — 5-node flow → Review view → Receipt
9. **Fast path** (white) — 7-row table, "Open. Act. Done."
10. **Served-user experience** (cloud) — Care Circle + Daily Rhythm
11. **Governed evidence** (navy) — insurer table, pilot metrics, proof questions
12. **Why this matters now** (white) — WHO counters + caveat
13. **Safety** (navy) — five principles
14. **Founder–market fit** (white)
15. **FAQ** (cloud)
16. **Pilot CTA** (navy card)
17. Footer — disclaimer with the confirmation-event caveat

**One major visual per section.** Never place two diagrams or dashboards side by side.

---

## 6. MOTION SPEC — "WHOOP-SMOOTH"

- Two curves only: `--e: cubic-bezier(.16,.84,.44,1)` and `--e-out: cubic-bezier(.22,1,.36,1)`
- Reveals: 1.05s, `translateY(32px)` → 0, staggered 100ms via `.rv-1 / .rv-2 / .rv-3`
- **Transform and opacity only.** Never animate layout properties
- Long and soft. No bounce, no overshoot, no snap
- Sequences: flow nodes 320ms apart · review fields 320ms · Care Circle messages 620ms ·
  rhythm bars 150ms · counters ease over 1.6s
- Ambient: glow drifts on 30–38s cycles, device float on 11–12s, aqua cue dashes travel 2.6s
- Scroll handlers are rAF-throttled and `{passive:true}`
- `prefers-reduced-motion: reduce` kills everything and shows final state

---

## 7. ACCESSIBILITY — THIS IS THE PRODUCT THESIS

The site must not contradict what the product claims.

- `<meta name="color-scheme" content="light only">` **must stay.** Without it, in-app
  browsers (WhatsApp, Instagram) force-invert the page and navy text lands on black.
  This has already broken once.
- Visible focus rings (`:focus-visible`, aqua, 2px)
- All interactive elements are real `<button>` / `<a>` with `aria-expanded`, `aria-hidden`,
  `aria-live` where relevant
- Contrast: minimum AA. On navy use `--on-dark`, never `--muted`
- Touch targets ≥ 42px
- Wide content scrolls inside `.tbl-wrap`, never the page body
- Test at 360px, 390px, 768px, 1280px

---

## 8. FILE MAP

```
index.html              all markup, SVG sprite in <defs> at top
404.html                not-found page, reuses styles.css unchanged
favicon.ico             multi-size, mark on navy
site.webmanifest        PWA icons and theme colours
robots.txt              allows all, points at the sitemap
sitemap.xml             one entry, the homepage
assets/
├── css/styles.css      tokens first, then components in page order, print last
├── js/main.js          all content data + interactions, one IIFE
├── img/                photography + og-card.jpg (see img/README.md)
├── video/              hero loop (see video/README.md)
└── brand/              marks, lockups, app icons, source artwork
KUVOS-BIBLE.md          this file
CLAUDE.md               instructions for Claude Code
README.md               how to run
```

**Content lives in JS arrays** at the top of `main.js`: `BUYERS`, `PATH`, `INSURER`,
`METRICS`, `PROOF`, `FAQ`. Edit those, not the markup.

---

## 9. COMPONENT INVENTORY

| Component | Where | Notes |
|---|---|---|
| `.ann` | Announcement rail | 3 rotating items, pause/play, 5.2s |
| `.hdr` + `.scrollbar` | Header | Sticky, active-nav tracking |
| `.stage` | Hero | Stacks on mobile, layers at 1060px+ |
| `.cue` | Hero | Aqua dashed network lines, desktop only |
| `.tabs` + `.buyer` | Buyer selector | `.tab.sec` = dashed = served user |
| `.flow` / `.node` | Controls | Lights sequentially; `.guard` = safety guardrail |
| `.rev` | Review view | Source chips, `.field.flag` = conflict, `.lockbar` |
| `.receipt` | Controls | Metadata rows + the caveat note |
| `.circle-card` | Served users | Three messages, `.warnmsg` = escalation |
| `.rhythm` | Served users | Bars fill on scroll, no streak language |
| `.stats` | Why now | `data-count` drives the counter |
| `.final` | Pilot CTA | Pulsing aqua radial |

---

## 10. COPY CONVENTIONS

- British-leaning spelling as in source docs: *authorised* in prose, `authorized` where it
  already appears in UI strings. Be consistent within a block.
- "Cross-Screen Adherence Protocol" — capitalised, it's the product name
- "Locked Draft State", "Care Circle", "Daily Rhythm" — capitalised
- Never streak or shame language. "Your rhythm paused" not "streak lost"
- Never fear-based framing of patient risk
- Microcopy: **Open. Act. Done.**
- UI labels, exact: `4 of 5 checked` · `3-day rhythm` · `Up next` · `Mark done`

---

## 11. OPEN ITEMS

- [ ] `hello@kuvos.ai` is a placeholder — replace with the real address
- [ ] `https://kuvos.ai/` is assumed as the canonical origin in `<link rel="canonical">`,
      `og:url`, `og:image`, the JSON-LD block, `robots.txt` and `sitemap.xml`. Confirm the
      real domain and update all six.
- [x] Favicon, apple-touch-icon and deck lockups — added, traced from the supplied artwork
- [x] `og-card.jpg` — generated from the brand system; replace if real photography lands
- [ ] Founder badges: confirm public wording with Vipasana before launch
- [ ] Photography not yet supplied — see `assets/img/README.md`
- [ ] Hero video loop not yet supplied — see `assets/video/README.md`
- [ ] Named clinical design partner to add once an LOI exists
- [ ] Decide whether the Solana / USDC layer appears at all. Current decision: **it does
      not appear on this page.** The docs say lead with the healthcare problem, not crypto.
      If it returns, it must be framed as consent receipts and revocable auditable
      authorization — never as "optional crypto payments"
- [ ] `/for-families` as a separate consumer page, later — not on this one

---

## 12. THINGS THAT HAVE ALREADY GONE WRONG

Learn from these rather than repeating them.

1. **Missing `color-scheme`** → in-app browsers inverted the page, navy text on black,
   looked completely broken. Never remove that meta tag.
2. **`max-width` on a container instead of the heading** → body copy crushed into a 20ch
   column. Measure belongs on `h2`, not `.head`.
3. **Header overflow at 390px** → CTA ran off-screen and the burger was pushed out, so
   there was no menu at all on mobile. Always test the header at 360px first.
4. **Hero device layering on mobile** → absolutely-positioned phone clipped off-screen and
   covered the TV card's text. Devices stack below **1180px** (raised from 1060px: at
   1060–1180 the stage column is too narrow, and the phone still covered the TV card's
   accessibility caption line). The hero grid still goes two-column at 1060px.
5. **Patient-first framing** → contradicted the canonical customer hierarchy. Buyer first.
6. **A media query placed *above* the rule it overrides** → `@media(min-width:1060px){.burger{display:none}}`
   sat before `.burger{display:grid}`, so at equal specificity the later rule won and the
   burger stayed visible next to the full desktop nav. Media queries add no specificity —
   put them after the base rule.
7. **Transitioning `visibility`** on the drawer → it was still computed `hidden` at the
   moment the open handler called `.focus()`, so focus never entered the drawer. Use
   `visibility 0s linear <duration>` when closing and `visibility 0s` when opening.
8. **The five trusted-agent flow nodes rendered as visual peers** → this breaks the §3 rule
   that human authorization must dominate the AI steps. The authorization node now gets a
   wider grid track, a raised aqua surface and a larger title.
