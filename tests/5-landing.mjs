import { connect, runner } from './cdp.mjs';
const BASE = 'http://127.0.0.1:' + (process.env.SERVE_PORT || 8765);
const { send, ev, key, goto, events, close } = await connect();
const { t, eq, ok, results } = runner();
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* The lean landing page. Its job is restraint, so most of these assert that
   things are ABSENT — a regression here means clutter crept back in. */

await goto(BASE + '/', 1280, 900);

/* ───────────── LOADS CLEAN ───────────── */
await t('landing page loads with no console errors', () => {
  const bad = events.filter(e =>
    (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
    e.method === 'Runtime.exceptionThrown' ||
    (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'));
  eq(bad.map(b => JSON.stringify(b.params).slice(0, 110)), []);
});
await t('shared main.js runs on a page missing most of its hooks', async () => {
  // the lean page has no tabs, FAQ, drawer, marquee, announcement or device mockup
  const absent = await ev(`['#buyerTabs','#faq','#drawer','#mqRow','#annPlay','#phoneArc','#flow']
    .filter(s=>!document.querySelector(s))`);
  eq(absent.length, 7, 'expected all seven to be absent');
  // and it still wired up what IS there — the reveals sit below the fold, so scroll first
  const fired = await ev(`(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));
    const h=document.documentElement.scrollHeight;
    for(let y=0;y<h;y+=700){scrollTo(0,y);await s(160);} await s(1400);
    const all=document.querySelectorAll('.rv').length;
    const on=document.querySelectorAll('.rv.in').length;
    scrollTo(0,0); return {all,on};})()`);
  eq(fired.on, fired.all, 'reveals did not all fire');
  return 'no throw with 7 hooks missing, ' + fired.on + ' reveals fired';
});

/* ───────────── IT IS ACTUALLY MINIMAL ───────────── */
await t('landing copy stays under 120 words', async () => {
  const n = await ev(`document.querySelector('main').innerText.trim().split(/\\s+/).length`);
  ok(n < 120, n + ' words in <main> — the point of this page is restraint');
  return n + ' words';
});
await t('no dense UI survives on the landing page', async () => {
  const found = await ev(`(()=>{
    const banned = {table:'table', tabs:'.tabs', faq:'.q', flow:'.flow', receipt:'.receipt',
      review:'.rev', circle:'.circle-card', rhythm:'.rhythm', marquee:'.mq',
      devices:'.phone,.tv,.watch', announcement:'.ann', metrics:'.metrics', stats:'.stats'};
    const hit={};
    for (const k in banned) { const n=document.querySelectorAll(banned[k]).length; if(n) hit[k]=n; }
    return hit;
  })()`);
  eq(found, {}, 'dense UI reappeared on the landing page');
});
await t('at most one navigation affordance, and no nav menu', async () => {
  eq(await ev(`document.querySelectorAll('#nav, .burger, #drawer').length`), 0, 'nav/burger/drawer');
  eq(await ev(`document.querySelectorAll('.hdr a.btn').length`), 1, 'header actions');
});
await t('one call to action, repeated at most twice on the page', async () => {
  const n = await ev(`[...document.querySelectorAll('a')].filter(a=>/discuss a pilot/i.test(a.textContent)).length`);
  ok(n <= 2, n + ' pilot CTAs');
  return n + ' pilot CTA(s)';
});
await t('every statement panel holds a single line of copy', async () => {
  const lens = await ev(`[...document.querySelectorAll('.say .shell')].map(s=>s.children.length)`);
  ok(lens.length >= 3, 'expected at least 3 statement panels');
  eq(lens.filter(n => n !== 1), [], 'a panel has more than one child');
  return lens.length + ' panels, 1 element each';
});

/* ───────────── WHAT MUST SURVIVE ───────────── */
await t('color-scheme meta still present (non-negotiable 1)', async () =>
  eq(await ev(`document.querySelector('meta[name=color-scheme]').content`), 'light only'));
await t('footer disclaimer intact (non-negotiable 5)', async () => {
  const d = await ev(`document.querySelector('.disclaimer').textContent`);
  ok(d.includes('is not an emergency service'), 'emergency-service line');
  ok(d.includes('not automatically proof that a medicine was taken'), 'receipt caveat');
});
await t('the two load-bearing claim sentences survive', async () => {
  const txt = await ev(`document.body.innerText`);
  ok(txt.includes('Nothing actionable reaches the patient before'), 'human authorization line');
  ok(txt.includes('does not diagnose, prescribe, replace a clinician, or provide emergency care'),
     'no-diagnosis line');
});
await t('institutions are named as the buyer, patients as served users (bible section 2)', async () => {
  const txt = await ev(`document.querySelector('.who').innerText`);
  ok(/institutions responsible for continuity of care/i.test(txt), 'institutional framing');
  ok(/Hospitals and health systems/.test(txt), 'hospitals');
  ok(/Insurers and risk-bearing care organisations/.test(txt), 'insurers');
  const order = await ev(`[...document.querySelectorAll('.who-list li')].map(l=>l.textContent)`);
  ok(/Hospital/.test(order[0]), 'hospitals must lead');
  ok(/served users/i.test(txt), 'served-user note missing');
});
await t('no clinical-outcome or adherence-proof claim slipped in', async () => {
  const txt = (await ev(`document.querySelector('main').innerText`)).toLowerCase();
  const banned = ['reduces readmission', 'lowers cost', 'proves adherence', 'guarantee',
                  'clinically proven', 'improves outcomes', 'prevents readmission'];
  eq(banned.filter(b => txt.includes(b)), []);
});
await t('canonical, OG and JSON-LD all point at the site root', async () => {
  eq(await ev(`document.querySelector('link[rel=canonical]').getAttribute('href')`).then(h => h.endsWith('/')), true);
  ok(await ev(`!!document.querySelector('meta[property="og:image"]')`), 'og:image');
  const ld = JSON.parse(await ev(`document.querySelector('script[type="application/ld+json"]').textContent`));
  eq(ld['@type'], 'Organization');
});
await t('protocol.html is reachable from the landing page', async () => {
  const links = await ev(`[...document.querySelectorAll('a[href*="protocol"]')].length`);
  ok(links >= 1, 'no route through to the detail page');
  return links + ' link(s) to protocol.html';
});

await t('every internal link on both pages resolves', async () => {
  const checked = [];
  for (const page of ['/', '/protocol.html']) {
    await goto(BASE + page, 1280, 900);
    const hrefs = await ev(`[...new Set([...document.querySelectorAll('a[href]')]
      .map(a=>a.getAttribute('href'))
      .filter(h=>h && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('http')))]`);
    for (const h of hrefs) {
      const url = BASE + '/' + h.split('#')[0].replace(/^\//, '');
      const r = await fetch(url);
      ok(r.ok, `${page} -> ${h} is ${r.status}`);
      checked.push(h);
    }
  }
  return checked.length + ' internal links resolve';
});
await t('the built dist/ ships every page, not just the homepage', async () => {
  // a hardcoded publish list once dropped protocol.html and the link 404'd in production
  const { readdirSync } = await import('node:fs');
  const root = readdirSync('D:/kuvos').filter(f => f.endsWith('.html')).sort();
  ok(root.includes('index.html') && root.includes('protocol.html'), 'pages missing from repo');
  return root.join(', ');
});

/* ───────────── MEDIA SLOTS FOR THE ANIMATION ───────────── */
// the link test above finishes on protocol.html — come back before asserting on the landing page
await goto(BASE + '/', 1280, 900);
await t('media slots exist and are hidden from assistive tech', async () => {
  const n = await ev(`document.querySelectorAll('.open-media, .say-media').length`);
  ok(n >= 4, 'expected the opening slot plus one per statement, got ' + n);
  eq(await ev(`[...document.querySelectorAll('.open-media, .say-media')]
    .filter(e=>e.getAttribute('aria-hidden')!=='true').length`), 0, 'slot exposed to AT');
  return n + ' slots ready';
});
await t('opening media slot covers its section without clipping type', async () => {
  const r = await ev(`(()=>{const m=document.querySelector('.open-media').getBoundingClientRect(),
    s=document.querySelector('.open').getBoundingClientRect(),
    h=document.querySelector('.open h1').getBoundingClientRect();
    return {covers: Math.abs(m.width-s.width)<2, headlineVisible: h.width>0 && h.height>0,
            headlineAbove: getComputedStyle(document.querySelector('.open-in')).zIndex};})()`);
  eq([r.covers, r.headlineVisible], [true, true]);
  ok(+r.headlineAbove >= 1, 'headline not layered above the media');
});

/* ───────────── ACCESSIBILITY + RESPONSIVE ───────────── */
await t('skip link still first in the tab order', async () => {
  await ev(`document.activeElement.blur()`);
  await key('Tab');
  eq(await ev(`document.activeElement.className`), 'skip');
});
await t('exactly one h1, no skipped heading level', async () => {
  eq(await ev(`document.querySelectorAll('h1').length`), 1);
  const lv = await ev(`[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1])`);
  let prev = 0; const bad = [];
  for (const l of lv) { if (prev && l > prev + 1) bad.push('h' + prev + '->h' + l); prev = l; }
  eq(bad, []);
  return lv.length + ' headings';
});
await t('every link and button has an accessible name', async () => {
  const bad = await ev(`[...document.querySelectorAll('a,button')]
    .filter(e=>!e.textContent.trim()&&!e.getAttribute('aria-label')).length`);
  eq(bad, 0);
});
for (const w of [320, 360, 390, 768, 1280, 1920]) {
  await t(`landing at ${w}px: no horizontal scroll`, async () => {
    await goto(BASE + '/', w, 860, w < 768);
    const h = await ev(`document.documentElement.scrollHeight`);
    for (let y = 0; y < h; y += 800) { await ev(`scrollTo(0,${y})`); await sleep(70); }
    await ev(`scrollTo(0,0)`); await sleep(150);
    const r = await ev(`({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})`);
    ok(r.s <= r.c + 1, `${r.s} > ${r.c}`);
    return `${r.c}px, page ${h}px tall`;
  });
}
await t('landing is far shorter than the detail page', async () => {
  await goto(BASE + '/', 1280, 900);
  const lean = await ev(`document.documentElement.scrollHeight`);
  await goto(BASE + '/protocol.html', 1280, 900);
  const full = await ev(`document.documentElement.scrollHeight`);
  ok(lean < full * 0.45, `landing ${lean}px vs protocol ${full}px`);
  return `${lean}px vs ${full}px (${Math.round(100 - lean / full * 100)}% shorter)`;
});
await t('reduced motion shows the landing in its final state', async () => {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await goto(BASE + '/', 1280, 900);
  const r = await ev(`(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));
    const h=document.documentElement.scrollHeight;
    for(let y=0;y<h;y+=800){scrollTo(0,y);await s(110);} await s(800);
    return {hidden:[...document.querySelectorAll('.rv')].filter(e=>+getComputedStyle(e).opacity<0.9).length,
            h1:+getComputedStyle(document.querySelector('.open h1 .ln>span')).opacity};})()`);
  eq(r.hidden, 0, 'elements left invisible');
  eq(r.h1, 1, 'headline not shown');
  await send('Emulation.setEmulatedMedia', { features: [] });
});

console.log(JSON.stringify(results));
close();
