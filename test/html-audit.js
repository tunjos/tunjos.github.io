#!/usr/bin/env node
/**
 * test/html-audit.js — Post-build HTML structure assertions
 *
 * Validates the generated _site/ output against structural requirements.
 * Run after `bundle exec jekyll build`:  node test/html-audit.js
 *
 * Assertions:
 *  1. No <link href> or <script src> references external CDN hostnames (Req 1.7)
 *  2. Every <script src> has defer or async (Req 6.4)
 *  3. First focusable element on each page is .skip-link[href="#main-content"] (Req 7.3)
 *  4. Each page contains <nav>, <main>, <footer> (Req 7.7)
 *  5. _site/blog/<slug>/index.html exists for all 9 posts (Req 12.3)
 *  6. _includes/critical-css.html byte length ≤ 14336 (Req 6.3)
 *  7. Footer copyright year equals current year (Req 10.6)
 */

import { parse } from 'node-html-parser';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────
const ROOT         = join(__dirname, '..');
const SITE_DIR     = join(ROOT, '_site');
const CRITICAL_CSS = join(ROOT, '_includes', 'critical-css.html');
const CURRENT_YEAR = new Date().getFullYear().toString();

// Known CDN hostnames to reject in <link href> (stylesheet/preload) and <script src>
const CDN_HOSTNAMES = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'stackpath.bootstrapcdn.com',
  'maxcdn.bootstrapcdn.com',
  'bootstrapcdn.com',
  'netdna.bootstrapcdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'use.fontawesome.com',
  'kit.fontawesome.com',
  'code.jquery.com',
  'ajax.googleapis.com',
  'ajax.aspnetcdn.com',
  'fancyapps.com',
  'cdn.disqus.com',
  'disquscdn.com',
  'platform.twitter.com',
];

// The 9 expected post slugs (derived from _posts filenames, date-prefix stripped)
const EXPECTED_POST_SLUGS = [
  'hello-world',
  'useful-git-aliases',
  'how-i-keep-my-inbox-at-0',
  'shoshin-creative-attitude-a-concept-from-zen-buddism',
  'simple-expense-tracking-you-are-what-you-spend',
  'backup-your-gpg-key',
  'knowledge-is-power-but-how-wikipedia-mobile-app',
  'how-to-preread-any-book-in-less-than-15-minutes',
  'autocomplete-search-engine-can-be-evil',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let passed  = 0;
let failed  = 0;
const failures = [];

function pass(msg) {
  console.log(`  ✓ ${msg}`);
  passed++;
}

function fail(msg, details = '') {
  const fullMsg = details ? `${msg}\n      ${details}` : msg;
  console.error(`  ✗ ${fullMsg}`);
  failed++;
  failures.push(fullMsg);
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

/** Recursively find all *.html files under a directory */
function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

/** Return true if the URL string is an absolute URL pointing at a known CDN hostname */
function isCdnUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  try {
    const { hostname } = new URL(url);
    return CDN_HOSTNAMES.some(cdn => hostname === cdn || hostname.endsWith(`.${cdn}`));
  } catch {
    return false;
  }
}

/** Return true if the given DOM element is inside a <head> element */
function isInHead(el) {
  let node = el;
  while (node) {
    if (node.tagName && node.tagName.toLowerCase() === 'head') return true;
    node = node.parentNode;
  }
  return false;
}

// Pages that intentionally use a minimal layout (redirects, raw data files).
// These are excluded from assertions about skip-link, nav/main/footer landmarks,
// and footer copyright year — but still checked for CDN references and defer/async.
const MINIMAL_LAYOUT_PAGES = [
  'cv/index.html',        // Jekyll redirect_from page → PDF
  'resume/index.html',    // Jekyll redirect_from page → PDF
  'search-data.json/index.html', // JSON data output, not a real HTML page
];

// ─── Bootstrap ───────────────────────────────────────────────────────────────
console.log('HTML Audit — tunjos.co\n');
console.log(`Site directory : ${SITE_DIR}`);
console.log(`Current year   : ${CURRENT_YEAR}`);

if (!existsSync(SITE_DIR)) {
  console.error('\nFATAL: _site/ directory not found. Run `bundle exec jekyll build` first.');
  process.exit(1);
}

const htmlFiles = findHtmlFiles(SITE_DIR);

if (htmlFiles.length === 0) {
  console.error('\nFATAL: No HTML files found in _site/. Did you run `bundle exec jekyll build` first?');
  process.exit(1);
}
console.log(`HTML files     : ${htmlFiles.length} found\n`);

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 1 — No <link href> or <script src> pointing to external CDN
// ═══════════════════════════════════════════════════════════════════════════
section('1. No external CDN references in <link href> / <script src>');

for (const file of htmlFiles) {
  const html    = readFileSync(file, 'utf8');
  const doc     = parse(html);
  const relPath = relative(SITE_DIR, file);
  const cdnHits = [];

  // Check <link> — flag stylesheet, preload (non-image), modulepreload with CDN href
  for (const linkEl of doc.querySelectorAll('link')) {
    const relAttr = (linkEl.getAttribute('rel') || '').toLowerCase();
    const href    = linkEl.getAttribute('href') || '';
    if (['stylesheet', 'preload', 'modulepreload'].includes(relAttr) && isCdnUrl(href)) {
      cdnHits.push(`<link rel="${relAttr}" href="${href}">`);
    }
  }

  // Check <script src>
  for (const script of doc.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src') || '';
    if (isCdnUrl(src)) {
      cdnHits.push(`<script src="${src}">`);
    }
  }

  if (cdnHits.length > 0) {
    fail(`${relPath} — CDN reference(s) found`, cdnHits.join('\n      '));
  } else {
    pass(`${relPath} — no CDN references`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 2 — Every <script src> has defer or async
// ═══════════════════════════════════════════════════════════════════════════
section('2. Every <script src> has defer or async');

for (const file of htmlFiles) {
  const html    = readFileSync(file, 'utf8');
  const doc     = parse(html);
  const relPath = relative(SITE_DIR, file);
  const bad     = [];

  for (const script of doc.querySelectorAll('script[src]')) {
    if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
      const src = script.getAttribute('src') || '';
      bad.push(`<script src="${src}"> (missing defer/async)`);
    }
  }

  if (bad.length > 0) {
    fail(`${relPath} — script(s) without defer/async`, bad.join('\n      '));
  } else {
    pass(`${relPath} — all scripts deferred/async`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 3 — First focusable element is .skip-link[href="#main-content"]
// ═══════════════════════════════════════════════════════════════════════════
section('3. First focusable element is .skip-link[href="#main-content"]');

// Focusable selector (body-scoped)
const FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

for (const file of htmlFiles) {
  const relPath = relative(SITE_DIR, file);

  // Skip minimal-layout pages (redirects, data files)
  if (MINIMAL_LAYOUT_PAGES.includes(relPath)) {
    pass(`${relPath} — skip (minimal layout page)`);
    continue;
  }

  const html = readFileSync(file, 'utf8');
  const doc  = parse(html);

  // Get all focusable elements, excluding those inside <head>
  const allFocusable   = doc.querySelectorAll(FOCUSABLE_SEL);
  const bodyFocusables = allFocusable.filter(el => !isInHead(el));

  if (bodyFocusables.length === 0) {
    fail(`${relPath} — no focusable elements found in body`);
    continue;
  }

  const first      = bodyFocusables[0];
  const tag        = (first.tagName || '').toLowerCase();
  const classes    = (first.getAttribute('class') || '').split(/\s+/);
  const href       = first.getAttribute('href') || '';
  const isSkipLink = tag === 'a' && classes.includes('skip-link') && href === '#main-content';

  if (isSkipLink) {
    pass(`${relPath} — first focusable is .skip-link[href="#main-content"]`);
  } else {
    fail(
      `${relPath} — first focusable is NOT .skip-link[href="#main-content"]`,
      `Got: <${tag} class="${classes.join(' ')}" href="${href}">`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 4 — Each page contains <nav>, <main>, <footer>
// ═══════════════════════════════════════════════════════════════════════════
section('4. Each page contains <nav>, <main>, <footer>');

for (const file of htmlFiles) {
  const relPath = relative(SITE_DIR, file);

  // Skip minimal-layout pages (redirects, data files)
  if (MINIMAL_LAYOUT_PAGES.includes(relPath)) {
    pass(`${relPath} — skip (minimal layout page)`);
    continue;
  }

  const html    = readFileSync(file, 'utf8');
  const doc     = parse(html);
  const missing = [];

  if (!doc.querySelector('nav'))    missing.push('<nav>');
  if (!doc.querySelector('main'))   missing.push('<main>');
  if (!doc.querySelector('footer')) missing.push('<footer>');

  if (missing.length > 0) {
    fail(`${relPath} — missing landmark(s): ${missing.join(', ')}`);
  } else {
    pass(`${relPath} — <nav>, <main>, <footer> present`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 5 — _site/blog/<slug>/index.html exists for all 9 posts
// ═══════════════════════════════════════════════════════════════════════════
section('5. _site/blog/<slug>/index.html exists for all 9 posts');

for (const slug of EXPECTED_POST_SLUGS) {
  const expected = join(SITE_DIR, 'blog', slug, 'index.html');
  if (existsSync(expected)) {
    pass(`blog/${slug}/index.html — exists`);
  } else {
    fail(`blog/${slug}/index.html — MISSING`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 6 — _includes/critical-css.html ≤ 14336 bytes
// ═══════════════════════════════════════════════════════════════════════════
section('6. _includes/critical-css.html ≤ 14336 bytes (14 KB)');

if (!existsSync(CRITICAL_CSS)) {
  fail('_includes/critical-css.html — file not found');
} else {
  const bytes = statSync(CRITICAL_CSS).size;
  const kb    = (bytes / 1024).toFixed(2);
  if (bytes <= 14336) {
    pass(`critical-css.html — ${bytes} bytes (${kb} KB) ≤ 14336`);
  } else {
    fail(
      `critical-css.html — ${bytes} bytes (${kb} KB) exceeds 14336 byte limit`,
      `Reduce critical CSS by ${bytes - 14336} bytes`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertion 7 — Footer copyright year equals current year
// ═══════════════════════════════════════════════════════════════════════════
section(`7. Footer copyright year equals current year (${CURRENT_YEAR})`);

for (const file of htmlFiles) {
  const relPath = relative(SITE_DIR, file);

  // Skip minimal-layout pages (no site footer)
  if (MINIMAL_LAYOUT_PAGES.includes(relPath)) {
    pass(`${relPath} — skip (minimal layout page)`);
    continue;
  }

  const html = readFileSync(file, 'utf8');
  const doc  = parse(html);

  // Use .site-footer specifically to avoid matching article post__footer elements
  // (blog post pages have two footers: post__footer and site-footer)
  const siteFooter = doc.querySelector('.site-footer') || doc.querySelector('footer[role="contentinfo"]');

  if (!siteFooter) {
    // Fall back to any footer if .site-footer not found
    const anyFooter = doc.querySelector('footer');
    if (!anyFooter) {
      fail(`${relPath} — no footer found`);
      continue;
    }
    // Use first footer but warn
    const yearMatches = anyFooter.text.match(/\b(20\d{2})\b/g);
    if (!yearMatches) {
      fail(`${relPath} — footer contains no year`);
      continue;
    }
    const yearsInFooter  = [...new Set(yearMatches)];
    const hasCurrentYear = yearsInFooter.includes(CURRENT_YEAR);
    if (hasCurrentYear) {
      pass(`${relPath} — footer year = ${CURRENT_YEAR}`);
    } else {
      fail(`${relPath} — footer year mismatch`, `Expected ${CURRENT_YEAR}, found: ${yearsInFooter.join(', ')}`);
    }
    continue;
  }

  const footerText  = siteFooter.text;
  const yearMatches = footerText.match(/\b(20\d{2})\b/g);

  if (!yearMatches) {
    fail(`${relPath} — site footer contains no year`);
    continue;
  }

  const yearsInFooter  = [...new Set(yearMatches)];
  const hasCurrentYear = yearsInFooter.includes(CURRENT_YEAR);

  if (hasCurrentYear) {
    pass(`${relPath} — footer year = ${CURRENT_YEAR}`);
  } else {
    fail(
      `${relPath} — footer year mismatch`,
      `Expected ${CURRENT_YEAR}, found: ${yearsInFooter.join(', ')}`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
const total = passed + failed;
console.log('\n' + '═'.repeat(60));
console.log(`Results: ${passed}/${total} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\nFailed assertions:');
  failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
  process.exit(1);
} else {
  console.log('\nAll assertions passed ✓');
  process.exit(0);
}
