import { connect, runner } from './cdp.mjs';
const BASE = 'http://127.0.0.1:' + (process.env.SERVE_PORT || 8765);
const { send, ev, key, goto, events, close } = await connect();
const { t, eq, ok, results } = runner();
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ───────────── A. ACCESSIBILITY ───────────── */
await goto(BASE + '/index.html', 1280, 900);

await t('skip link is the first tab stop and becomes visible', async () => {
  await ev(`document.body.focus();document.activeElement.blur()`);
  await key('Tab');
  const cls = await ev(`document.activeElement.className`);
  eq(cls, 'skip');
  await sleep(500);
  const ty = await ev(`new DOMMatrix(getComputedStyle(document.querySelector('.skip')).transform).m42`);
  ok(ty > -10, 'skip link did not slide into view, translateY=' + ty);
  return 'visible at translateY ' + ty.toFixed(1);
});
await t('skip link target exists and is focusable', async () => {
  const href = await ev(`document.querySelector('.skip').getAttribute('href')`);
  ok(await ev(`!!document.querySelector('${href}')`), 'target missing');
  eq(await ev(`document.querySelector('${href}').tabIndex`), -1);
  return href;
});
await t('every image has an alt attribute', async () => {
  const bad = await ev(`[...document.querySelectorAll('img')].filter(i=>i.getAttribute('alt')===null).map(i=>i.src)`);
  eq(bad, []);
  return (await ev(`document.querySelectorAll('img').length`)) + ' images';
});
await t('decorative SVGs are hidden from AT', async () => {
  const bad = await ev(`[...document.querySelectorAll('svg')]
    .filter(s=>!s.hasAttribute('aria-hidden')&&!s.getAttribute('role')&&!s.querySelector('title'))
    .map(s=>s.outerHTML.slice(0,50))`);
  eq(bad, []);
});
await t('all interactive controls are real buttons or links', async () => {
  const bad = await ev(`[...document.querySelectorAll('[onclick],[role=button]')]
    .filter(e=>!['BUTTON','A'].includes(e.tagName)).map(e=>e.tagName)`);
  eq(bad, []);
});
await t('touch targets >= 42px (bible section 7)', async () => {
  const small = await ev(`[...document.querySelectorAll('a,button')].filter(e=>{
      const r=e.getBoundingClientRect();
      if(!r.width||!r.height) return false;
      if(e.closest('.ftr,.drawer,.skip,nav.nav')) return false;
      return r.height < 42;
    }).map(e=>e.textContent.trim().slice(0,22)+' h='+Math.round(e.getBoundingClientRect().height))`);
  eq(small, []);
});
await t('keyboard focus paints a visible ring', async () => {
  await ev(`document.activeElement.blur()`);
  await key('Tab'); await key('Tab'); await key('Tab');
  const r = await ev(`(()=>{const s=getComputedStyle(document.activeElement);
    return {el:document.activeElement.className||document.activeElement.tagName,
            w:s.outlineWidth, c:s.outlineColor, st:s.outlineStyle};})()`);
  ok(parseFloat(r.w) >= 2, 'outline width ' + r.w + ' on ' + r.el);
  ok(r.st !== 'none', 'outline style ' + r.st);
  return r.el + ': ' + r.w + ' ' + r.st + ' ' + r.c;
});
await t('tablist has correct ARIA wiring', async () => {
  eq(await ev(`document.querySelector('#buyerTabs').getAttribute('role')`), 'tablist');
  eq(await ev(`document.querySelector('#buyerPanel').getAttribute('role')`), 'tabpanel');
  eq(await ev(`[...document.querySelectorAll('.tab')].every(t=>t.getAttribute('role')==='tab')`), true);
  eq(await ev(`[...document.querySelectorAll('.tab')].filter(t=>t.getAttribute('aria-selected')==='true').length`), 1);
  eq(await ev(`[...document.querySelectorAll('.tab')].filter(t=>t.tabIndex===0).length`), 1);
  ok(await ev(`!!document.querySelector('#buyerPanel').getAttribute('aria-labelledby')`), 'panel not labelled');
});
await t('FAQ buttons expose aria-expanded and aria-controls', async () => {
  eq(await ev(`[...document.querySelectorAll('.q-btn')].every(b=>b.getAttribute('aria-expanded')==='false')`), true);
  eq(await ev(`[...document.querySelectorAll('.q-btn')].every(b=>!!document.getElementById(b.getAttribute('aria-controls')))`), true);
});
await t('drawer is inert and invisible while closed', async () => {
  eq(await ev(`document.querySelector('#drawer').hasAttribute('inert')`), true);
  eq(await ev(`getComputedStyle(document.querySelector('#drawer')).visibility`), 'hidden');
  eq(await ev(`document.querySelector('#drawer').getAttribute('aria-hidden')`), 'true');
});
await t('no positive tabindex anywhere', async () => {
  const bad = await ev(`[...document.querySelectorAll('[tabindex]')].filter(e=>+e.getAttribute('tabindex')>0).length`);
  eq(bad, 0);
});
await t('tables use scoped header cells', async () => {
  eq(await ev(`[...document.querySelectorAll('th')].every(h=>h.getAttribute('scope')==='col')`), true);
  return (await ev(`document.querySelectorAll('th').length`)) + ' header cells';
});

/* ───────────── B. INTERACTION ───────────── */
await t('all 6 buyer tabs switch the panel', async () => {
  const seen = [];
  for (let i = 0; i < 6; i++) {
    await ev(`document.querySelectorAll('.tab')[${i}].click()`);
    await sleep(140);
    seen.push(await ev(`document.querySelector('#buyerPanel h3').textContent.slice(0,26)`));
    eq(await ev(`document.querySelectorAll('.tab')[${i}].getAttribute('aria-selected')`), 'true');
    eq(await ev(`document.querySelector('#buyerPanel').getAttribute('aria-labelledby')`), 'btab' + i);
  }
  eq(new Set(seen).size, 6, 'panels not unique');
  return seen.length + ' unique panels';
});
await t('tab arrow keys wrap in both directions', async () => {
  await ev(`document.querySelector('#btab0').focus()`);
  await key('ArrowLeft');
  eq(await ev(`document.activeElement.id`), 'btab5', 'ArrowLeft from first should wrap to last');
  await key('ArrowRight');
  eq(await ev(`document.activeElement.id`), 'btab0', 'ArrowRight from last should wrap to first');
  await key('End');
  eq(await ev(`document.activeElement.id`), 'btab5', 'End');
  await key('Home');
  eq(await ev(`document.activeElement.id`), 'btab0', 'Home');
});
await t('all 6 FAQ items open and close', async () => {
  // The panel opens on a 0.55s grid-template-rows transition. A fixed sleep raced
  // it under load and made this test flaky, so poll for the state instead.
  const until = async (expr, what, tries = 40) => {
    for (let n = 0; n < tries; n++) {
      if (await ev(expr)) return true;
      await sleep(50);
    }
    throw new Error('timed out waiting for ' + what);
  };
  for (let i = 0; i < 6; i++) {
    await ev(`document.querySelectorAll('.q-btn')[${i}].click()`);
    await until(`document.querySelectorAll('.q-btn')[${i}].getAttribute('aria-expanded')==='true'`, 'open ' + i);
    await until(`document.querySelectorAll('.q')[${i}].querySelector('.q-body>div').getBoundingClientRect().height > 0`,
                'height on ' + i);
    await ev(`document.querySelectorAll('.q-btn')[${i}].click()`);
    await until(`document.querySelectorAll('.q-btn')[${i}].getAttribute('aria-expanded')==='false'`, 'close ' + i);
  }
  return '6 items toggled';
});
await t('FAQ answers are non-empty', async () => {
  const empty = await ev(`[...document.querySelectorAll('.q-body p')].filter(p=>p.textContent.trim().length<40).length`);
  eq(empty, 0);
});
await t('drawer: opens, traps focus, Escape closes and restores focus', async () => {
  await goto(BASE + '/index.html', 390, 800, true);
  await ev(`document.querySelector('#burger').click()`);
  await sleep(700);
  eq(await ev(`document.querySelector('#burger').getAttribute('aria-expanded')`), 'true');
  eq(await ev(`document.querySelector('#drawer').hasAttribute('inert')`), false);
  ok(await ev(`document.querySelector('#drawer').contains(document.activeElement)`), 'focus not inside drawer');
  // tab forward past the last control and confirm it wraps back inside
  for (let i = 0; i < 12; i++) await key('Tab');
  ok(await ev(`document.querySelector('#drawer').contains(document.activeElement)`), 'focus escaped the drawer');
  await key('Escape');
  await sleep(400);
  eq(await ev(`document.activeElement.className`), 'burger', 'focus not restored');
  eq(await ev(`document.querySelector('#drawer').hasAttribute('inert')`), true);
  eq(await ev(`document.body.classList.contains('lock')`), false, 'body scroll still locked');
});
await t('drawer closes on scrim click and on nav-link click', async () => {
  await ev(`document.querySelector('#burger').click()`); await sleep(600);
  await ev(`document.querySelector('#scrim').click()`); await sleep(500);
  eq(await ev(`document.querySelector('#drawer').classList.contains('on')`), false, 'scrim');
  await ev(`document.querySelector('#burger').click()`); await sleep(600);
  await ev(`document.querySelector('#drawer .drawer nav a, #drawer nav a').click()`); await sleep(500);
  eq(await ev(`document.querySelector('#drawer').classList.contains('on')`), false, 'nav link');
});
await t('header gains .stuck and progress bar tracks scroll', async () => {
  await goto(BASE + '/index.html', 1280, 900);
  eq(await ev(`document.querySelector('#hdr').classList.contains('stuck')`), false);
  await ev(`scrollTo(0,1200)`); await sleep(300);
  eq(await ev(`document.querySelector('#hdr').classList.contains('stuck')`), true);
  const w1 = await ev(`parseFloat(document.querySelector('#scrollbar').style.width)`);
  await ev(`scrollTo(0,document.documentElement.scrollHeight)`); await sleep(400);
  const w2 = await ev(`parseFloat(document.querySelector('#scrollbar').style.width)`);
  ok(w2 > w1 && w2 > 95, `progress ${w1}% -> ${w2}%`);
  return `${w1.toFixed(0)}% -> ${w2.toFixed(0)}%`;
});
await t('active nav link tracks the visible section', async () => {
  // the tracker runs off a rAF-throttled scroll handler; poll rather than guess
  await ev(`document.querySelector('#safety').scrollIntoView()`);
  for (let n = 0; n < 40; n++) {
    if (await ev(`document.querySelector('#nav a.on')?.getAttribute('href')==='#safety'`)) return;
    await sleep(50);
  }
  eq(await ev(`document.querySelector('#nav a.on')?.getAttribute('href')`), '#safety');
});

console.log(JSON.stringify(results));
close();
