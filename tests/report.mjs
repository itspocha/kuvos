import { readFileSync } from 'node:fs';
const raw = readFileSync(process.argv[2], 'utf8').trim();
const line = raw.split('\n').filter(l => l.startsWith('[')).pop();
const r = JSON.parse(line);
let p = 0, f = 0;
for (const x of r) {
  if (x.ok) { p++; console.log('  PASS  ' + x.name + (x.detail ? '  \u2014 ' + x.detail : '')); }
  else { f++; console.log('  FAIL  ' + x.name + '  \u2014 ' + x.detail); }
}
console.log('\n  ' + p + ' passed, ' + f + ' failed, ' + r.length + ' total');
process.exit(f ? 1 : 0);
