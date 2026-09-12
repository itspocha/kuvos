#!/usr/bin/env node
/**
 * Applies deployment-specific values to the static files.
 *
 *   node tools/configure.mjs --check
 *   node tools/configure.mjs --origin https://kuvos.ai --email hello@kuvos.ai
 *   KUVOS_ORIGIN=https://kuvos.ai KUVOS_EMAIL=hi@kuvos.ai node tools/configure.mjs
 *
 * Values come from CLI flags, then environment, then site.config.json. Whatever is
 * applied is written back to site.config.json, so the script is idempotent and the
 * committed files are always valid, working HTML — open index.html directly and it
 * still runs. This is not a build step; it is an optional rewrite for deploys.
 *
 * Node built-ins only. No dependencies.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = join(ROOT, 'site.config.json');

/* files that carry the origin or the contact address */
const TEXT_FILES = ['index.html', '404.html', 'robots.txt', 'sitemap.xml'];
/* root-absolute references that must move when the site is served from a subpath */
const ABS_REFS = ['/assets/', '/favicon.ico', '/site.webmanifest'];

const argv = process.argv.slice(2);
const flag = n => {
  const i = argv.indexOf('--' + n);
  // an empty value is meaningful for --base-path, so test for undefined, not truthiness
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined;
};
const has = n => argv.includes('--' + n);

const current = JSON.parse(readFileSync(CONFIG, 'utf8'));

/* An unset OR empty value always means "keep what is configured". CI passes every
   variable whether or not it is defined, so empty must not be read as a real value.
   To deliberately move the site to the root, pass the word `root` as the base path. */
const pick = (f, envName, fallback) =>
  flag(f) || process.env[envName] || fallback;

const next = {
  origin: pick('origin', 'KUVOS_ORIGIN', current.origin).replace(/\/+$/, ''),
  email: pick('email', 'KUVOS_EMAIL', current.email),
  basePath: normaliseBase(pick('base-path', 'KUVOS_BASE_PATH', current.basePath)),
};

function normaliseBase(b) {
  // "root" is the portable way to say "served from /" — a bare "/" gets mangled by
  // Git Bash before Node sees it, and an empty argv value is awkward to pass on Windows.
  if (!b || b === '/' || b === 'root') return '';
  // Git Bash / MSYS rewrites a leading "/kuvos" into "C:/Program Files/Git/kuvos"
  // before Node ever sees it. Catch that rather than writing it into the manifest.
  if (/^[A-Za-z]:|Program Files|^\\\\/.test(b))
    throw new Error(
      'base path looks like a Windows path: ' + b +
      '\n  On Git Bash, prefix the command with MSYS_NO_PATHCONV=1,' +
      '\n  or pass it without the leading slash: --base-path kuvos');
  return ('/' + b.replace(/^\/+|\/+$/g, ''));
}

if (has('check')) {
  console.log('current configuration');
  for (const k of ['origin', 'email', 'basePath'])
    console.log(`  ${k.padEnd(9)} ${current[k] === '' ? '(site root)' : current[k]}`);
  const stale = [];
  for (const f of TEXT_FILES) {
    const s = readFileSync(join(ROOT, f), 'utf8');
    // anything that looks like an origin but is not the configured one
    for (const m of s.matchAll(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi))
      if (!m[0].startsWith(current.origin) &&
          !/fonts\.(googleapis|gstatic)\.com|schema\.org|sitemaps\.org|w3\.org/.test(m[0]))
        stale.push(`${f}: ${m[0]}`);
    for (const m of s.matchAll(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi))
      if (m[0] !== current.email) stale.push(`${f}: ${m[0]}`);
  }
  if (stale.length) { console.error('\nstale references:\n  ' + stale.join('\n  ')); process.exit(1); }
  console.log('\nno stale origins or addresses');
  process.exit(0);
}

let changed = 0;
const report = [];

/* ── origin + email across the text files ───────────────────────────────── */
for (const f of TEXT_FILES) {
  const p = join(ROOT, f);
  let s = readFileSync(p, 'utf8');
  const before = s;
  if (next.origin !== current.origin) s = s.split(current.origin).join(next.origin);
  if (next.email !== current.email) s = s.split(current.email).join(next.email);
  if (next.basePath !== current.basePath) {
    for (const ref of ABS_REFS)
      s = s.split('="' + current.basePath + ref).join('="' + next.basePath + ref);
    // bare root links in the 404 page: href="/" and href="/#section"
    s = s.split('href="' + current.basePath + '/"').join('href="' + (next.basePath || '') + '/"');
    s = s.split('href="' + current.basePath + '/#').join('href="' + (next.basePath || '') + '/#');
  }
  if (s !== before) { writeFileSync(p, s); changed++; report.push('  rewrote ' + f); }
}

/* ── manifest is JSON, so edit it structurally ──────────────────────────── */
if (next.basePath !== current.basePath) {
  const p = join(ROOT, 'site.webmanifest');
  const m = JSON.parse(readFileSync(p, 'utf8'));
  const swap = v => (typeof v === 'string' && v.startsWith(current.basePath + '/'))
    ? next.basePath + v.slice(current.basePath.length) : v;
  m.start_url = swap(m.start_url) || (next.basePath + '/');
  m.scope = swap(m.scope) || (next.basePath + '/');
  m.icons = m.icons.map(i => ({ ...i, src: swap(i.src) }));
  writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
  changed++; report.push('  rewrote site.webmanifest');
}

writeFileSync(CONFIG, JSON.stringify(next, null, 2) + '\n');

console.log('applied configuration');
for (const k of ['origin', 'email', 'basePath']) {
  const was = current[k], now = next[k];
  const show = v => v === '' ? '(site root)' : v;
  console.log(`  ${k.padEnd(9)} ${show(now)}${was !== now ? `   (was ${show(was)})` : ''}`);
}
console.log(changed ? report.join('\n') : '  no files needed changing');
