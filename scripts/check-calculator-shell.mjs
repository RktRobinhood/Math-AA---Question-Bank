/* A new lesson must keep the site navigation and one appearance preference.
 * Timing, viewport fit, and keyboard flows still need browser tests. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../calculator-skills/', import.meta.url));
const tools = new Set(['handheld', 'scratchpad']);
const pages = [
  'index.html', 'skills.html', 'lesson.html',
  ...readdirSync(root, { withFileTypes: true })
    .filter(item => item.isDirectory() && !tools.has(item.name) && existsSync(join(root, item.name, 'index.html')))
    .map(item => join(item.name, 'index.html')),
];
const sharedShell = /<script\b[^>]*src=["'][^"']*\/assets\/js\/shell\.js(?:\?[^"']*)?["']/gi;
const legacyNav = /<script\b[^>]*src=["'][^"']*\/assets\/js\/calculator-nav\.js(?:\?[^"']*)?["']/i;
function checkSharedShell(html, page) {
  const includes = html.match(sharedShell) || [];
  assert.equal(includes.length, 1, page + ' needs exactly one Question Bank shell');
  assert.match(includes[0], /shell\.js\?v=nav-4["']$/, page + ' needs the common shell cache revision');
  assert.doesNotMatch(html, legacyNav, page + ' must not also inject legacy navigation');
}
for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  assert.match(html, /<body\b[^>]*data-nav=["']calculator-skills["']/i, page + ' should mark the native Skills tab active');
  checkSharedShell(html, page);
  assert.doesNotMatch(html, /\bid=["'](?:theme|theme-toggle)["']/, page + ' must not have an independent theme picker');
}
const appPages = [
  ['index.html', 'questions'], ['question-bank/index.html', 'questions'], ['statistics/index.html', 'statistics'],
  ['syllabus/index.html', 'syllabus'], ['practice.html', 'practice'],
  ...readdirSync(join(site, 'syllabus')).filter(item => /^topic-\d+$/.test(item))
    .map(item => [join('syllabus', item, 'index.html'), 'syllabus']),
];
for (const [page, active] of appPages) {
  const html = readFileSync(join(site, page), 'utf8');
  checkSharedShell(html, page);
  assert.match(html, new RegExp(`<body\\b[^>]*data-nav="${active}"`), page + ' must mark its own tab active');
  if (active !== 'practice') {
    assert.match(html, new RegExp(`<body\\b[^>]*data-initial-tab="${active}"`), page + ' uses the generated app context');
  }
  assert.match(html, /<noscript>[\s\S]*?href="[^"]*calculator-skills\/skills\.html"/, page + ' must keep the text-only fallback link');
}
const headerSource = readFileSync(join(site, 'assets/js/shell.js'), 'utf8');
const baseStyles = readFileSync(join(site, 'assets/css/styles.css'), 'utf8');
assert.doesNotMatch(headerSource, /fullNavigation|appOnly/, 'no divergent archive navigation profile');
assert.match(baseStyles, /\.tabbar\.with-calc-skills/, 'shared base stylesheet must fit the complete phone header');
for (const group of ['questions', 'exams']) {
  const dirs = readdirSync(join(site, group), {withFileTypes:true}).filter(e => e.isDirectory());
  assert.ok(dirs.length > 0, group + ' archive routes exist');
  for (const entry of dirs) {
    const url = join(site, group, entry.name, 'index.html');
    if (!existsSync(url)) continue;
    const doc = readFileSync(url,'utf8');
    // A shared-paper alias redirects to the canonical question, which is checked below.
    if (group==='questions' && /http-equiv="refresh"/.test(doc)) {
      const redirect = doc.match(/rel="canonical" href="\.\.\/([a-z0-9-]+)\//i);
      assert.ok(redirect && existsSync(join(site, group, redirect[1], 'index.html')),entry.name+' shared alias has a real canonical destination');
      continue;
    }
    assert.equal((doc.match(sharedShell) || []).length,1,entry.name+' uses the same header script');
    assert.match(doc, /href="[^"]*assets\/css\/styles\.css(?:\?[^"]*)?"/,entry.name+' uses the shared stylesheet');
    assert.doesNotMatch(doc, /practice-(?:formulas|calculator)\.js|data-calculator-watch/,entry.name+' must not acquire inline Practice tools');
  }
}
const scratchpad = readFileSync(join(root, 'scratchpad', 'index.html'), 'utf8');
const bankShell = readFileSync(join(root, 'scratchpad', 'bank-shell.js'), 'utf8');
assert.match(scratchpad, /src="bank-shell\.js\?v=nav-4"/);
assert.match(bankShell, /'shell\.js\?v=nav-4'/, 'standalone Scratchpad needs the same shell');
assert.doesNotMatch(bankShell, /calculator-nav\.js/, 'standalone Scratchpad must not inject legacy navigation');
assert.match(bankShell, /if \(window\.parent !== window\) return;/, 'practice frames must skip the outer site shell');
console.log(`Bank navigation: ${appPages.length} app pages and ${pages.length} Calculator Skills pages share one native shell; standalone only for Scratchpad.`);
