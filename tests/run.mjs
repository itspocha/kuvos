/**
 * Kuvos site test runner.
 *
 *   node tests/run.mjs
 *
 * Starts a static server, launches headless Chrome, runs every suite, prints a
 * report, exits non-zero if anything failed. No npm dependencies — Node built-ins
 * and the Chrome you already have installed.
 *
 * Ports and the Chrome profile are per-run, so two runs at once do not collide.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));

const CHROME_CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find(p => existsSync(p));
if (!chrome) {
  console.error('No Chrome/Edge found. Set CHROME=/path/to/chrome and retry.');
  process.exit(2);
}

const freePort = () => new Promise((res, rej) => {
  const s = createServer();
  s.once('error', rej);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
});

const SERVE_PORT = String(await freePort());
const CDP_PORT = String(await freePort());
const PROFILE = mkdtempSync(join(tmpdir(), 'kuvos-chrome-'));
const ENV = { ...process.env, SERVE_PORT, CDP_PORT };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const kids = [];
let cleanedUp = false;
const cleanup = () => {
  if (cleanedUp) return;
  cleanedUp = true;
  kids.forEach(k => { try { k.kill(); } catch {} });
  try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
};
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

console.log(`serving on :${SERVE_PORT}  ·  devtools on :${CDP_PORT}`);
kids.push(spawn(process.execPath, [join(HERE, 'serve.mjs')], { stdio: 'ignore', env: ENV }));

console.log('launching ' + chrome.split(/[/\\]/).pop());
kids.push(spawn(chrome, [
  '--headless=new', '--remote-debugging-port=' + CDP_PORT,
  '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check',
  // GPU rasterisation matters: without it the blurred hero glows are rasterised
  // on the CPU and the frame-rate suite reports jank real browsers never see.
  '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
  'about:blank',
], { stdio: 'ignore', env: ENV }));

let up = false;
for (let i = 0; i < 50; i++) {
  try { await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); up = true; break; }
  catch { await sleep(400); }
}
if (!up) { console.error('Chrome did not expose the devtools port in time.'); cleanup(); process.exit(2); }
await sleep(700);

const SUITES = ['1-endpoints.mjs', '2-accessibility.mjs', '3-responsive-motion.mjs'];
let pass = 0, fail = 0;

console.log('\n\u2500\u2500 configuration ' + '\u2500'.repeat(38));
{
  const c = spawnSync(process.execPath, [join(HERE, '..', 'tools', 'configure.mjs'), '--check'],
    { encoding: 'utf8', env: ENV });
  const clean = c.status === 0;
  if (clean) pass++; else fail++;
  console.log('  ' + (clean ? '\u2713' : '\u2717') + ' origin and contact address consistent across all files');
  console.log((c.stdout || '').trimEnd().split('\n').map(l => '    ' + l).join('\n'));
  if (!clean) console.log((c.stderr || '').trimEnd().split('\n').map(l => '    ' + l).join('\n'));
}

for (const s of SUITES) {
  console.log('\n\u2500\u2500 ' + s.replace(/^\d-|\.mjs$/g, '') + ' ' + '\u2500'.repeat(40));
  const r = spawnSync(process.execPath, [join(HERE, s)],
    { encoding: 'utf8', maxBuffer: 1 << 26, env: ENV });
  const line = (r.stdout || '').trim().split('\n').filter(l => l.startsWith('[')).pop();
  if (!line) {
    console.log('  SUITE CRASHED');
    console.log(((r.stderr || '') + (r.stdout || '')).split('\n').slice(0, 10)
      .map(l => '    ' + l).join('\n'));
    fail++; continue;
  }
  for (const x of JSON.parse(line)) {
    if (x.ok) { pass++; console.log('  \u2713 ' + x.name + (x.detail ? '  \u2014 ' + x.detail : '')); }
    else { fail++; console.log('  \u2717 ' + x.name + '  \u2014 ' + x.detail); }
  }
}

console.log('\n\u2500\u2500 frame rate ' + '\u2500'.repeat(40));
const j = spawnSync(process.execPath, [join(HERE, '4-framerate.mjs')], { encoding: 'utf8', env: ENV });
console.log(((j.stdout || '') || (j.stderr || '')).split('\n').map(l => '  ' + l).join('\n').trimEnd());

console.log('\n' + '='.repeat(54));
console.log(`  ${pass} passed, ${fail} failed, ${pass + fail} total`);
console.log('='.repeat(54));
cleanup();
process.exit(fail ? 1 : 0);
