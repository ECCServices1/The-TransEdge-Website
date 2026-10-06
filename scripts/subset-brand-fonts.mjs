#!/usr/bin/env node
/**
 * Subsets the typefaces into the Latin ranges the site actually uses, and
 * writes the @font-face stylesheet that serves them.
 *
 * TWO SOURCES, ONE STYLESHEET
 * Inter comes from TTE Web Typography Handover v1.0, kept unmodified in
 * assets/typography/ so the handover remains the source of truth for the text
 * face. Fraunces is the approved display face and lives in
 * assets/typography/display/, already range-split, so it is not re-subset; only
 * its weight range is cut (below).
 *
 * The pairing is deliberate: the handover's discipline with the serif the
 * client approved. See docs/typography.md for what was taken from each.
 *
 * WHY SUBSET
 * The supplied InterVariable.woff2 is 352KB because it carries the full Inter
 * character set: Cyrillic, Greek, Vietnamese and a large symbol range. This site
 * serves Latin from these files and every other script from the Noto stacks
 * loaded per locale, so those ranges are downloaded by every visitor and used by
 * none. Subsetting to latin and latin-ext is what keeps the body face off the
 * LCP critical path.
 *
 * WHY THE WEIGHT RANGE IS CUT
 * Both faces are variable and arrive covering every weight from 100 to 900. The
 * site draws Inter at 400 to 700 and Fraunces at 450 and 600, measured on
 * 5 October 2026 from the computed weight of every piece of text on all 68 built
 * pages at phone and desktop widths. Each file keeps its weight axis but only
 * the part the site uses: Inter 400 to 700, Fraunces 400 to 600. That took about
 * 29KB off what every page downloads. The two faces had been 139KB of the shop
 * page's 190KB, and on the CI's simulated phone connection that was the
 * difference between passing and failing the 2.0s LCP budget. Every weight in
 * the range is drawn as before, to within a fraction of a pixel: every page was
 * screenshotted before and after, and no line of text moved or re-wrapped. The
 * optical size axes are untouched.
 *
 * A weight outside the range is drawn at the nearest end of it. A design that
 * wants, say, Inter at 800 needs the range widened in WEIGHTS below and this
 * script run again.
 *
 * Run: npm run fonts:subset (needs Python's fontTools and brotli)
 */
import { mkdir, writeFile, stat, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'assets', 'typography');
const OUT = join(root, 'public', 'fonts');
const CSS_DIR = join(OUT, 'css');

/**
 * The two Latin ranges, matching the boundaries Google Fonts uses, so the split
 * behaves the same way as the Noto stacks already in public/fonts/css/.
 */
const RANGES = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,' +
    'U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,' +
    'U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

/**
 * The weight range each face keeps. See WHY THE WEIGHT RANGE IS CUT above; the
 * @font-face rules declare the same ranges.
 */
const WEIGHTS = {
  Inter: { from: 400, to: 700 },
  Fraunces: { from: 400, to: 600 },
};

/** Cut a variable font's weight axis to a range, keeping the axis. */
const cutWeights = (source, target, { from, to }) =>
  run('python3', ['-m', 'fontTools.varLib.instancer', source, `wght=${from}:${to}`, '-q', '-o', target]);

/**
 * Fraunces, the display face. Already subset per range by its source, and it
 * carries opsz 9-144 and wght 100-900, so it is not run through the subsetter
 * again, which would risk the axes. Only its weight range is cut.
 */
const DISPLAY = [
  { file: 'Fraunces-latin.woff2', range: 'latin', slug: 'fraunces-latin' },
  { file: 'Fraunces-latin-ext.woff2', range: 'latin-ext', slug: 'fraunces-latin-ext' },
];

/** The text face, subset from the handover's own files. */
const FACES = [
  {
    file: 'InterVariable.woff2',
    family: 'Inter',
    slug: 'inter',
    note: 'Body, navigation, buttons, labels. Variable, cut to 400 to 700.',
    // Not preloaded. The largest paint across the site is a Fraunces heading,
    // and preloading Inter as well charged that paint with Inter's bytes: the
    // Events page went from 2040ms to 1891ms when it stopped (16 August 2026).
    // Inter swaps in through its size-adjusted fallback. preload.json was
    // edited by hand at the time, so running this script would have put the
    // preload back.
    preload: false,
  },
];

await mkdir(OUT, { recursive: true });
await mkdir(CSS_DIR, { recursive: true });

/* The previous Latin faces came from a different source and are replaced
   wholesale, so stale files are removed rather than left to be served. */
for (const stale of [
  'fraunces-latin-0-1.woff2', 'fraunces-latin-ext-0.woff2',
  'inter-latin-0-1.woff2', 'inter-latin-ext-0.woff2',
  'inter-display-400-latin.woff2', 'inter-display-400-latin-ext.woff2',
  'inter-display-600-latin.woff2', 'inter-display-600-latin-ext.woff2',
  'inter-display-700-latin.woff2', 'inter-display-700-latin-ext.woff2',
]) {
  await rm(join(OUT, stale), { force: true });
}

const rules = [];
const preload = [];
let before = 0;
let after = 0;

for (const face of FACES) {
  const source = join(SRC, face.file);
  before += (await stat(source)).size;

  for (const [range, unicodes] of Object.entries(RANGES)) {
    const filename = `${face.slug}-${range}.woff2`;
    const target = join(OUT, filename);
    const subset = join(OUT, `${face.slug}-${range}.subset.woff2`);
    const { from, to } = WEIGHTS[face.family];

    await run('python3', [
      '-m',
      'fontTools.subset',
      source,
      `--unicodes=${unicodes.replace(/U\+/g, '')}`,
      '--flavor=woff2',
      // Only the features the site actually renders. Keeping everything adds
      // roughly 60 per cent to the body face for tabular alternates and
      // stylistic sets nothing here uses.
      '--layout-features=kern,liga,clig,calt,ccmp,mark,mkmk,locl,tnum,case,frac',
      '--no-hinting',
      '--desubroutinize',
      '--drop-tables+=DSIG',
      `--output-file=${subset}`,
    ]);
    await cutWeights(subset, target, WEIGHTS[face.family]);
    await rm(subset, { force: true });

    const size = (await stat(target)).size;
    after += size;

    rules.push(
      `/* ${face.family} ${from} ${to}, ${range}. ${face.note} */\n` +
        `@font-face {\n` +
        `  font-family: '${face.family}';\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${from} ${to};\n` +
        `  font-display: swap;\n` +
        `  src: url('/fonts/${filename}') format('woff2');\n` +
        `  unicode-range: ${unicodes.split(',').join(', ')};\n` +
        `}`
    );

    if (face.preload && range === 'latin') preload.push(`/fonts/${filename}`);
    console.log(`${filename}: ${(size / 1024).toFixed(1)}KB`);
  }
}

/* Fraunces, with its optical size axis intact and its weight range cut, and
   preloaded: it draws the h1 on every page, so it is on the critical path. */
for (const face of DISPLAY) {
  const source = join(SRC, 'display', face.file);
  const filename = `${face.slug}.woff2`;
  const { from, to } = WEIGHTS.Fraunces;
  await cutWeights(source, join(OUT, filename), WEIGHTS.Fraunces);
  before += (await stat(source)).size;
  const size = (await stat(join(OUT, filename))).size;
  after += size;

  rules.unshift(
    `/* Fraunces, variable opsz 9-144 and wght ${from}-${to}, ${face.range}.\n` +
      `   The display face. Optical size is set per heading level in base.css. */\n` +
      `@font-face {\n` +
      `  font-family: 'Fraunces';\n` +
      `  font-style: normal;\n` +
      `  font-weight: ${from} ${to};\n` +
      `  font-display: swap;\n` +
      `  src: url('/fonts/${filename}') format('woff2');\n` +
      `  unicode-range: ${RANGES[face.range].split(',').join(', ')};\n` +
      `}`
  );

  if (face.range === 'latin') preload.unshift(`/fonts/${filename}`);
  console.log(`${filename}: ${(size / 1024).toFixed(1)}KB (weights ${from} to ${to})`);
}

const header =
  `/* Generated by scripts/subset-brand-fonts.mjs. Do not edit.\n` +
  `   Fraunces is the display face; Inter is from TTE Web Typography\n` +
  `   Handover v1.0. Both SIL Open Font Licence 1.1. */\n\n`;

await writeFile(join(CSS_DIR, 'latin.css'), header + rules.join('\n\n') + '\n', 'utf8');
await writeFile(join(CSS_DIR, 'preload.json'), JSON.stringify(preload, null, 2) + '\n', 'utf8');

console.log(
  `\nwrote public/fonts/css/latin.css and preload.json (${preload.length} preloaded)\n` +
    `sources ${(before / 1024).toFixed(0)}KB -> subset ${(after / 1024).toFixed(0)}KB`
);
