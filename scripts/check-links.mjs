#!/usr/bin/env node
/**
 * Every internal link on the built site must resolve to a page that exists.
 *
 * This should have existed from the first build. Twelve internal links pointed
 * at pages that were never written, including two items in the main navigation
 * and one in the footer that appeared on every page of the site. Nothing caught
 * it: Astro does not verify hrefs, the type checker cannot see a string, and
 * Lighthouse only visits the seven URLs it is given.
 *
 * It reads the built output rather than the source, so it checks what a visitor
 * would actually click. A route that exists in `src/pages` but fails to build,
 * or a `getStaticPaths` that quietly returns fewer paths than expected, both
 * show up here as broken links.
 *
 * Redirects count as real destinations. The generator writes them into
 * `dist/_redirects`, so a link to an old path that is redirected is fine.
 *
 * Run: npm run check:links
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/**
 * Built with `format: 'file'`, so /events is dist/events.html rather than
 * dist/events/index.html. Both shapes are accepted, because changing that
 * setting should not silently break this checker.
 */
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
    else yield full;
  }
}

const files = [];
for await (const file of walk(dist)) files.push(file);

if (!files.length) {
  console.error('No build output found. Run `npm run build` first.');
  process.exit(1);
}

/* --------------------------------------------------------- what exists */

/** @type {Set<string>} every path a visitor can successfully open */
const routes = new Set();

/** Routes backed by a real built page, kept apart from redirect sources so the
    two can be compared. */
const builtPages = new Set();

for (const file of files) {
  const rel = '/' + relative(dist, file).split('\\').join('/');
  routes.add(rel);
  if (rel.endsWith('.html')) builtPages.add(rel.slice(0, -'.html'.length) || '/');
  if (rel.endsWith('/index.html')) builtPages.add(rel.slice(0, -'/index.html'.length) || '/');
  if (rel.endsWith('/index.html')) {
    routes.add(rel.slice(0, -'index.html'.length));
    routes.add(rel.slice(0, -'/index.html'.length) || '/');
  } else if (rel.endsWith('.html')) {
    routes.add(rel.slice(0, -'.html'.length));
  }
}
routes.add('/');

/* Redirect sources are real destinations from a visitor's point of view. */

/** @type {{from: string, to: string}[]} every redirect, for the shadowing check below. */
const redirectRules = [];

try {
  const redirects = await readFile(join(dist, '_redirects'), 'utf8');
  for (const line of redirects.split('\n')) {
    const [from, to] = line.trim().split(/\s+/);
    if (!from || from.startsWith('#')) continue;
    routes.add(from.replace(/\/$/, '') || '/');
    if (to) redirectRules.push({ from, to });
  }
} catch {
  /* No redirects file is not an error. */
}

/*
  A redirect and a real page cannot both own a path. The redirect wins, and the
  page becomes unreachable at its own address while every internal link to it
  still passes the check below, because the loop above counted the redirect
  source as a route that resolves.

  That is not hypothetical. The Wix shop at /shop was retired to the home page
  long before this site had a shop of its own. When one was built at the same
  address, every link to it quietly landed on the home page instead, and this
  checker reported that every internal link resolved. It was only visible by
  running the real Worker and watching /shop answer 301.

  A wildcard source is left alone: /product-page/* is meant to catch addresses
  that no longer exist, and matching a built page is the point of it.
*/
const shadowed = [];
for (const rule of redirectRules) {
  if (rule.from.includes('*')) continue;
  const path = rule.from.replace(/\/$/, '') || '/';
  const built = builtPages.has(path);
  if (built) shadowed.push(rule);
}

/* ------------------------------------------------------- what is linked */

const problems = [];
const seen = new Set();

for (const file of files) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(file, 'utf8');
  const page = '/' + relative(dist, file).split('\\').join('/');

  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    // External, in-page, and non-navigational schemes are all out of scope.
    if (!href.startsWith('/') || href.startsWith('//')) continue;

    const path = href.split('#')[0].split('?')[0];
    if (!path) continue;

    const normalised = path.length > 1 ? path.replace(/\/$/, '') : path;
    if (routes.has(normalised) || routes.has(path)) continue;

    const key = `${page}→${normalised}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({ page, href: normalised });
  }
}

/* --------------------------------------------------------------- report */

if (shadowed.length) {
  console.log(`\n${shadowed.length} page(s) shadowed by a redirect:\n`);
  for (const rule of shadowed) {
    console.log(
      `  ${rule.from} is a built page, but src/data/redirects.mjs sends it to ${rule.to}.\n` +
        `  The redirect wins, so the page is unreachable at its own address.\n` +
        `  Remove the redirect, or move the page.\n`
    );
  }
  process.exit(1);
}

if (problems.length) {
  /* Grouped by target, because one dead link in a shared header is one fix,
     not forty, and a list of forty hides that. */
  const byTarget = new Map();
  for (const p of problems) {
    if (!byTarget.has(p.href)) byTarget.set(p.href, []);
    byTarget.get(p.href).push(p.page);
  }

  console.log(`\n${byTarget.size} internal link target(s) do not exist:\n`);
  for (const [href, pages] of [...byTarget].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${href}`);
    console.log(
      `    linked from ${pages.length} page(s), e.g. ${pages.slice(0, 3).join(', ')}${pages.length > 3 ? ' …' : ''}\n`
    );
  }
  console.log('Either build the page, or change the link, or add a redirect.');
  process.exit(1);
}

console.log(`Links: every internal link resolves. ${routes.size} routes, ${files.length} files.`);
