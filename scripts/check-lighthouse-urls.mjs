#!/usr/bin/env node
/**
 * Asserts that every URL Lighthouse is told to audit actually exists in dist.
 *
 * Astro is configured with `build.format: 'file'`, so `src/pages/events/index.astro`
 * emits `dist/events.html`, not `dist/events/index.html`. Getting that wrong
 * gives Lighthouse a 404, and Lighthouse reports it as "unable to reliably load
 * the page" after several hundred lines of audit exceptions, which is a slow and
 * confusing way to learn about a typo in a path.
 *
 * This turns that into one line naming the missing file.
 *
 * Run: node scripts/check-lighthouse-urls.mjs
 */
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(join(root, 'lighthouserc.json'), 'utf8'));

const urls = config.ci.collect.url ?? [];
const distDir = join(root, config.ci.collect.staticDistDir ?? 'dist');

const missing = [];
for (const url of urls) {
  const path = new URL(url).pathname;
  try {
    await access(join(distDir, path));
  } catch {
    missing.push(path);
  }
}

if (missing.length) {
  console.error(`${missing.length} Lighthouse target(s) do not exist in ${distDir}:`);
  for (const path of missing) console.error(`  - ${path}`);
  console.error('\nAstro builds with format: "file", so a page at src/pages/x/index.astro');
  console.error('is emitted as dist/x.html, not dist/x/index.html.');
  process.exit(1);
}

console.log(`All ${urls.length} Lighthouse targets exist.`);
