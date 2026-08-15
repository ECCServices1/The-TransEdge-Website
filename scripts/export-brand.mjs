#!/usr/bin/env node
/**
 * Exports the vector asset set from the geometry in src/lib/brand-marks.mjs.
 *
 * All three directions are exported while the choice is open, so each can be
 * dropped into a real context during review rather than judged on a screen.
 * Once a direction is approved, pass its key to export only that one.
 *
 *   node scripts/export-brand.mjs            all three
 *   node scripts/export-brand.mjs crossing   the approved direction only
 *
 * SVG is produced here. PDF and EPS are converted from these files, which is
 * the one step that needs a tool this repository does not carry: see
 * docs/brand-audit.md for the conversion command and the checks to run on the
 * output.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { MARKS, MARK_KEYS, markToSvg } from '../src/lib/brand-marks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public', 'brand');

/* Values are literal here rather than token references, because these files are
   handed to printers and to third parties who have no stylesheet. */
const INK = '#1c2331'; // slate 900
const EMBER = '#be4f1b'; // ember 600
const PAPER = '#faf8f6'; // neutral 100

/**
 * A maskable app icon needs its content inside the safe circle, which is 80%
 * of the canvas. The mark is scaled to 60% and centred, so no platform's
 * corner treatment can clip it.
 */
function appIcon(key, background, foreground) {
  const paths = MARKS[key].paths.map((d) => `    <path d="${d}" />`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${MARKS[key].name}, The Transformation Edge">
  <title>${MARKS[key].name}, The Transformation Edge</title>
  <rect width="512" height="512" fill="${background}"/>
  <g transform="translate(102.4 102.4) scale(9.6)" fill="${foreground}">
${paths}
  </g>
</svg>
`;
}

/**
 * The favicon carries no padding at all. Browser chrome supplies its own, and
 * a mark that pads itself again is the reason the current lockup is illegible
 * at 16px.
 */
function favicon(key, colour) {
  const paths = MARKS[key].paths.map((d) => `  <path d="${d}" />`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 24 24" width="32" height="32" fill="${colour}">
${paths}
</svg>
`;
}

const requested = process.argv.slice(2);
const keys = requested.length ? requested : [...MARK_KEYS];

for (const key of keys) {
  if (!MARKS[key]) {
    console.error(`Unknown direction "${key}". Known: ${MARK_KEYS.join(', ')}`);
    process.exit(1);
  }
}

await mkdir(OUT, { recursive: true });

let count = 0;
for (const key of keys) {
  const files = {
    // Single colour, inheriting from context. This is the file the site uses.
    [`${key}-symbol.svg`]: markToSvg(key, { size: 32, colour: 'currentColor' }),
    // Fixed-ink versions for anyone outside a stylesheet.
    [`${key}-symbol-ink.svg`]: markToSvg(key, { size: 512, colour: INK }),
    [`${key}-symbol-ember.svg`]: markToSvg(key, { size: 512, colour: EMBER }),
    // Reversed, for dark grounds and for photography.
    [`${key}-symbol-reversed.svg`]: markToSvg(key, { size: 512, colour: PAPER }),
    // One colour, pure black, which is what a printer asks for.
    [`${key}-symbol-mono.svg`]: markToSvg(key, { size: 512, colour: '#000000' }),
    [`${key}-favicon.svg`]: favicon(key, INK),
    [`${key}-app-icon.svg`]: appIcon(key, INK, PAPER),
    [`${key}-social-avatar.svg`]: appIcon(key, EMBER, PAPER),
  };

  for (const [filename, contents] of Object.entries(files)) {
    await writeFile(join(OUT, filename), contents, 'utf8');
    count += 1;
  }
  console.log(`${key}: ${Object.keys(files).length} files`);
}

console.log(`\n${count} vector files written to public/brand/.`);
console.log('Clear space, minimum sizes and misuse rules: docs/brand-audit.md');
