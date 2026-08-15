#!/usr/bin/env node
/**
 * Verifies every semantic colour pairing in src/styles/tokens.css against
 * WCAG 2.2, in both schemes, and writes the evidence table CI keeps.
 *
 * "Accessibility is the floor" only means something if it is measured, so this
 * runs in CI and fails the build rather than producing a warning nobody reads.
 *
 *   Text and images of text          4.5:1   (SC 1.4.3)
 *   Large text, 24px or 18.66px bold 3:1     (SC 1.4.3)
 *   UI components and graphics       3:1     (SC 1.4.11)
 *
 * Run: npm run tokens:contrast
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { contrast, grade } from './lib/colour.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = join(root, 'src', 'styles', 'tokens.css');
const EVIDENCE = join(root, 'docs', 'colour-contrast-evidence.md');

const css = await readFile(TOKENS, 'utf8');

/** Pulls a `selector { ... }` declaration block out of the stylesheet. */
function block(selectorPattern) {
  const re = new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  if (!match) throw new Error(`Could not find the ${selectorPattern} block in tokens.css`);
  return match[1];
}

/** @param {string} text */
function declarations(text) {
  /** @type {Record<string,string>} */
  const out = {};
  for (const [, name, value] of text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const lightScope = declarations(block(':root'));
const darkScope = declarations(block('\\.theme-dark'));
const darkMediaScope = declarations(block(':root:not\\(\\.theme-light\\)'));

/**
 * The class-based dark scope and the media-query dark scope must stay
 * identical, or a visitor's explicit theme choice silently renders differently
 * from the system-driven one. This is the drift check for that.
 */
const drift = [];
const darkKeys = new Set([...Object.keys(darkScope), ...Object.keys(darkMediaScope)]);
for (const key of darkKeys) {
  if (darkScope[key] !== darkMediaScope[key]) {
    drift.push(`${key}: .theme-dark has "${darkScope[key] ?? 'nothing'}", the media query has "${darkMediaScope[key] ?? 'nothing'}"`);
  }
}

const light = { ...lightScope };
const dark = { ...lightScope, ...darkScope };

/**
 * Resolves a token to a hex value, following var() chains.
 * @param {Record<string,string>} scope
 * @param {string} name
 */
function resolve(scope, name, depth = 0) {
  if (depth > 12) throw new Error(`var() chain too deep resolving ${name}`);
  const value = scope[name];
  if (!value) throw new Error(`Unknown token ${name}`);
  const varRef = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (varRef) return resolve(scope, varRef[1], depth + 1);
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  throw new Error(`Token ${name} resolves to "${value}", which is not a plain colour and cannot be tested`);
}

/**
 * Pairings the design system guarantees. A pairing that is not listed here is
 * not guaranteed, which is the point: components use these combinations.
 *
 * kind: 'text' 4.5:1 | 'large' 3:1 | 'ui' 3:1
 */
const PAIRINGS = [
  ['--color-text', '--color-canvas', 'text', 'Body copy on the page canvas'],
  ['--color-text', '--color-canvas-raised', 'text', 'Body copy on a raised surface'],
  ['--color-text', '--color-canvas-sunken', 'text', 'Body copy on a sunken surface'],
  ['--color-text-muted', '--color-canvas', 'text', 'Secondary copy on the canvas'],
  ['--color-text-muted', '--color-canvas-raised', 'text', 'Secondary copy on a raised surface'],
  ['--color-text-subtle', '--color-canvas', 'large', 'Captions and metadata, large or non-essential only'],
  ['--color-text-accent', '--color-canvas', 'text', 'Accent copy and inline links on the canvas'],
  ['--color-text-accent', '--color-canvas-raised', 'text', 'Accent copy on a raised surface'],
  ['--color-text-anchor', '--color-canvas', 'text', 'Anchor-coloured copy on the canvas'],
  ['--color-text-inverse', '--color-canvas-inverse', 'text', 'Copy on the inverted surface'],

  ['--color-action-fg', '--color-action-bg', 'text', 'Primary button label, resting'],
  ['--color-action-fg', '--color-action-bg-hover', 'text', 'Primary button label, hover'],
  ['--color-action-fg', '--color-action-bg-active', 'text', 'Primary button label, active'],
  ['--color-action-quiet-fg', '--color-canvas', 'text', 'Quiet button label on the canvas'],
  ['--color-action-quiet-border', '--color-canvas', 'ui', 'Quiet button outline, SC 1.4.11'],

  ['--color-action-bg', '--color-canvas', 'ui', 'Primary button surface against the canvas'],
  ['--color-border-strong', '--color-canvas', 'ui', 'Input and control borders, SC 1.4.11'],
  ['--color-focus', '--color-canvas', 'ui', 'Focus ring against the canvas, SC 1.4.11'],
  ['--color-focus', '--color-canvas-raised', 'ui', 'Focus ring against a raised surface'],
  ['--color-seam-lit', '--color-canvas', 'ui', 'The lit seam where it carries meaning'],

  ['--color-success-fg', '--color-success-bg', 'text', 'Success message'],
  ['--color-warning-fg', '--color-warning-bg', 'text', 'Warning message'],
  ['--color-danger-fg', '--color-danger-bg', 'text', 'Error message and form validation'],
];

const THRESHOLD = { text: 4.5, large: 3, ui: 3 };

/** @param {'light'|'dark'} schemeName */
function run(schemeName, scope) {
  return PAIRINGS.map(([fg, bg, kind, description]) => {
    const fgHex = resolve(scope, fg);
    const bgHex = resolve(scope, bg);
    const ratio = contrast(fgHex, bgHex);
    return {
      scheme: schemeName,
      fg,
      bg,
      fgHex,
      bgHex,
      kind,
      description,
      ratio,
      required: THRESHOLD[kind],
      pass: ratio >= THRESHOLD[kind],
    };
  });
}

const results = [...run('light', light), ...run('dark', dark)];
const failures = results.filter((r) => !r.pass);

/* ---------------------------------------------------------------- evidence */

const rows = (scheme) =>
  results
    .filter((r) => r.scheme === scheme)
    .map(
      (r) =>
        `| ${r.description} | \`${r.fg.replace('--color-', '')}\` ${r.fgHex} | \`${r.bg.replace('--color-', '')}\` ${r.bgHex} | ${r.ratio.toFixed(2)}:1 | ${r.required}:1 | ${grade(r.ratio)} | ${r.pass ? 'pass' : 'FAIL'} |`
    )
    .join('\n');

const header =
  '| Pairing | Foreground | Background | Measured | Required | Grade | Result |\n|---|---|---|---|---|---|---|';

const doc = `# Colour contrast evidence

Generated by \`npm run tokens:contrast\` from \`src/styles/tokens.css\`. Do not edit by hand.

Thresholds are WCAG 2.2: 4.5:1 for text (SC 1.4.3), 3:1 for large text and for
user interface components and graphical objects (SC 1.4.11).

Ratios are computed from the sRGB relative luminance formula in the WCAG
definition, not estimated.

**Result: ${failures.length === 0 ? 'all ' + results.length + ' guaranteed pairings pass.' : failures.length + ' of ' + results.length + ' pairings fail.'}**

## Light scheme

${header}
${rows('light')}

## Dark scheme

${header}
${rows('dark')}

## Notes

- \`--color-border\` is decorative hairline separation and is deliberately below
  3:1. Anything that carries state or meaning uses \`--color-border-strong\`.
- \`--color-text-subtle\` is held to 3:1 and is restricted to large text and to
  metadata that is repeated elsewhere in accessible form. It is never the only
  place a fact appears.
- Colour is never the sole carrier of meaning. Status pairs colour with an icon
  and a word, per section 18 of the brief.
- Accent text is guaranteed on \`canvas\` and \`canvas-raised\` only. On
  \`canvas-sunken\` it falls below 4.5:1, so sunken surfaces use \`--color-text\`.
`;

await mkdir(dirname(EVIDENCE), { recursive: true });
await writeFile(EVIDENCE, doc, 'utf8');

/* ------------------------------------------------------------------ report */

for (const r of results) {
  const status = r.pass ? 'ok  ' : 'FAIL';
  console.log(
    `${status} [${r.scheme}] ${r.ratio.toFixed(2).padStart(5)}:1 (need ${r.required}) ${r.fg} on ${r.bg}`
  );
}

if (drift.length) {
  console.error('\nDark scheme drift between .theme-dark and the prefers-color-scheme block:');
  for (const d of drift) console.error(`  - ${d}`);
}

console.log(`\nEvidence written to docs/colour-contrast-evidence.md`);

if (failures.length || drift.length) {
  console.error(`\n${failures.length} contrast failure(s), ${drift.length} drift issue(s).`);
  process.exit(1);
}

console.log(`All ${results.length} guaranteed pairings pass in both schemes.`);
