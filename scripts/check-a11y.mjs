#!/usr/bin/env node
/**
 * Runs axe over every built page, in both colour schemes.
 *
 * WHY THIS EXISTS WHEN LIGHTHOUSE ALREADY RUNS
 *
 * Lighthouse visits ten URLs. This site builds forty-five. That gap has already
 * cost us twice:
 *
 *   - `--color-text-subtle` at 14px failed contrast in five components. Only one
 *     of them sat on a Lighthouse URL, so CI reported a single instance of a
 *     defect that existed five times, and the other four would have shipped.
 *   - Two earlier composition failures, the locale switcher on the footer's
 *     inverted ground and a caption on a raised surface, were invisible to the
 *     token checker because it compares pairs of tokens and never sees what is
 *     actually rendered on top of what.
 *
 * The three checks catch different things and none of them is redundant. The
 * token checker proves the palette is sound. check-quiet-text proves a 3:1 token
 * is not used at body size. This proves the composition holds once everything is
 * on the page together, which is the only place a background and a foreground
 * actually meet.
 *
 * Both schemes, because dark mode remaps every colour and a pairing that passes
 * in one can fail in the other.
 *
 * The page is scrolled to the bottom before the audit, so scroll-driven
 * animations settle into their arrived state. Auditing a page whose content is
 * still at opacity 0 measures nothing.
 *
 * Run: npm run check:a11y
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, relative } from 'node:path';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

/* One locale is audited rather than all six. The locale template is one file,
   so a fault in it is a fault in every locale, and Arabic is the one that
   exercises right-to-left. */
const LOCALE_SAMPLE = '/ar/';
const SKIP = [/^\/admin\//];

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.xml': 'application/xml',
};

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

const pages = [];
for await (const file of walk(dist)) {
  const url = '/' + relative(dist, file).split('\\').join('/');
  if (SKIP.some((re) => re.test(url))) continue;
  const isLocale = /^\/(?:zh|ar|hi|sw|ja|ko)\//.test(url);
  if (isLocale && !url.startsWith(LOCALE_SAMPLE)) continue;
  pages.push(url);
}
pages.sort();

if (!pages.length) {
  console.error('No build output found. Run `npm run build` first.');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  if (path === '/') path = '/index.html';
  try {
    const body = await readFile(join(dist, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;

/* Playwright's own Chromium if it is there, the system one otherwise, so this
   runs both in the dev container and on a CI runner. */
const launchOptions = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {};
const browser = await chromium.launch(launchOptions);

const violations = [];

for (const path of pages) {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({
      colorScheme,
      /* A small phone. The narrowest layout is where text is most likely to be
         forced onto a surface it was not designed against. */
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(base + path, { waitUntil: 'networkidle' });

    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 20));
      }
      window.scrollTo(0, 0);
    });

    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(
      async () =>
        await window.axe.run(document, {
          resultTypes: ['violations'],
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        })
    );

    for (const v of result.violations) {
      violations.push({ path, colorScheme, ...v });
    }
    await context.close();
  }
}

await browser.close();
server.close();

if (violations.length) {
  console.log(`\n${violations.length} violation group(s):\n`);
  for (const v of violations) {
    console.log(`  ${v.path}  [${v.colorScheme}]  ${v.id}  (${v.impact})`);
    console.log(`    ${v.help}`);
    for (const node of v.nodes.slice(0, 4)) {
      console.log(`      ${node.target.join(' ')}`);
      const message = (node.any[0]?.message || node.all[0]?.message || '').split('\n')[0];
      if (message) console.log(`        ${message}`);
    }
    console.log(`    ${v.helpUrl}\n`);
  }
  process.exit(1);
}

console.log(
  `Accessibility: ${pages.length} page(s) × 2 colour schemes, no WCAG 2.2 AA violations.`
);
