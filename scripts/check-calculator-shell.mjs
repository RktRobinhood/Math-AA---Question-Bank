/* A new lesson must keep the site navigation and one appearance preference.
 * Timing, viewport fit, and keyboard flows still need browser tests. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../calculator-skills/', import.meta.url));
const tools = new Set(['handheld', 'scratchpad']);
const pages = [
  'index.html', 'skills.html', 'lesson.html',
  ...readdirSync(root, { withFileTypes: true })
    .filter(item => item.isDirectory() && !tools.has(item.name) && existsSync(join(root, item.name, 'index.html')))
    .map(item => join(item.name, 'index.html')),
];
for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  assert.match(html, /<body\b[^>]*data-nav=["']calculator-skills["']/i, page + ' should mark the native Skills tab active');
  assert.equal((html.match(/<script\b[^>]*src=["'][^"']*\/assets\/js\/shell\.js(?:\?[^"']*)?["']/gi) || []).length, 1, page + ' needs exactly one Question Bank shell');
  assert.match(html, /<script\b[^>]*src=["'][^"']*\/assets\/js\/calculator-nav\.js(?:\?[^"']*)?["']/i, page + ' should use the bank’s calculator navigation');
  assert.doesNotMatch(html, /\bid=["'](?:theme|theme-toggle)["']/, page + ' must not have an independent theme picker');
}
const scratchpad = readFileSync(join(root, 'scratchpad', 'index.html'), 'utf8');
const bankShell = readFileSync(join(root, 'scratchpad', 'bank-shell.js'), 'utf8');
assert.match(scratchpad, /src="bank-shell\.js(?:\?[^"]*)?"/);
assert.match(bankShell, /if \(window\.parent !== window\) return;/, 'practice frames must skip the outer site shell');
console.log(`Calculator Skills: ${pages.length} pages use the native header; standalone only for Scratchpad.`);
