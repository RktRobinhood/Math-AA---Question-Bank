/* Every standalone learner page needs one native bank shell.
 * Deep links, runtime theme, viewport fit and the iframe still need browser tests. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../', import.meta.url));
const siteURL = new URL('https://bank.invalid/project/');
const read = rel => readFileSync(join(site, rel), 'utf8');
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find(value => value !== undefined);
const values = (html, tag, name) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map(m => attr(m[0], name)).filter(Boolean);
const versionedShell = '?v=nav-4';
const docExamples = 'docs/redesign-proposal/mockups/';
const scratchpadPage = 'calculator-skills/scratchpad/index.html';
const mainRoutes = new Set(['', 'statistics/', 'syllabus/', 'practice.html', 'calculator-skills/skills.html']
  .map(path => new URL(path, siteURL).href));
const sectionIds = new Set(['questions', 'statistics', 'syllabus', 'practice', 'calculator-skills']);
const appPages = new Map([
  ['index.html', 'questions'], ['question-bank/index.html', 'questions'], ['statistics/index.html', 'statistics'],
  ['syllabus/index.html', 'syllabus'], ['practice.html', 'practice'],
  ...readdirSync(join(site, 'syllabus'), { withFileTypes: true })
    .filter(item => item.isDirectory() && /^topic-\d+$/.test(item.name))
    .map(item => [`syllabus/${item.name}/index.html`, 'syllabus']),
]);

// GitHub Pages serves the branch root using .nojekyll. Do not forget a new root or nested
// HTML route just because it wasn't added to an app or Calculator Skills allow-list.
function *htmlFiles(dir = '') {
  for (const entry of readdirSync(join(site, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const page = posix.join(dir, entry.name);
    if (entry.isDirectory()) yield *htmlFiles(page);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) yield page;
  }
}
function noLegacyOrInlineHeader(html, page, base = new URL(page, siteURL)) {
  assert.doesNotMatch(html, /<script\b[^>]*src=["'][^"']*\/calculator-nav\.js(?:\?[^"']*)?["']/i,
    page + ' must not inject legacy navigation');
  assert.doesNotMatch(html, /Calculator Lab|<(?:header|nav)\b[^>]*class=["'](?:[^"']*\s)?(?:top|tabbar)(?=\s|["'])/i,
    page + ' must not hardcode skill or site navigation');
  assert.doesNotMatch(html, /\bid=["'](?:theme|theme-toggle)["']/i,
    page + ' must not have an independent theme picker');
  assert.doesNotMatch(html, /\bclass=["'][^"']*\bnav-beta\b/i, page + ' Beta is defined by the shared nav, not route markup');
  // Small breadcrumbs and lesson navigation are content. A copy of the app's
  // primary links is not, even if somebody renames its CSS. Permit no-script fallbacks.
  const liveMarkup = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
  for (const match of liveMarkup.matchAll(/<(nav|header)\b[^>]*>[\s\S]*?<\/\1\s*>/gi)) {
    const mainLinks = new Set(values(match[0], 'a', 'href')
      .map(href => new URL(href, base)).map(url => url.origin + url.pathname)
      .filter(url => mainRoutes.has(url)));
    assert.ok(mainLinks.size < 3, page + ' must not define a second main navigation');
  }

}
function sharedFrame(html, page, expected, cacheVersionRequired) {
  const pageURL = new URL(page, siteURL);
  const hrefBase = values(html, 'base', 'href');
  assert.ok(hrefBase.length <= 1, page + ' must not have competing URL bases');
  const base = new URL(hrefBase[0] || pageURL, pageURL);
  const refs = (tag, attrName, asset) => values(html, tag, attrName).map(src => new URL(src, base))
    .filter(url => url.pathname.endsWith('/' + asset));
  const exactlyOne = (tag, attrName, asset) => {
    const list = refs(tag, attrName, asset);
    assert.equal(list.length, 1, page + ' needs exactly one copy of ' + asset);
    assert.equal(list[0].origin + list[0].pathname, new URL(asset, siteURL).href,
      page + ' resolves ' + asset + ' to the actual project root');
    return list[0];
  };
  const shell = exactlyOne('script', 'src', 'assets/js/shell.js');
  if (cacheVersionRequired) assert.equal(shell.search, versionedShell, page + ' needs the common shell cache revision');
  exactlyOne('script', 'src', 'assets/js/course.js');
  exactlyOne('script', 'src', 'assets/js/courses.js');
  exactlyOne('link', 'href', 'assets/css/styles.css');
  const body = html.match(/<body\b[^>]*>/i)?.[0] || '';
  const nav = attr(body, 'data-nav');
  assert.ok(sectionIds.has(nav), page + ' should specify which bank tab is active');
  if (expected) assert.equal(nav, expected, page + ' should mark its own tab active');
  assert.equal(new URL(attr(body, 'data-base') || pageURL, base).href, siteURL.href,
    page + ' gives native header links the correct root');
  noLegacyOrInlineHeader(html, page, base);
}

const pages = new Set(htmlFiles());
const count = { app: 0, skills: 0, standaloneScratchpad: 0, questions: 0, examYears: 0, aliases: 0, examples: 0, other: 0 };
for (const page of pages) {
  const html = read(page);
  if (page.startsWith(docExamples)) { count.examples++; continue; }
  if (page === scratchpadPage) {
    const bankShell = read('calculator-skills/scratchpad/bank-shell.js');
    assert.match(html, /src="bank-shell\.js\?v=nav-4"/);
    assert.match(bankShell, /'shell\.js\?v=nav-4'/, 'standalone Scratchpad needs the same shell');
    assert.match(bankShell, /assets\/css\/styles\.css(?:\?[^']*)?'/, 'standalone Scratchpad needs shared bank styling');
    assert.doesNotMatch(bankShell, /calculator-nav\.js/, 'standalone Scratchpad must not inject legacy navigation');
    assert.match(bankShell, /if \(window\.parent !== window\) return;/, 'practice frames must skip the outer site shell');
    assert.doesNotMatch(html, /\/assets\/js\/shell\.js/, 'Scratchpad iframe must not load the outer shell directly');
    noLegacyOrInlineHeader(html, page);
    count.standaloneScratchpad++;
    continue;
  }
  if (page.startsWith('questions/') || page.startsWith('exams/')) {
    assert.doesNotMatch(html, /practice-(?:formulas|calculator)\.js|data-calculator-watch|practice-calc-trigger|practice-formula-trigger/,
      page + ' must not acquire inline Practice tools');
    const refresh = [...html.matchAll(/<meta\b[^>]*>/gi)].map(x => x[0]).find(tag => attr(tag, 'http-equiv')?.toLowerCase() === 'refresh');
    if (refresh) {
      assert.match(page, /^questions\/[a-z0-9-]+\/index\.html$/, page + ' only question aliases redirect');
      const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(x => x[0]).find(tag => attr(tag, 'rel')?.toLowerCase() === 'canonical');
      const target = attr(canonical || '', 'href');
      assert.ok(target && attr(refresh, 'content')?.match(/^\s*0;\s*url=(.+)$/i)?.[1] === target,
        page + ' alias must immediately redirect to its canonical link');
      const match = /^\.\.\/([a-z0-9-]+)\/(?:\?course=(?:aa|ai)-(?:sl|hl))?$/.exec(target);
      const destination = match && `questions/${match[1]}/index.html`;
      assert.ok(destination && destination !== page && pages.has(destination), page + ' must link to a real question');
      const resolved = read(destination);
      assert.doesNotMatch(resolved, /http-equiv\s*=\s*["']refresh["']/i, page + ' must not redirect to another alias');
      sharedFrame(resolved, destination, 'questions', false);
      noLegacyOrInlineHeader(html, page);
      count.aliases++;
      continue;
    }
    sharedFrame(html, page, 'questions', false);
    count[page.startsWith('questions/') ? 'questions' : 'examYears']++;
    continue;
  }
  if (page.startsWith('calculator-skills/')) {
    sharedFrame(html, page, 'calculator-skills', true);
    count.skills++;
    continue;
  }
  if (appPages.has(page)) {
    const active = appPages.get(page);
    sharedFrame(html, page, active, true);
    if (active !== 'practice') {
      assert.match(html, new RegExp(`<body\\b[^>]*data-initial-tab="${active}"`), page + ' uses the generated app context');
    }
    assert.match(html, /<noscript>[\s\S]*?href="[^"]*calculator-skills\/skills\.html"/, page + ' must keep the text-only fallback link');
    count.app++;
    continue;
  }
  sharedFrame(html, page, null, false);
  count.other++;
}

for (const page of [...appPages.keys(), scratchpadPage, 'calculator-skills/handheld/index.html']) {
  assert.ok(existsSync(join(site, page)), page + ' exists at its stable address');
}
const headerSource = read('assets/js/shell.js');
assert.equal((headerSource.match(/const LINKS = \[/g) || []).length, 1, 'one main section definition in the shared shell');
assert.ok(!existsSync(join(site, 'assets/js/calculator-nav.js')), 'do not retain a competing legacy navigation asset');
const baseStyles = read('assets/css/styles.css');
assert.doesNotMatch(headerSource, /fullNavigation|appOnly/, 'no divergent archive navigation profile');
assert.match(baseStyles, /\.tabbar\.with-calc-skills/, 'shared base stylesheet must fit the complete phone header');
assert.ok(count.questions > 0 && count.examYears > 0 && count.aliases > 0, 'all archive route categories are present');
console.log(`Bank navigation: ${count.app} app + ${count.skills} Skills/handheld + ${count.standaloneScratchpad} standalone Scratchpad + ${count.questions} canonical questions + ${count.examYears} exam years + ${count.other} other pages; ${count.aliases} checked redirects and ${count.examples} documentation examples. Embedded Practice Scratchpad is intentionally frameless.`);
