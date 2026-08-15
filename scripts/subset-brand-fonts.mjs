#!/usr/bin/env node
/**
 * Subsets the typefaces into the Latin ranges the site actually uses, and
 * writes the @font-face stylesheet that serves them.
 *
 * TWO SOURCES, ONE STYLESHEET
 * Inter comes from TTE Web Typography Handover v1.0, kept unmodified in
 * assets/typography/ so the handover remains the source of truth for the text
 * face. Fraunces is the approved display face and lives in
 * assets/typography/display/, already range-split, so it is copied rather than
 * re-subset.
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
 * Variable axes are preserved: --layout-features and the weight axis survive,
 * so Inter is still one variable file across 100 to 900.
 *
 * Run: npm run fonts:subset
 */
import { mkdir, writeFile, stat, rm, copyFile } from 'node:fs/promises';
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
 * Fraunces, the display face. Already subset per range by its source, and it
 * carries opsz 9-144 and wght 100-900, so it is copied verbatim rather than run
 * through the subsetter again, which would risk the axes.
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
    weight: '100 900',
    slug: 'inter',
    note: 'Body, navigation, buttons, labels. Variable 100 to 900.',
    preload: true,
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
      `--output-file=${target}`,
    ]);

    const size = (await stat(target)).size;
    after += size;

    rules.push(
      `/* ${face.family} ${face.weight}, ${range}. ${face.note} */\n` +
        `@font-face {\n` +
        `  font-family: '${face.family}';\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${face.weight};\n` +
        `  font-display: swap;\n` +
        `  src: url('/fonts/${filename}') format('woff2');\n` +
        `  unicode-range: ${unicodes.split(',').join(', ')};\n` +
        `}`
    );

    if (face.preload && range === 'latin') preload.push(`/fonts/${filename}`);
    console.log(`${filename}: ${(size / 1024).toFixed(1)}KB`);
  }
}

/* Fraunces, copied with its axes intact and preloaded: it draws the h1 on
   every page, so it is on the critical path. */
for (const face of DISPLAY) {
  const source = join(SRC, 'display', face.file);
  const filename = `${face.slug}.woff2`;
  await copyFile(source, join(OUT, filename));
  const size = (await stat(join(OUT, filename))).size;
  before += size;
  after += size;

  rules.unshift(
    `/* Fraunces, variable opsz 9-144 and wght 100-900, ${face.range}.\n` +
      `   The display face. Optical size is set per heading level in base.css. */\n` +
      `@font-face {\n` +
      `  font-family: 'Fraunces';\n` +
      `  font-style: normal;\n` +
      `  font-weight: 100 900;\n` +
      `  font-display: swap;\n` +
      `  src: url('/fonts/${filename}') format('woff2');\n` +
      `  unicode-range: ${RANGES[face.range].split(',').join(', ')};\n` +
      `}`
  );

  if (face.range === 'latin') preload.unshift(`/fonts/${filename}`);
  console.log(`${filename}: ${(size / 1024).toFixed(1)}KB (copied, axes preserved)`);
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
