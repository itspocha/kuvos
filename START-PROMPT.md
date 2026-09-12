# Kickoff prompt

Paste this as your first message in Claude Code after opening the folder in VS Code.

---

```
Read KUVOS-BIBLE.md and CLAUDE.md in full before touching anything, then give me a
two-line summary of what this project is and what the hard rules are, so I know you
have them.

Context: Kuvos is a B2B healthcare infrastructure platform. It turns authorised care
plans into a Cross-Screen Adherence Protocol across smartphone, Smart TV and smartwatch.
The buyers are hospitals, insurers and healthcare-data buyers. Patients and families are
served users, not the customer. This is a static site — vanilla HTML, CSS and JS, no
build step, no dependencies.

Then do this, in order, stopping after each for my review:

1. Audit. Open index.html, assets/css/styles.css and assets/js/main.js and report
   anything that contradicts the bible — wrong section order, a hardcoded colour outside
   the token list, copy that breaks a claim-discipline rule, a missing accessibility
   affordance. Don't fix anything yet, just list it.

2. Responsive pass. Check the header, hero device stage and all tables at 360px, 390px,
   768px and 1280px. The header has broken twice before at mobile widths. Report what
   you find and propose fixes.

3. Then wait for me.

Rules for the whole session:
- Never remove <meta name="color-scheme" content="light only"> from index.html
- Never reorder the page sections
- Never put patients in the primary-buyer position
- Never state or imply a clinical outcome, adherence proof, or readmission effect
- Animate transform and opacity only, using the two existing easing curves
- Content changes go in the data arrays at the top of main.js, not in the markup
- If I ask for something that breaks one of these, tell me before doing it

Be direct. If something I ask for is a bad idea, say so.
```

---

## Follow-up prompts you'll want later

**Add the photography**
```
Read assets/img/README.md. I've added hero-home.jpg and care-circle.jpg. Wire up both
slots exactly as that README specifies, including the hero gradient overlay — hero type
must stay AA contrast over the photo. Show me the diff before applying.
```

**Add the hero video**
```
Read assets/video/README.md. I've added kuvos-loop.mp4 and hero-poster.jpg. Activate the
video, keep the .glow layers over it, and add the prefers-reduced-motion rule that hides
it. Verify it still autoplays on iOS — muted and playsinline both present.
```

**Build the families page**
```
Create for-families.html. Reuse assets/css/styles.css unchanged — do not fork the
stylesheet. This page inverts the hierarchy: the relative of an expatriate is the reader.
Content comes from the Care Circle, Daily Rhythm, accessibility and FAQ sections of the
bible. Keep every claim-discipline rule. Add it to the footer nav, not the main nav.
```

**Deck-ready export**
```
Create a print stylesheet so the Trusted Agent Infrastructure flow, the Review view card
and the receipt card each print cleanly on their own A4 page with a white background.
This is for an accelerator application, so it needs to survive a PDF export.
```

**Performance pass**
```
Audit for Core Web Vitals. Report LCP, CLS risks and total blocking time as the page
stands. Suggest fixes that don't add a build step. Do not suggest a framework.
```
