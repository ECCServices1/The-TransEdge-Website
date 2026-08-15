#!/usr/bin/env node
/**
 * Keeps the draft register, the built pages and the Lighthouse budget in step.
 *
 * Three things can disagree, and each disagreement is silent:
 *
 *   1. A page listed as draft that forgot its `noindex` prop. It gets indexed
 *      while everyone believes it is hidden, which is the failure that matters:
 *      an unapproved statement of faith in a search result.
 *   2. A page marked `noindex` that nobody recorded as draft. It stays out of
 *      search forever because approving it means removing a prop nobody knows
 *      is there.
 *   3. The Lighthouse assertion matrix judging a noindex page on SEO, which it
 *      can never pass. That is what broke the build: the SEO exemption was
 *      keyed on the URL containing "/ar/" rather than on the page being
 *      noindex, so the first English draft page to reach CI failed at 0.63.
 *
 * Run: npm run check:noindex, after a build.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { DRAFT_PAGES, DRAFT_ROUTES } from '../src/data/draft-pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Locale routes are noindex until a native speaker reviews them, per section
    15. They are exempt by prefix rather than listed one by one, because the
    register is about English pages awaiting approval. */
const LOCALE_PREFIX = /^\/(?:zh|ar|hi|sw|ja|ko)\//;

/** Not a page. */
const NOT_A_PAGE = /^\/admin\//;

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const problems = [];

/** @type {Set<string>} routes found noindex in the build */
const foundNoindex = new Set();

for await (const file of walk(dist)) {
  const url = '/' + relative(dist, file).split('\\').join('/');
  if (LOCALE_PREFIX.test(url) || NOT_A_PAGE.test(url)) continue;

  const html = await readFile(file, 'utf8');
  const robots = html.match(/name="robots"\s+content="([^"]*)"/)?.[1] ?? '';
  const route = url.replace(/^\//, '').replace(/\.html$/, '');

  if (robots.includes('noindex')) foundNoindex.add(route);
}

for (const route of DRAFT_ROUTES) {
  if (!foundNoindex.has(route)) {
    problems.push(
      `${route} is on the draft register but the built page is indexable. ` +
        `Add \`noindex\` to its PageLayout, or remove it from src/data/draft-pages.mjs if it is approved.`
    );
  }
}

for (const route of foundNoindex) {
  // 404 is noindex by nature and is not a draft.
  if (route === '404') continue;
  if (!DRAFT_ROUTES.includes(route)) {
    problems.push(
      `${route} is noindex but is not on the draft register. ` +
        `Add it to src/data/draft-pages.mjs with the reason, so it is not hidden from search by accident and forever.`
    );
  }
}

/* --------------------------------------------- the Lighthouse budget agrees */

const RELAXED_MARKER = 'noindex';
const rc = JSON.parse(await readFile(join(root, 'lighthouserc.json'), 'utf8'));
const urls = rc.ci.collect.url ?? [];
const matrix = rc.ci.assert?.assertMatrix ?? [];

/** The entry that relaxes SEO. Identified by having a warn-level SEO budget. */
const relaxed = matrix.find(
  (entry) => Array.isArray(entry.assertions?.['categories:seo']) &&
    entry.assertions['categories:seo'][0] === 'warn'
);

if (!relaxed) {
  problems.push(
    'lighthouserc.json has no assertion-matrix entry that relaxes categories:seo. ' +
      'A noindex page cannot score above about 0.63 on SEO, so one is required.'
  );
} else {
  const pattern = new RegExp(relaxed.matchingUrlPattern);
  for (const url of urls) {
    const path = new URL(url).pathname;
    const route = path.replace(/^\//, '').replace(/\.html$/, '');
    if (!DRAFT_ROUTES.includes(route)) continue;
    if (!pattern.test(url)) {
      problems.push(
        `${path} is a draft page in the Lighthouse target list, but does not match the relaxed ` +
          `assertion pattern ${relaxed.matchingUrlPattern}. It will fail the SEO budget at about 0.63.`
      );
    }
  }
}

/* -------------------------------------------------------------------- report */

if (problems.length) {
  console.log(`\n${problems.length} problem(s) with the draft register:\n`);
  for (const p of problems) console.log(`  ${p}\n`);
  process.exit(1);
}

const byReason = DRAFT_PAGES.reduce((acc, page) => {
  acc[page.reason] = (acc[page.reason] ?? 0) + 1;
  return acc;
}, /** @type {Record<string, number>} */ ({}));

console.log(
  `Draft register: ${DRAFT_ROUTES.length} page(s) noindex and accounted for ` +
    `(${Object.entries(byReason).map(([k, v]) => `${v} ${k}`).join(', ')}). ` +
    `${RELAXED_MARKER} pages are exempt from the SEO budget.`
);
