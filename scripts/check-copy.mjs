#!/usr/bin/env node
/**
 * Enforces the "do not ship" list in section 22 and the positioning rule in
 * section 3, across source and content.
 *
 * These are the rules most likely to be broken quietly, months from now, by
 * someone who never read the brief. A linter is the only version of a style
 * rule that survives contact with a real content team.
 *
 * Run: npm run check:copy
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

import { VISION, MISSION, TAGLINE } from '../src/data/church.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCAN_DIRS = ['src', 'content'];
const SCAN_EXT = new Set(['.astro', '.md', '.mdx', '.mjs', '.js', '.ts', '.json', '.css', '.yml']);

/** Files that legitimately contain the strings the rules forbid. */
const EXEMPT = [
  'scripts/check-copy.mjs',
  'src/data/church.mjs', // holds the locked copy, em-dash and all
  'src/data/redirects.mjs', // must name the Elvanto routes in order to retire them
];

/**
 * @typedef {object} Rule
 * @property {string} id
 * @property {RegExp} pattern
 * @property {string} message
 * @property {'error'|'warn'} level
 * @property {string[]} [exempt]
 */

/** @type {Rule[]} */
const RULES = [
  {
    id: 'suburb-first-positioning',
    pattern: /\b(?:church|community)\s+in\s+Jamisontown\b/i,
    message:
      'Suburb-first positioning. TTE is a church in Penrith, Sydney, with a vision that reaches nations. Jamisontown belongs in an address block, a map, an event location or structured data only.',
    level: 'error',
  },
  {
    id: 'multicultural-headline',
    pattern: /\bmulticultural\s+church\b/i,
    message:
      'Multicultural describes the community, not the headline positioning. Section 3.',
    level: 'error',
  },
  {
    id: 'em-dash-in-new-copy',
    pattern: /—/,
    message:
      'Em-dash in new copy. Use a comma, a semicolon or a full stop. The locked vision and mission keep their original punctuation and live in src/data/church.mjs.',
    level: 'error',
  },
  {
    id: 'elvanto-retired',
    pattern: /elvanto/i,
    message:
      'Elvanto is retired entirely. Link to the TTE Connect Hub instead. Section 11.',
    level: 'error',
  },
  {
    id: 'wix-login',
    pattern: /wix.{0,20}log\s?in|log\s?in.{0,20}wix/i,
    message: 'The Wix Log In control is removed. Connect replaces it. Section 11.',
    level: 'error',
  },
  {
    id: 'card-capture',
    pattern: /\b(?:card\s?number|cardnumber|cvv|cvc|expiry\s?date)\b/i,
    message:
      'No card capture on the marketing site. Card giving hands off to Stripe inside Connect. Section 13.',
    level: 'error',
  },
  {
    id: 'implied-deductibility',
    pattern: /tax[- ]deductible/i,
    message:
      'Tax deductibility must never be implied for church giving. It applies to ECCS DGR giving only, which is a separate flow with separate receipting. Confirm the context is ECCS before allowing this. Section 13.',
    level: 'warn',
  },
  {
    id: 'clinical-claim-for-pastoral-care',
    pattern: /\b(?:therapy|therapeutic|treatment|counsell?ing|clinical|diagnos)\w*\b/i,
    message:
      'Possible clinical or therapeutic claim. Pastoral care is not clinical treatment. Renovate Health is a separate practice and is linked, not absorbed. Section 7 and section 22.',
    level: 'warn',
  },
  {
    id: 'ai-driven',
    pattern: /\bAI[- ]driven\b/i,
    message: 'Do not describe any TTE platform as AI-driven.',
    level: 'error',
  },
  {
    id: 'urgency-giving',
    pattern: /\b(?:only \d+ (?:days|hours) left|donate now before|last chance|don't miss out)\b/i,
    message: 'No guilt-based or urgency-based giving copy. Section 22.',
    level: 'error',
  },
  {
    id: 'unresolved-placeholder',
    pattern: /\bTBC-(?:BSB|ACCOUNT)\b/,
    message:
      'Bank details are still placeholders. This is a launch blocker: the Give page cannot go live without confirmed account details.',
    level: 'warn',
  },
  {
    id: 'tagline-case',
    pattern: /A Change is Inevitable/,
    message:
      'The tagline is set in sentence case with no full stop, matching the supplied lockup artwork: "A change is inevitable".',
    level: 'error',
  },
];

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
      if (entry.name === 'node_modules' || entry.name === 'fonts') continue;
      yield* walk(full);
    } else if (SCAN_EXT.has(extname(entry.name))) {
      yield full;
    }
  }
}

const problems = [];
const warnings = [];

for (const dir of SCAN_DIRS) {
  for await (const file of walk(join(root, dir))) {
    const rel = relative(root, file);
    if (EXEMPT.includes(rel)) continue;

    const text = await readFile(file, 'utf8');
    const lines = text.split('\n');

    for (const rule of RULES) {
      if (rule.exempt?.includes(rel)) continue;
      lines.forEach((line, index) => {
        // A line that opts out explicitly is allowed, so a genuine exception
        // is visible in the diff rather than achieved by editing this file.
        if (line.includes('check-copy-ignore')) return;

        // Comments are not copy. A note explaining why a rule exists should not
        // trip the rule it explains, and a warning list that is mostly its own
        // documentation is a warning list nobody reads.
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

        if (rule.pattern.test(line)) {
          const entry = {
            file: `${rel}:${index + 1}`,
            rule: rule.id,
            message: rule.message,
            excerpt: line.trim().slice(0, 110),
          };
          (rule.level === 'error' ? problems : warnings).push(entry);
        }
      });
    }
  }
}

/* The locked copy must survive byte for byte. */
const lockedChecks = [
  ['VISION', VISION, 'generously impact nations'],
  ['MISSION', MISSION, 'youthful, creative, and purpose-driven'],
  ['TAGLINE', TAGLINE, 'A change is inevitable'],
];
for (const [name, value, mustContain] of lockedChecks) {
  if (!value.includes(mustContain)) {
    problems.push({
      file: 'src/data/church.mjs',
      rule: 'locked-copy-altered',
      message: `The locked ${name} no longer contains "${mustContain}". Locked copy may not be rephrased, shortened or modernised. Section 2.`,
      excerpt: value.slice(0, 110),
    });
  }
}

const report = (list, label) => {
  if (!list.length) return;
  console.log(`\n${label}:`);
  for (const p of list) {
    console.log(`  ${p.file}`);
    console.log(`    [${p.rule}] ${p.message}`);
    console.log(`    > ${p.excerpt}`);
  }
};

report(warnings, `${warnings.length} warning(s), review each in context`);
report(problems, `${problems.length} error(s)`);

if (!problems.length && !warnings.length) {
  console.log('Copy rules: clean.');
} else if (!problems.length) {
  console.log(`\nCopy rules: no errors. ${warnings.length} warning(s) need a human eye.`);
}

process.exit(problems.length ? 1 : 0);
