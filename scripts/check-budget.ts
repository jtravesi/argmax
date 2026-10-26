// Performance budget (SPEC.md §7): the JavaScript that /app loads up front must stay
// under 150 KB gzip. Run after `npm run build`.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 150 * 1024;
const html = readFileSync('build/app.html', 'utf8');
const files = [...new Set(html.match(/_app\/immutable\/[^"']+\.js/g) ?? [])];
if (files.length === 0) throw new Error('No scripts found in build/app.html; did the build run?');

let total = 0;
for (const file of files) total += gzipSync(readFileSync(`build/${file}`)).length;

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
console.log(`/app initial JS: ${kb(total)} gzip in ${files.length} files (budget ${kb(BUDGET)})`);
if (total > BUDGET) {
	console.error('Over budget.');
	process.exit(1);
}
