#!/usr/bin/env node
/**
 * Copies the publishable files into dist/.
 *
 *   node tools/build.mjs
 *
 * This is not a compile step — nothing is transformed. It exists so that docs,
 * tests, tooling and brand source artwork do not get published. The site in the
 * repo root is already the site; dist/ is the same files with the private ones left out.
 *
 * Node built-ins only. No dependencies.
 */
import { readFileSync, writeFileSync, cpSync, rmSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const PUBLISH = ['index.html', '404.html', 'favicon.ico', 'site.webmanifest', 'robots.txt', 'sitemap.xml', 'assets'];
const EXCLUDE = [join('assets', 'brand', 'source'), 'README.md'];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const entry of PUBLISH) {
  const from = join(ROOT, entry);
  if (!existsSync(from)) { console.error('missing: ' + entry); process.exit(1); }
  cpSync(from, join(DIST, entry), {
    recursive: true,
    filter: src => {
      const rel = relative(ROOT, src);
      return !EXCLUDE.some(x => rel === x || rel.startsWith(x + '\\') || rel.startsWith(x + '/') || rel.endsWith('\\' + x) || rel.endsWith('/' + x));
    },
  });
}

/* A custom domain needs a CNAME file at the publish root, or GitHub Pages
   resets the domain on every deploy. */
const cname = process.env.KUVOS_CNAME || JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8')).cname;
if (cname) {
  writeFileSync(join(DIST, 'CNAME'), cname.trim() + '\n');
  console.log('CNAME -> ' + cname.trim());
}

/* Pages serves _-prefixed paths oddly under Jekyll; disable it. */
writeFileSync(join(DIST, '.nojekyll'), '');

let files = 0, bytes = 0;
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e), s = statSync(p);
    if (s.isDirectory()) walk(p); else { files++; bytes += s.size; }
  }
})(DIST);

console.log(`dist/  ${files} files, ${(bytes / 1024).toFixed(0)}KB`);
