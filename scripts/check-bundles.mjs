#!/usr/bin/env node
/**
 * Every script a built page loads arrives in one request.
 *
 * Astro bundles each component's <script> separately, and a module that two of
 * them import is split out into a shared file. The browser only finds that file
 * once the script importing it has arrived and been read, so every split is a
 * network round trip after another on a slow phone connection. The shop's
 * scripts did this with the basket key and the variant label: a product page
 * with something on sale loaded two scripts and two split files behind them.
 * Its largest paint was 2039ms that way and 1912ms as one script, against a
 * 2000ms budget.
 *
 * Lighthouse only sees that on the pages it visits, and only in the state they
 * are in that day; a product page is measured on sale only once something is
 * on sale. This reads every script any built page loads and fails if one of
 * them imports a file of its own. The shop's one script is on the basket page
 * whatever the catalogue holds, so it is checked while nothing is on sale too.
 *
 * The fix is nearly always to bring the importing scripts together into one, as
 * src/components/shop/ShopScript.astro does for the shop. A dynamic import()
 * is a deliberate later load and is not flagged.
 *
 * Run: npm run check:bundles, after a build.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

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

/** A module script of the site's own, as the build writes it. */
const SCRIPT_TAG = /<script\b[^>]*\btype="module"[^>]*\bsrc="(\/_astro\/[^"]+\.js)"/g;

/** A static import, minified or not: `import{t as e}from"./x.js"`,
    `import x from './x.js'`, `import "./x.js"`. Not `import(` . */
const STATIC_IMPORT = /\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?["']([^"']+)["']/g;

/** @type {Map<string, string[]>} script path -> pages that load it */
const loadedBy = new Map();
let pages = 0;

for await (const file of walk(dist)) {
  pages += 1;
  const html = await readFile(file, 'utf8');
  const page = relative(dist, file).split('\\').join('/');
  for (const [, src] of html.matchAll(SCRIPT_TAG)) {
    if (!loadedBy.has(src)) loadedBy.set(src, []);
    loadedBy.get(src).push(page);
  }
}

if (pages === 0) {
  console.error('No build output found. Run `npm run build` first.');
  process.exit(1);
}

const problems = [];

for (const [src, onPages] of loadedBy) {
  const code = await readFile(join(dist, src), 'utf8');
  const imports = [...code.matchAll(STATIC_IMPORT)].map((match) => match[1]);
  if (imports.length === 0) continue;
  const example = onPages.slice(0, 3).join(', ') + (onPages.length > 3 ? ', …' : '');
  problems.push(`${src}\n    imports ${imports.join(', ')}\n    loaded by ${onPages.length} page(s): ${example}`);
}

if (problems.length) {
  console.log(`\n${problems.length} page script(s) import a file of their own:\n`);
  for (const problem of problems) console.log(`  ${problem}\n`);
  console.log(
    'Each import is a request the browser cannot start until the script has arrived. ' +
      'Bring the scripts that share a module into one script, as ShopScript.astro does for the shop.'
  );
  process.exit(1);
}

console.log(
  `Bundles: ${loadedBy.size} page script(s) across ${pages} page(s), and none imports a file of its own.`
);
