#!/usr/bin/env node
/**
 * Verifies that the inlined symbol geometry still matches the supplied vector
 * master, and that the brand primitives in tokens.css still match the supplied
 * token file.
 *
 * The site inlines the symbol so it can inherit currentColor, and restates the
 * brand palette as CSS custom properties. Both are copies of files the client
 * supplied, and a copy with no check attached is a copy that drifts. This is
 * the check.
 *
 * It also enforces the rule from the supplied README that the accent must never
 * colour a plane in the core symbol.
 *
 * Run: npm run check:brand
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SYMBOL } from '../src/lib/brand-marks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = join(root, 'public', 'brand', 'vector', 'tte_symbol_primary.svg');
const TOKENS_JSON = join(root, 'public', 'brand', 'reference', 'tte_brand_tokens.json');
const TOKENS_CSS = join(root, 'src', 'styles', 'tokens.css');

const problems = [];

/* ------------------------------------------------- symbol geometry matches */

const masterSvg = await readFile(MASTER, 'utf8');

/** "8.000,16.000 44.000,28.000" and "8,16 44,28" must compare equal. */
const normalise = (points) =>
  points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map((n) => Number(n).toString()).join(','))
    .join(' ');

const masterPlanes = [...masterSvg.matchAll(/<polygon[^>]*points="([^"]+)"/g)].map((m) =>
  normalise(m[1])
);
const inlinePlanes = SYMBOL.planes.map(normalise);

if (masterPlanes.length !== inlinePlanes.length) {
  problems.push(
    `The master has ${masterPlanes.length} plane(s), the inline symbol has ${inlinePlanes.length}.`
  );
} else {
  masterPlanes.forEach((plane, index) => {
    if (plane !== inlinePlanes[index]) {
      problems.push(
        `Plane ${index + 1} has drifted from the vector master.\n` +
          `      master: ${plane}\n` +
          `      inline: ${inlinePlanes[index]}`
      );
    }
  });
}

const masterViewBox = masterSvg.match(/viewBox="([^"]+)"/)?.[1];
if (masterViewBox && normalise(masterViewBox.replace(/ /g, ',')) !== normalise(SYMBOL.viewBox.replace(/ /g, ','))) {
  problems.push(`viewBox drift: master "${masterViewBox}", inline "${SYMBOL.viewBox}".`);
}

/* ------------------------------------- the accent never colours the symbol */

const emberish = /#e46f3c|#a94722|#f6895b/i;
for (const [, fill] of masterSvg.matchAll(/<polygon[^>]*fill="([^"]+)"/g)) {
  if (emberish.test(fill)) {
    problems.push(
      `A plane in the core symbol is filled with the accent (${fill}). The supplied README ` +
        `states ember must never colour a plane in the core symbol.`
    );
  }
}

/* -------------------------------------------- brand primitives match source */

const supplied = JSON.parse(await readFile(TOKENS_JSON, 'utf8'));
const css = await readFile(TOKENS_CSS, 'utf8');

/** @param {string} name */
function cssValue(name) {
  return css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]?.trim().toLowerCase();
}

const REQUIRED = {
  '--color-primary': supplied.brand.primary,
  '--color-heritage': supplied.brand.heritage,
  '--color-ember': supplied.brand['accent-ember'],
  '--color-ember-accessible': supplied.brand['accent-ember-accessible'],
  '--color-neutral-100': supplied.neutral['100'],
  '--color-neutral-200': supplied.neutral['200'],
  '--color-neutral-300': supplied.neutral['300'],
  '--color-neutral-400': supplied.neutral['400'],
  '--color-neutral-500': supplied.neutral['500'],
  '--color-neutral-600': supplied.neutral['600'],
  '--color-neutral-700': supplied.neutral['700'],
  '--color-neutral-800': supplied.neutral['800'],
  '--color-neutral-900': supplied.neutral['900'],
};

for (const [token, expected] of Object.entries(REQUIRED)) {
  const actual = cssValue(token);
  if (actual !== expected.toLowerCase()) {
    problems.push(
      `${token} is "${actual}" but the supplied brand file says "${expected.toLowerCase()}". ` +
        `A brand primitive is not a preference.`
    );
  }
}

/* ------------------------------------------------------------------ report */

if (problems.length) {
  console.error('Brand check failed:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `Brand check: symbol geometry matches the vector master (${masterPlanes.length} planes), ` +
    `${Object.keys(REQUIRED).length} brand primitives match the supplied token file, ` +
    `and the accent does not appear in the core symbol.`
);
