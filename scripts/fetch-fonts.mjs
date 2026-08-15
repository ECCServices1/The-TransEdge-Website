#!/usr/bin/env node
/**
 * Vendors the typeface files into public/fonts/ and writes the @font-face
 * stylesheets into public/fonts/css/, one per script.
 *
 * Why self-host rather than link a CDN:
 *   - the Content-Security-Policy is font-src 'self', with no third-party origin
 *   - a font request to a third party is a personal-data disclosure under the
 *     Australian Privacy Principles, made before the visitor consents to anything
 *   - one fewer connection on the critical path, which is where LCP is won
 *
 * Every family here is under the SIL Open Font Licence 1.1, so there is no
 * per-domain licence to track and no cost line. See docs/typography.md.
 *
 * Google's API returns files already split by unicode-range. That split is kept,
 * because it is what stops an Arabic visitor downloading Devanagari and a
 * Japanese visitor downloading the whole CJK set at once.
 *
 * Run: node scripts/fetch-fonts.mjs [family-key ...]
 */
import { writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = join(root, 'public', 'fonts');
/* The per-script stylesheets are served, not bundled, so a page can link only
   the script it needs. Bundling them all would put a hundred and twenty CJK
   @font-face rules into the CSS of every English page. */
const CSS_DIR = join(root, 'public', 'fonts', 'css');

/** Chrome UA, which is what makes the API serve woff2 and variable axes. */
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * `stylesheet` is the file written to public/fonts/css/, which decides what
 * loads per locale. Latin loads on every page. Every other script loads only
 * on the locale that needs it.
 *
 * `include` keeps only the named subsets listed. `exclude` drops them. The
 * non-Latin families exclude the Latin ranges because Inter already covers
 * them, and two faces competing for the same codepoints is how mixed strings
 * end up with mismatched digits.
 */
const LATIN_SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'vietnamese'];

const FAMILIES = {
  fraunces: {
    query: 'Fraunces:opsz,wght@9..144,300..700',
    stylesheet: 'latin',
    script: 'latin',
    include: ['latin', 'latin-ext'],
    note: 'Display face. Variable optical size and weight.',
  },
  inter: {
    query: 'Inter:wght@300..700',
    stylesheet: 'latin',
    script: 'latin',
    include: ['latin', 'latin-ext'],
    note: 'Text face. Variable weight.',
  },
  'noto-arabic': {
    query: 'Noto+Sans+Arabic:wght@300..700',
    stylesheet: 'arabic',
    script: 'arabic',
    include: ['arabic'],
    note: 'Arabic text and display. Right-to-left launch locale.',
  },
  'noto-devanagari': {
    query: 'Noto+Sans+Devanagari:wght@300..700',
    stylesheet: 'devanagari',
    script: 'devanagari',
    include: ['devanagari'],
    note: 'Hindi.',
  },
  'noto-sc': {
    query: 'Noto+Sans+SC:wght@300..700',
    stylesheet: 'sc',
    script: 'sc',
    exclude: LATIN_SUBSETS,
    note: 'Mandarin, Simplified Chinese. Around a hundred unicode-range slices.',
  },
  'noto-jp': {
    query: 'Noto+Sans+JP:wght@300..700',
    stylesheet: 'jp',
    script: 'jp',
    exclude: LATIN_SUBSETS,
    note: 'Japanese. Around a hundred unicode-range slices.',
  },
  'noto-kr': {
    query: 'Noto+Sans+KR:wght@300..700',
    stylesheet: 'kr',
    script: 'kr',
    exclude: LATIN_SUBSETS,
    note: 'Korean. Around a hundred unicode-range slices.',
  },
};

/** @param {string} url */
async function get(url, asBuffer = false) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.text();
}

/**
 * Splits the returned CSS into @font-face blocks, labelling each with the
 * subset comment that precedes it.
 *
 * Google labels the alphabetic subsets (`/* latin *\/`) but ships the CJK
 * ranges as an unlabelled run of around a hundred blocks. Keying off the
 * comment alone silently drops every CJK range and leaves a stylesheet that
 * looks complete while containing no Chinese, Japanese or Korean glyphs at all.
 * So blocks are matched first and labelled second, and an unlabelled block is
 * kept under the family's own script name.
 *
 * @param {string} css
 * @param {string} fallbackLabel
 */
function parseBlocks(css, fallbackLabel) {
  const blocks = [];
  let label = fallbackLabel;
  let unlabelled = 0;

  // Comments and font-face rules, matched in document order so each rule takes
  // the most recent preceding label.
  const re = /\/\*\s*([^*]+?)\s*\*\/|@font-face\s*\{[^}]*\}/g;

  for (const match of css.matchAll(re)) {
    if (match[1] !== undefined) {
      label = match[1];
      continue;
    }
    const rule = match[0];
    const url = rule.match(/url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) continue;

    // A run of unlabelled blocks all inherit the last comment, so they are
    // numbered to keep filenames unique.
    const isNamed = label !== fallbackLabel;
    blocks.push({
      subset: isNamed ? label : `${fallbackLabel}-${unlabelled}`,
      family: isNamed ? label : fallbackLabel,
      rule,
      url,
    });
    if (!isNamed) unlabelled += 1;
  }

  return blocks;
}

const requested = process.argv.slice(2);
const keys = requested.length ? requested : Object.keys(FAMILIES);

await mkdir(FONT_DIR, { recursive: true });
await mkdir(CSS_DIR, { recursive: true });

/** @type {Record<string, string[]>} */
const sheets = {};
let totalBytes = 0;
let totalFiles = 0;
/** Every filename written, used to build the preload manifest. */
const downloaded = [];

for (const key of keys) {
  const family = FAMILIES[key];
  if (!family) {
    console.error(`Unknown family "${key}". Known: ${Object.keys(FAMILIES).join(', ')}`);
    process.exit(1);
  }

  const css = await get(`https://fonts.googleapis.com/css2?family=${family.query}&display=swap`);
  const blocks = parseBlocks(css, family.script);

  const wanted = blocks.filter((b) => {
    if (family.include) return family.include.includes(b.family);
    if (family.exclude) return !family.exclude.includes(b.family);
    return true;
  });

  if (!wanted.length) {
    console.error(`${key}: no subsets matched. The upstream stylesheet format has changed.`);
    process.exit(1);
  }

  console.log(`${key}: ${wanted.length} of ${blocks.length} subset files`);

  const rules = [];
  for (const [index, blk] of wanted.entries()) {
    const filename = `${key}-${blk.subset}-${index}.woff2`;
    const target = join(FONT_DIR, filename);

    let bytes;
    try {
      const existing = await stat(target);
      bytes = existing.size;
    } catch {
      const buffer = await get(blk.url, true);
      await writeFile(target, buffer);
      bytes = buffer.length;
    }

    totalBytes += bytes;
    totalFiles += 1;
    downloaded.push(filename);

    rules.push(
      blk.rule
        .replace(/url\(https:\/\/[^)]+\)/, `url('/fonts/${filename}')`)
        .replace(/\n\s*/g, '\n  ')
    );
  }

  sheets[family.stylesheet] ??= [];
  sheets[family.stylesheet].push(`/* ${key}: ${family.note} SIL Open Font Licence 1.1. */`, ...rules);
}

for (const [name, rules] of Object.entries(sheets)) {
  const header = `/* Generated by scripts/fetch-fonts.mjs. Do not edit.\n   All families SIL Open Font Licence 1.1. */\n\n`;
  await writeFile(join(CSS_DIR, `${name}.css`), header + rules.join('\n\n') + '\n', 'utf8');
  console.log(`wrote public/fonts/css/${name}.css`);
}

/*
  The two Latin faces are on the critical path for every page, so they are
  preloaded. Filenames carry an index that shifts if upstream reorders its
  subsets, so the layout reads them from this manifest rather than hard-coding
  a name that would silently stop preloading anything.
*/
const preload = downloaded
  .filter((f) => /^(inter|fraunces)-latin-/.test(f) && !f.includes('latin-ext'))
  .map((f) => `/fonts/${f}`)
  .sort();

await writeFile(join(CSS_DIR, 'preload.json'), JSON.stringify(preload, null, 2) + '\n', 'utf8');
console.log(`wrote public/fonts/css/preload.json (${preload.length} files)`);

console.log(
  `\n${totalFiles} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB on disk. ` +
    `A visitor downloads only the subsets their text actually uses.`
);
