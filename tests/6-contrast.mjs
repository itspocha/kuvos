import { connect, runner } from './cdp.mjs';
const BASE = 'http://127.0.0.1:' + (process.env.SERVE_PORT || 8765);
const { send, ev, close } = await connect();
const { t, eq, ok, results } = runner();
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Measured contrast of real text against the real composited background.
 *
 * Token-level contrast maths is not enough once photography sits behind the type:
 * the background is a photograph under a gradient scrim under a blend-mode glow,
 * and only the rendered pixels tell you what the reader actually sees. This
 * screenshots the background with all text hidden, then scores each element
 * against the background pixel closest to it in luminance — the worst case, which
 * is what WCAG asks about on a non-uniform ground.
 *
 * It has already caught three real defects: flow-node copy at 4.2:1 over the
 * controls photograph, a signal-blue hero eyebrow at 3.7:1 on navy, and body copy
 * at 2.98:1 on mobile where the directional scrim did not reach.
 */

const SEL = '.hero h1, .hero-sub, .hero .eyebrow, .trustline,' +
  '#gap h2, #gap .lede, #gap .refline, #gap .gapc b, #gap .gapc p, #gap .gapc span,' +
  '#controls h2, #controls .lede, #controls .warn, #controls .guardrails b, #controls .guardrails li,' +
  '#evidence h2, #evidence .lede, #evidence .sub-h, #evidence .proof-row b, #evidence .proof-row span,' +
  '#safety h2, #safety .pr b, #safety .pr p, #safety .refline,' +
  '.final h2, .final p, .final .closing, .final .eyebrow';

// scoring runs inside the page: the screenshot goes back in as a data URL and is
// decoded on a canvas, so the suite needs no image library in Node
const SCORE = `(async (b64, colorCss, fontPx, weight) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, c.width, c.height).data;
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const fg = (colorCss.match(/[\\d.]+/g) || [255,255,255]).slice(0,3).map(Number);
  const fl = lum(fg[0], fg[1], fg[2]);
  let worst = null, bestDelta = Infinity;
  const step = Math.max(4, Math.floor(d.length / 4 / 6000) * 4);
  for (let i = 0; i < d.length; i += step) {
    const l = lum(d[i], d[i+1], d[i+2]);
    const delta = Math.abs(l - fl);
    if (delta < bestDelta) { bestDelta = delta; worst = [d[i], d[i+1], d[i+2], l]; }
  }
  if (!worst) return null;
  const hi = Math.max(fl, worst[3]), lo = Math.min(fl, worst[3]);
  const ratio = (hi + 0.05) / (lo + 0.05);
  const large = fontPx >= 24 || (fontPx >= 18.66 && +weight >= 700);
  return { ratio: +ratio.toFixed(2), required: large ? 3 : 4.5,
           bg: '#' + worst.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('') };
})`;

async function audit(W, H) {
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 });
  await send('Page.navigate', { url: BASE + '/index.html' });
  await sleep(2400);
  await ev(`(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));
    const h=document.documentElement.scrollHeight;
    for(let y=0;y<h;y+=700){scrollTo(0,y);await s(100);} await s(1100); scrollTo(0,0);})()`);
  await sleep(700);

  const meta = await ev(`(()=>[...document.querySelectorAll(${JSON.stringify(SEL)})].map((e,i)=>{
    e.setAttribute('data-ct', i);
    const r=e.getBoundingClientRect(), s=getComputedStyle(e);
    return {i, sel:e.tagName.toLowerCase()+'.'+((e.className||'')+'').split(' ')[0],
            section:(e.closest('section[id]')||{}).id||'hero',
            color:s.color, size:parseFloat(s.fontSize), weight:s.fontWeight,
            docY:r.top+scrollY, w:Math.round(r.width), h:Math.round(r.height)};
  }).filter(t=>t.w>4&&t.h>4))()`);

  // hide every glyph so the capture is pure background; .eyebrow::after is a
  // decorative rule inside the element box, not background, so drop it too
  await ev(`(()=>{const s=document.createElement('style'); s.id='ct-hide';
    s.textContent='*{color:transparent !important;text-shadow:none !important}'+
      'svg,img{visibility:hidden !important}.eyebrow::after{display:none !important}';
    document.head.appendChild(s);})()`);
  await sleep(400);

  const fails = [];
  let checked = 0;
  for (const m of meta) {
    await ev(`scrollTo(0, ${Math.max(0, Math.round(m.docY - H / 2))})`);
    await sleep(190);
    const box = await ev(`(()=>{const e=document.querySelector('[data-ct="${m.i}"]');
      const r=e.getBoundingClientRect();
      return {vy:Math.round(r.top), x:Math.round(r.left+scrollX), y:Math.round(r.top+scrollY),
              w:Math.round(r.width), h:Math.round(r.height)};})()`);
    if (box.vy < 0 || box.vy + box.h > H || box.w < 4 || box.h < 4) continue;
    // NOTE: clip is in PAGE coordinates, not viewport coordinates
    const shot = await send('Page.captureScreenshot', {
      format: 'png', clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 },
    });
    const r = await ev(`${SCORE}(${JSON.stringify(shot.result.data)},` +
      `${JSON.stringify(m.color)},${m.size},${JSON.stringify(m.weight)})`);
    if (!r) continue;
    checked++;
    if (r.ratio < r.required)
      fails.push(`${m.section}/${m.sel} ${r.ratio}:1 < ${r.required} over ${r.bg}`);
  }
  return { checked, fails };
}

for (const [W, H] of [[390, 800], [768, 900], [1280, 900], [1440, 900]]) {
  await t(`text over photography holds AA at ${W}px`, async () => {
    const { checked, fails } = await audit(W, H);
    ok(checked >= 40, `only sampled ${checked} elements`);
    eq(fails, []);
    return `${checked} elements, all AA`;
  });
}

console.log(JSON.stringify(results));
close();
