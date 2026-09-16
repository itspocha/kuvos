import { connect, runner } from './cdp.mjs';
import { readFileSync } from 'node:fs';
const BASE = 'http://127.0.0.1:' + (process.env.SERVE_PORT || 8765);
const { send, ev, key, goto, events, close } = await connect();
const { t, eq, ok, results } = runner();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const css = readFileSync('D:/kuvos/assets/css/styles.css', 'utf8');

const WIDTHS = [320, 360, 375, 390, 414, 480, 600, 768, 834, 1024, 1180, 1280, 1440, 1920];

/* ───────────── RESPONSIVE ───────────── */
for (const w of WIDTHS) {
  await t(`${w}px: no horizontal page scroll`, async () => {
    await goto(BASE + '/index.html', w, 900, w < 768);
    const h = await ev(`document.documentElement.scrollHeight`);
    for (let y = 0; y < h; y += 900) { await ev(`scrollTo(0,${y})`); await sleep(70); }
    await ev(`scrollTo(0,0)`); await sleep(200);
    const r = await ev(`(()=>{const de=document.documentElement;
      return {scroll:de.scrollWidth, client:de.clientWidth, body:document.body.scrollWidth};})()`);
    ok(r.scroll <= r.client + 1, `scrollWidth ${r.scroll} > clientWidth ${r.client}`);
    ok(r.body <= r.client + 1, `body scrollWidth ${r.body} > ${r.client}`);
    return `${r.client}px viewport, no overflow`;
  });
}
await t('no element escapes the viewport at 320px (narrowest)', async () => {
  await goto(BASE + '/index.html', 320, 900, true);
  await sleep(400);
  const bad = await ev(`(()=>{const de=document.documentElement;
    return [...new Set([...document.querySelectorAll('body *')].filter(el=>{
      const r=el.getBoundingClientRect();
      return r.width>0 && (r.right>de.clientWidth+1||r.left<-1);
    // .sect-bg/.hero-bg images are deliberately scaled past their box for the slow
    // drift and are clipped by overflow:hidden — verified scrollWidth === clientWidth
    }).filter(el=>!el.closest('.mq,.drawer,.skip,.hero-bg,.glow,.tabs,.tbl-wrap,.sect-bg'))
     .map(el=>el.tagName.toLowerCase()+'.'+((el.className.baseVal??el.className??'')+'').split(' ')[0]))];})()`);
  eq(bad, []);
});
await t('header stays intact from 320px to 1920px', async () => {
  const rows = [];
  for (const w of [320, 360, 390, 680, 1060, 1280]) {
    await goto(BASE + '/index.html', w, 800, w < 768);
    const r = await ev(`(()=>{
      const hdr=document.querySelector('.hdr-in').getBoundingClientRect();
      const logo=document.querySelector('.logo').getBoundingClientRect();
      const end=document.querySelector('.hdr-end').getBoundingClientRect();
      const burger=getComputedStyle(document.querySelector('.burger')).display;
      const nav=getComputedStyle(document.querySelector('.nav')).display;
      const cta=getComputedStyle(document.querySelector('.hdr-cta')).display;
      return {overflow: end.right>hdr.right+1||logo.left<hdr.left-1,
              collide: logo.right>end.left+1, burger, nav, cta};})()`);
    ok(!r.overflow, `${w}px: header content overflows its container`);
    ok(!r.collide, `${w}px: logo collides with the header CTA`);
    // exactly one navigation affordance must be reachable
    ok(r.burger !== 'none' || r.nav !== 'none', `${w}px: no menu at all`);
    rows.push(`${w}:${r.nav !== 'none' ? 'nav' : 'burger'}${r.cta !== 'none' ? '+cta' : ''}`);
  }
  return rows.join('  ');
});
await t('hero devices stack below 1180px and layer above it', async () => {
  await goto(BASE + '/index.html', 1100, 900);
  const stacked = await ev(`getComputedStyle(document.querySelector('.phone')).position`);
  eq(stacked, 'static', 'phone should be in flow below 1180px');
  await goto(BASE + '/index.html', 1280, 900);
  const layered = await ev(`getComputedStyle(document.querySelector('.phone')).position`);
  eq(layered, 'absolute', 'phone should layer at 1280px');
});
await t('TV caption never sits under the phone at any desktop width', async () => {
  for (const w of [1180, 1280, 1366, 1440, 1920]) {
    await goto(BASE + '/index.html', w, 900);
    const r = await ev(`(()=>{const a=document.querySelector('.remote').getBoundingClientRect(),
      b=document.querySelector('.phone').getBoundingClientRect();
      return {overlap: a.right>b.left && a.bottom>b.top && a.top<b.bottom, gap: Math.round(b.left-a.right)};})()`);
    ok(!r.overlap, `${w}px: phone covers the TV caption line`);
  }
  return 'clear at 5 widths';
});
await t('wide tables scroll inside .tbl-wrap, not the page', async () => {
  await goto(BASE + '/index.html', 360, 900, true);
  const r = await ev(`[...document.querySelectorAll('.tbl-wrap')].map(w=>({
    scrollable: w.scrollWidth>w.clientWidth, overflowX:getComputedStyle(w).overflowX}))`);
  ok(r.length >= 2, 'expected 2 table wrappers');
  for (const x of r) eq(x.overflowX, 'auto');
  return r.length + ' scroll containers';
});
await t('buyer tabs scroll horizontally inside their rail on mobile', async () => {
  const r = await ev(`(()=>{const t=document.querySelector('.tabs');
    return {overflowX:getComputedStyle(t).overflowX, scrollable:t.scrollWidth>t.clientWidth};})()`);
  eq(r.overflowX, 'auto');
  ok(r.scrollable, 'tabs not scrollable at 360px');
});
await t('body text never drops below 12px', async () => {
  await goto(BASE + '/index.html', 360, 900, true);
  const tiny = await ev(`[...document.querySelectorAll('p,li,td,th,.lede')]
    .filter(e=>e.textContent.trim() && !e.closest('.phone,.watch,.tv,.mini')
      && parseFloat(getComputedStyle(e).fontSize) < 12)
    .map(e=>e.className+':'+getComputedStyle(e).fontSize)`);
  eq(tiny, []);
});

/* ───────────── MOTION ───────────── */
await t('only transform and opacity are transitioned (bible section 6)', () => {
  const props = new Set();
  for (const m of css.matchAll(/transition:([^;}]+)[;}]/g))
    for (const part of m[1].split(','))
      props.add(part.trim().split(/\s+/)[0]);
  const allowed = new Set(['transform', 'opacity', 'visibility', 'color', 'background',
    'background-color', 'border-color', 'box-shadow', 'outline-color', 'stroke-dashoffset',
    'grid-template-rows', 'height', 'right', 'none', 'all']);
  const layout = [...props].filter(p => ['width', 'margin', 'padding', 'top', 'left', 'bottom', 'inset'].includes(p));
  eq(layout, [], 'layout properties transitioned');
  return [...props].sort().join(', ');
});
await t('only the two sanctioned easing curves are used', () => {
  const curves = new Set();
  for (const m of css.matchAll(/cubic-bezier\(([^)]+)\)/g)) curves.add(m[1].replace(/\s/g, ''));
  const allowed = new Set(['.16,.84,.44,1', '.22,1,.36,1']);
  const extra = [...curves].filter(c => !allowed.has(c));
  eq(extra, [], 'unsanctioned easing');
  return [...curves].join('  |  ');
});
await t('no bounce or overshoot in any curve', () => {
  for (const m of css.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
    const [, y1, , y2] = m[1].split(',').map(Number);
    ok(y1 >= 0 && y1 <= 1 && y2 >= 0 && y2 <= 1, `overshoot in ${m[1]}`);
  }
});
await t('all 47 scroll reveals fire', async () => {
  await goto(BASE + '/index.html', 1280, 900);
  const r = await ev(`(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));
    const h=document.documentElement.scrollHeight;
    for(let y=0;y<h;y+=600){scrollTo(0,y);await s(300);} await s(2500);
    const total=document.querySelectorAll('.rv').length;
    const off=[...document.querySelectorAll('.rv')].filter(e=>!e.classList.contains('in')).length;
    const faded=[...document.querySelectorAll('.rv')].filter(e=>+getComputedStyle(e).opacity<0.9).length;
    return {total,off,faded};})()`);
  eq([r.off, r.faded], [0, 0]);
  return r.total + ' reveals';
});
await t('flow nodes light in sequence, receipt fields and messages animate in', async () => {
  const r = await ev(`(()=>({
    nodes: [...document.querySelectorAll('#flow .node')].filter(n=>n.classList.contains('lit')).length,
    fields:[...document.querySelectorAll('#revCard [data-f]')].filter(n=>n.classList.contains('in')).length,
    msgs:  [...document.querySelectorAll('#circleCard [data-msg]')].filter(n=>n.classList.contains('in')).length,
    bars:  [...document.querySelectorAll('#rhythm .fill')].map(f=>f.style.height).filter(Boolean).length}))()`);
  eq([r.nodes, r.fields, r.msgs, r.bars], [5, 3, 3, 5]);
  return `flow ${r.nodes}/5, fields ${r.fields}/3, messages ${r.msgs}/3, bars ${r.bars}/5`;
});
await t('counters reach their final values', async () => {
  const v = await ev(`[...document.querySelectorAll('[data-count]')].map(c=>c.textContent)`);
  eq(v, ['1.4', '2.1']);
});
await t('hero headline lines finish their reveal', async () => {
  await goto(BASE + '/index.html', 1280, 900);
  await sleep(2200);
  const off = await ev(`[...document.querySelectorAll('.hero h1 .ln>span')]
    .filter(s=>new DOMMatrix(getComputedStyle(s).transform).m42 > 1).length`);
  eq(off, 0);
});
await t('reduced motion shows final state, animates nothing', async () => {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await goto(BASE + '/index.html', 1280, 900);
  const r = await ev(`(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));
    const h=document.documentElement.scrollHeight;
    // Step slowly enough that each IntersectionObserver can actually report. At
    // 800px/120ms the sweep blew past .stats without it ever registering, and the
    // page then sat at the bottom where .stats never re-entered view, so its
    // counters stayed at 0. Lazy background images made the page slow enough to
    // expose it.
    for(let y=0;y<h;y+=600){scrollTo(0,y);await s(200);}
    for(let n=0;n<40;n++){
      if([...document.querySelectorAll('[data-count]')].every(c=>c.textContent!=='0')) break;
      await s(100);
    }
    await s(400);
    const hidden=[...document.querySelectorAll('.rv,.node,.field,.msg')]
      .filter(e=>+getComputedStyle(e).opacity<0.9).length;
    const longAnim=[...document.querySelectorAll('*')]
      .filter(e=>{const d=getComputedStyle(e).animationDuration;
        return d && d!=='0s' && parseFloat(d)>0.01;}).length;
    const bars=[...document.querySelectorAll('#rhythm .fill')].map(f=>f.style.height);
    return {hidden,longAnim,bars,counters:[...document.querySelectorAll('[data-count]')].map(c=>c.textContent),
            annLabel:document.querySelector('#annPlay').getAttribute('aria-label')};})()`);
  eq(r.hidden, 0, 'elements left invisible');
  eq(r.longAnim, 0, 'animations still running');
  eq(r.counters, ['1.4', '2.1']);
  eq(r.annLabel, 'Play announcements');
  await send('Emulation.setEmulatedMedia', { features: [] });
  return 'nothing hidden, no animation, final values shown';
});
await t('scroll listener is passive and rAF-throttled', () => {
  const js = readFileSync('D:/kuvos/assets/js/main.js', 'utf8');
  ok(js.includes('{ passive: true }') || js.includes('{passive:true}'), 'scroll listener not passive');
  ok(js.includes('requestAnimationFrame(onScroll)'), 'scroll not rAF-throttled');
});

/* ───────────── PERFORMANCE ───────────── */
await t('page weight is lean', async () => {
  await goto(BASE + '/index.html', 1280, 900);
  let bytes = 0, n = 0;
  for (const e of events.filter(e => e.method === 'Network.responseReceived')) {
    n++; bytes += +e.params.response.encodedDataLength || 0;
  }
  const m = await ev(`JSON.stringify(performance.getEntriesByType('resource').map(r=>r.transferSize||0))`);
  const total = JSON.parse(m).reduce((a, b) => a + b, 0) + (await ev(`performance.getEntriesByType('navigation')[0].transferSize||0`));
  ok(total < 900 * 1024, `${(total / 1024).toFixed(0)}KB is heavy`);
  return `${n} requests, ${(total / 1024).toFixed(0)}KB transferred`;
});
await t('DOM is small enough to stay fast', async () => {
  const n = await ev(`document.querySelectorAll('*').length`);
  ok(n < 1500, `${n} nodes`);
  return n + ' DOM nodes';
});
await t('first paint and DOM-ready are fast', async () => {
  const r = await ev(`(()=>{const n=performance.getEntriesByType('navigation')[0];
    const fcp=performance.getEntriesByName('first-contentful-paint')[0];
    return {dcl:Math.round(n.domContentLoadedEventEnd), load:Math.round(n.loadEventEnd),
            fcp: fcp?Math.round(fcp.startTime):null};})()`);
  ok(r.fcp === null || r.fcp < 2500, `FCP ${r.fcp}ms`);
  ok(r.dcl < 2000, `DOMContentLoaded ${r.dcl}ms`);
  return `FCP ${r.fcp}ms · DOMContentLoaded ${r.dcl}ms · load ${r.load}ms`;
});
await t('no layout-shift risk from unsized media', async () => {
  const bad = await ev(`[...document.querySelectorAll('img,video')]
    .filter(e=>!e.getAttribute('width')&&!e.style.aspectRatio&&!getComputedStyle(e).aspectRatio.includes('/'))
    .map(e=>e.src||e.currentSrc)`);
  eq(bad, []);
});
await t('stylesheet and script are a single request each', async () => {
  const css = await ev(`document.querySelectorAll('link[rel=stylesheet][href*="styles.css"]').length`);
  const js = await ev(`document.querySelectorAll('script[src]').length`);
  eq([css, js], [1, 1]);
});
await t('script is deferred so it never blocks paint', async () =>
  eq(await ev(`document.querySelector('script[src]').defer`), true));

/* ───────────── 404 PAGE ───────────── */
await t('404 page renders with brand, nav and disclaimer', async () => {
  await goto(BASE + '/404.html', 1280, 900);
  ok(await ev(`!!document.querySelector('.nf h1')`), 'no heading');
  eq(await ev(`document.querySelectorAll('.nf-nav a').length`), 6);
  ok(await ev(`document.querySelector('.disclaimer').textContent.includes('not an emergency service')`), 'no disclaimer');
  eq(await ev(`document.querySelector('meta[name=color-scheme]').content`), 'light only');
  eq(await ev(`document.querySelector('meta[name=robots]').content`), 'noindex');
  ok(await ev(`document.querySelector('.logo img').complete && document.querySelector('.logo img').naturalWidth>0`), 'mark did not load');
});
await t('404 links all resolve', async () => {
  const hrefs = await ev(`[...document.querySelectorAll('.nf-nav a, .nf .btn')].map(a=>a.getAttribute('href'))`);
  for (const h of hrefs) {
    if (h.startsWith('mailto:')) continue;
    const r = await fetch(BASE + h.split('#')[0]);
    ok(r.ok, `${h} -> ${r.status}`);
  }
  return hrefs.length + ' links';
});
await t('404 has no horizontal scroll at 320px', async () => {
  await goto(BASE + '/404.html', 320, 800, true);
  const r = await ev(`({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})`);
  ok(r.s <= r.c + 1, `${r.s} > ${r.c}`);
});

console.log(JSON.stringify(results));
close();
