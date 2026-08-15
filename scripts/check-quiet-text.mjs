#!/usr/bin/env node
/**
 * Enforces the one contrast rule the token checker structurally cannot see.
 *
 * `--color-text-subtle` is held to 3:1, not 4.5:1, and the evidence file has
 * said so since the tokens were written: "restricted to large text and to
 * non-essential metadata". It measures 3.76:1 on the canvas and 4.16:1 on a
 * raised surface, so at body size or smaller it fails SC 1.4.3.
 *
 * A rule that lives only in a document gets broken. It was broken in five
 * places, and only one of them sat on a page in the Lighthouse URL list, so CI
 * caught one instance of a defect that existed five times. Pages not on that
 * list would have shipped failing.
 *
 * The token checker compares pairs of tokens and cannot know what size the text
 * is set at. Axe knows, but only for the handful of pages CI actually renders.
 * This closes the gap: it reads the stylesheets themselves, so every usage is
 * checked whether or not the page it lives on is ever rendered.
 *
 * Run: npm run check:quiet-text
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * WCAG large text is 18pt (24px, 1.5rem) at a normal weight, or 14pt (18.66px,
 * 1.1662rem) at bold. Only tokens whose *smallest* value clears that bar are
 * safe, so a clamp() is judged by its minimum rather than its preferred size: a
 * token that is large on a desktop and small on a phone is small.
 */
const LARGE_REM = 1.5;

const SUBTLE = '--color-text-subtle';

/** @param {string} dir */
async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      yield* walk(full);
    } else if (extname(entry.name) === '.astro' || extname(entry.name) === '.css') {
      yield full;
    }
  }
}

/* ------------------------------------------------- the size of each token */

const tokensCss = await readFile(join(root, 'src/styles/tokens.css'), 'utf8');

/** @type {Map<string, number>} rem, taking the minimum of a clamp() */
const tokenRem = new Map();
for (const [, name, value] of tokensCss.matchAll(/(--text-{1,2}\d+)\s*:\s*([^;]+);/g)) {
  const rems = [...value.matchAll(/([\d.]+)rem/g)].map((m) => Number(m[1]));
  if (rems.length) tokenRem.set(name, Math.min(...rems));
}

if (!tokenRem.size) {
  console.error('Could not read the type scale from src/styles/tokens.css.');
  process.exit(1);
}

/* ------------------------------------------------------ every subtle usage */

const problems = [];

for (const dir of ['src']) {
  for await (const file of walk(join(root, dir))) {
    const rel = relative(root, file);
    const css = await readFile(file, 'utf8');

    /* Declaration blocks, shallow. Nesting is not used in this codebase's
       component styles, and a block that contains the token is all we need. */
    for (const match of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const [, selector, body] = match;
      if (!body.includes(SUBTLE)) continue;

      // Only a text colour is in scope. A border or a background painted with
      // the token is a UI component and answers to 3:1, which it meets.
      if (!new RegExp(`(?:^|[;\\s])color\\s*:[^;]*${SUBTLE}`).test(body)) continue;

      const line = css.slice(0, match.index).split('\n').length;
      const sizeToken = body.match(/font-size\s*:\s*var\(\s*(--text-{1,2}\d+)\s*\)/)?.[1];

      if (!sizeToken) {
        problems.push({
          file: `${rel}:${line}`,
          selector: selector.trim().replace(/\s+/g, ' ').slice(0, 60),
          detail:
            'sets no font-size, so it inherits body size. text-subtle is a 3:1 token and fails 4.5:1 at body size.',
        });
        continue;
      }

      const rem = tokenRem.get(sizeToken);
      if (rem === undefined) {
        problems.push({
          file: `${rel}:${line}`,
          selector: selector.trim().replace(/\s+/g, ' ').slice(0, 60),
          detail: `font-size uses ${sizeToken}, which is not in the type scale.`,
        });
      } else if (rem < LARGE_REM) {
        problems.push({
          file: `${rel}:${line}`,
          selector: selector.trim().replace(/\s+/g, ' ').slice(0, 60),
          detail: `${sizeToken} is ${rem}rem, below the ${LARGE_REM}rem large-text threshold. Use --color-text-muted.`,
        });
      }
    }
  }
}

if (problems.length) {
  console.log(`\n${problems.length} misuse(s) of ${SUBTLE}:\n`);
  for (const p of problems) {
    console.log(`  ${p.file}`);
    console.log(`    ${p.selector}`);
    console.log(`    ${p.detail}\n`);
  }
  console.log(
    'text-subtle is reserved for large text and non-essential metadata. For\n' +
      'anything at body size or smaller, --color-text-muted is the quiet tier\n' +
      'that still passes 4.5:1.'
  );
  process.exit(1);
}

console.log(`Quiet text: ${SUBTLE} is used only at large sizes.`);
