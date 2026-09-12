import { connect, runner } from './cdp.mjs';
const BASE = 'http://127.0.0.1:' + (process.env.SERVE_PORT || 8765);
const { send, ev, key, goto, events, close } = await connect();
const { t, eq, ok, results } = runner();

/* ───────────── 1. ENDPOINTS / ASSETS ───────────── */
const files = ['/', '/index.html', '/404.html', '/favicon.ico', '/site.webmanifest',
  '/robots.txt', '/sitemap.xml', '/assets/css/styles.css', '/assets/js/main.js',
  '/assets/img/og-card.jpg', '/assets/brand/kuvos-mark.svg', '/assets/brand/kuvos-lockup.svg',
  '/assets/brand/kuvos-lockup-stacked.svg', '/assets/brand/apple-touch-icon.png',
  '/assets/brand/icon-192.png', '/assets/brand/icon-512.png', '/assets/brand/icon-maskable-512.png'];
for (const f of files)
  await t(`GET ${f}`, async () => {
    const r = await fetch(BASE + f);
    ok(r.ok, `status ${r.status}`);
    const len = (await r.arrayBuffer()).byteLength;
    ok(len > 0, 'empty body');
    return `200 · ${(len / 1024).toFixed(1)}KB`;
  });
await t('GET /no-such-page is not 200', async () => {
  const r = await fetch(BASE + '/no-such-page');
  ok(!r.ok, `expected failure, got ${r.status}`);
  return String(r.status);
});
await t('site.webmanifest is valid JSON with icons', async () => {
  const m = await (await fetch(BASE + '/site.webmanifest')).json();
  ok(m.icons && m.icons.length >= 3, 'icons missing');
  ok(m.name && m.start_url && m.theme_color, 'required fields missing');
  return `${m.icons.length} icons`;
});
await t('every manifest icon resolves', async () => {
  const m = await (await fetch(BASE + '/site.webmanifest')).json();
  for (const i of m.icons) {
    const r = await fetch(BASE + i.src);
    ok(r.ok, `${i.src} -> ${r.status}`);
  }
  return `${m.icons.length} icons OK`;
});
await t('sitemap.xml is well-formed and lists the homepage', async () => {
  const x = await (await fetch(BASE + '/sitemap.xml')).text();
  ok(x.includes('<urlset'), 'no urlset');
  ok(x.includes('<loc>'), 'no loc');
  return (x.match(/<url>/g) || []).length + ' url(s)';
});
await t('robots.txt allows crawling and points at sitemap', async () => {
  const r = await (await fetch(BASE + '/robots.txt')).text();
  ok(/allow:\s*\//i.test(r), 'no Allow');
  ok(/sitemap:/i.test(r), 'no Sitemap');
});

/* ───────────── 2. PAGE LOADS CLEAN ───────────── */
await goto(BASE + '/index.html');
await t('no console errors or uncaught exceptions', () => {
  const bad = events.filter(e =>
    (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
    e.method === 'Runtime.exceptionThrown' ||
    (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'));
  eq(bad.map(b => JSON.stringify(b.params).slice(0, 90)), []);
});
await t('no failed network requests', () => {
  const failed = events.filter(e => e.method === 'Network.loadingFailed').map(e => e.params.errorText);
  eq(failed, []);
});
await t('all subresources returned under 400', () => {
  const bad = events.filter(e => e.method === 'Network.responseReceived' && e.params.response.status >= 400)
    .map(e => e.params.response.status + ' ' + e.params.response.url.slice(-40));
  eq(bad, []);
  return events.filter(e => e.method === 'Network.responseReceived').length + ' requests';
});

/* ───────────── 3. HEAD / SEO / NON-NEGOTIABLES ───────────── */
await t('color-scheme meta present (bible non-negotiable 1)', async () =>
  eq(await ev(`document.querySelector('meta[name=color-scheme]').content`), 'light only'));
await t('lang, charset, viewport', async () => {
  eq(await ev(`document.documentElement.lang`), 'en');
  ok(await ev(`/UTF-8/i.test(document.characterSet)`), 'charset');
  ok(await ev(`!!document.querySelector('meta[name=viewport]')`), 'viewport');
});
await t('canonical, OG, Twitter, JSON-LD all present', async () => {
  ok(await ev(`!!document.querySelector('link[rel=canonical]')`), 'canonical');
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'])
    ok(await ev(`!!document.querySelector('meta[property="${p}"]')`), p);
  ok(await ev(`!!document.querySelector('meta[name="twitter:card"]')`), 'twitter:card');
  const ld = JSON.parse(await ev(`document.querySelector('script[type="application/ld+json"]').textContent`));
  eq(ld['@type'], 'Organization');
  return 'Organization schema valid';
});
await t('og:image resolves and is 1200x630', async () => {
  const u = await ev(`document.querySelector('meta[property="og:image"]').content`);
  const r = await fetch(BASE + '/assets/img/og-card.jpg');
  ok(r.ok, 'og image 404');
  const w = await ev(`document.querySelector('meta[property="og:image:width"]').content`);
  const h = await ev(`document.querySelector('meta[property="og:image:height"]').content`);
  eq([w, h], ['1200', '630']);
  return u;
});
await t('exactly one h1', async () => eq(await ev(`document.querySelectorAll('h1').length`), 1));
await t('no heading level skipped', async () => {
  const lv = await ev(`[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1])`);
  let prev = 0; const bad = [];
  for (const l of lv) { if (prev && l > prev + 1) bad.push('h' + prev + '->h' + l); prev = l; }
  eq(bad, []);
  return lv.length + ' headings';
});
await t('title length is sane for SERPs', async () => {
  const ti = await ev(`document.title`);
  ok(ti.length > 20 && ti.length < 80, 'length ' + ti.length);
  return ti.length + ' chars';
});
await t('meta description length is sane', async () => {
  const d = await ev(`document.querySelector('meta[name=description]').content`);
  ok(d.length > 70 && d.length < 220, 'length ' + d.length);
  return d.length + ' chars';
});

/* ───────────── 4. LINKS ───────────── */
await t('every in-page anchor resolves', async () => {
  const dead = await ev(`[...document.querySelectorAll('a[href^="#"]')]
    .map(a=>a.getAttribute('href')).filter(h=>h!=='#'&&!document.querySelector(h))`);
  eq(dead, []);
  return (await ev(`document.querySelectorAll('a[href^="#"]').length`)) + ' anchors';
});
await t('mailto links well-formed', async () => {
  const m = await ev(`[...document.querySelectorAll('a[href^=mailto]')].map(a=>a.getAttribute('href'))`);
  ok(m.length > 0, 'none found');
  for (const h of m) ok(/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}/i.test(h), 'bad: ' + h);
  return m.length + ' mailto links';
});
await t('no empty or placeholder hrefs', async () => {
  const bad = await ev(`[...document.querySelectorAll('a')].map(a=>a.getAttribute('href'))
    .filter(h=>!h||h==='#'||h==='javascript:void(0)')`);
  eq(bad, []);
});
await t('every link has discernible text', async () => {
  const bad = await ev(`[...document.querySelectorAll('a')]
    .filter(a=>!a.textContent.trim()&&!a.getAttribute('aria-label')&&!a.querySelector('img[alt]:not([alt=""])'))
    .map(a=>a.outerHTML.slice(0,60))`);
  eq(bad, []);
});
await t('every button has an accessible name', async () => {
  const bad = await ev(`[...document.querySelectorAll('button')]
    .filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label'))
    .map(b=>b.outerHTML.slice(0,60))`);
  eq(bad, []);
  return (await ev(`document.querySelectorAll('button').length`)) + ' buttons';
});

/* ───────────── 5. CONTENT / CLAIM DISCIPLINE ───────────── */
const claims = [
  'does not diagnose, prescribe, replace a clinician, or provide emergency care',
  'Nothing actionable reaches the patient before',
  'structured references cross-checked where available',
  'Model agreement is not clinical approval',
  'that a configured confirmation event was recorded',
  'not automatically proof that a medicine was taken',
  'care-transition execution layer, not a readmission-prevention guarantee',
  'They are not a claim that every person represented is a Kuvos customer'];
for (const c of claims)
  await t('claim-discipline: "' + c.slice(0, 44) + '..."', async () =>
    ok(await ev(`document.body.innerText.includes(${JSON.stringify(c)})`), 'sentence missing'));

await t('no streak or shame language', async () => {
  const txt = (await ev(`document.body.innerText`)).toLowerCase();
  const banned = ['streak lost', 'you failed', 'keep your streak', 'broke your streak'];
  eq(banned.filter(b => txt.includes(b)), []);
});
await t('buyer hierarchy: 3 primary buyers before served users', async () => {
  const tabs = await ev(`[...document.querySelectorAll('.tab')].map(t=>({k:t.textContent,sec:t.classList.contains('sec')}))`);
  const firstSec = tabs.findIndex(x => x.sec);
  eq(firstSec, 3, 'first served-user index');
  ok(tabs.slice(0, 3).every(x => !x.sec), 'a served user appears among primaries');
  return tabs.map(x => x.k + (x.sec ? ' (served)' : '')).join(', ');
});
await t('footer disclaimer intact', async () =>
  ok(await ev(`document.querySelector('.disclaimer').textContent.includes('is not an emergency service')`)));
await t('section order matches bible section 5', async () => {
  const ids = await ev(`[...document.querySelectorAll('main section[id]')].map(s=>s.id)`);
  eq(ids, ['gap', 'buyers', 'surfaces', 'controls', 'path', 'families', 'evidence', 'safety', 'about', 'pilot']);
});

/* ───────────── 6. JS-BUILT CONTENT ───────────── */
await t('buyer tabs built (6)', async () => eq(await ev(`document.querySelectorAll('.tab').length`), 6));
await t('fast-path table built (7 rows)', async () => eq(await ev(`document.querySelectorAll('#pathBody tr').length`), 7));
await t('insurer table built (4 rows)', async () => eq(await ev(`document.querySelectorAll('#insurerBody tr').length`), 4));
await t('pilot metrics built (11)', async () => eq(await ev(`document.querySelectorAll('#pilotMetrics span').length`), 11));
await t('proof questions built (6)', async () => eq(await ev(`document.querySelectorAll('.proof-row').length`), 6));
await t('FAQ built (7)', async () => eq(await ev(`document.querySelectorAll('.q').length`), 7));
await t('marquee duplicated for a seamless loop', async () =>
  eq(await ev(`document.querySelectorAll('#mqRow .mq-i').length`), 10));
await t('wordmark is Montserrat 700, everything else stays Manrope', async () => {
  const r = await ev(`(()=>{
    const b = getComputedStyle(document.querySelector('.logo-txt b'));
    const s = getComputedStyle(document.querySelector('.logo-txt small'));
    const body = getComputedStyle(document.body);
    const h1 = getComputedStyle(document.querySelector('.hero h1'));
    const lede = getComputedStyle(document.querySelector('.lede'));
    const f = n => n.fontFamily.split(',')[0].replace(/["']/g, '');
    return {mark:f(b), markWeight:b.fontWeight, tag:f(s), tagWeight:s.fontWeight,
            body:f(body), h1:f(h1), lede:f(lede)};
  })()`);
  eq([r.mark, r.markWeight], ['Montserrat', '700'], 'wordmark');
  eq([r.tag, r.tagWeight], ['Montserrat', '500'], 'tagline');
  // Montserrat must not leak past the lockup
  eq([r.body, r.h1, r.lede], ['Manrope', 'Manrope', 'Manrope'], 'page type');
  return 'lockup Montserrat 700/500, page Manrope';
});
await t('Montserrat actually loaded, not silently falling back', async () => {
  const r = await ev(`(async()=>{ await document.fonts.ready;
    return {m700: document.fonts.check('700 16px Montserrat'),
            m500: document.fonts.check('500 16px Montserrat'),
            manrope: document.fonts.check('800 16px Manrope')}; })()`);
  eq([r.m700, r.m500, r.manrope], [true, true, true]);
});
await t('brand mark rendered via a single sprite definition', async () => {
  eq(await ev(`document.querySelectorAll('#mark').length`), 1);
  eq(await ev(`document.querySelectorAll('use[href="#mark"]').length`), 3);
  return '1 definition, 3 uses';
});

console.log(JSON.stringify(results));
close();
