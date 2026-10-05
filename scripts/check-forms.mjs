#!/usr/bin/env node
/**
 * The website's forms must be able to deliver where they say they deliver.
 *
 * Every rule here guards a failure that is silent in the most expensive way: a
 * visitor sees a thank-you page, or a not-sent page, and nobody at the church
 * ever learns a message was lost.
 *
 * - A destination in src/data/forms.mjs that is missing from the email
 *   binding's allowlist in wrangler.jsonc. Cloudflare refuses the send at
 *   runtime, and only the Worker's log would know.
 * - The reverse: an address the binding may email that no form uses. That is
 *   permission nobody asked for, and permission is what the allowlist exists to
 *   withhold.
 * - The sender missing from the binding's sender list.
 * - A page using a form name that has no destination, or a thank-you page that
 *   does not exist.
 *
 * The Turnstile site key still being the placeholder is reported, not failed:
 * the site has to keep building while the key is being arranged, and until it
 * is set the forms say plainly that they did not send.
 *
 * Run: npm run check:forms
 */
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { FORMS, FORM_SENDER, NOT_SENT, TURNSTILE_SITE_KEY } from '../src/data/forms.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const notes = [];

/**
 * JSONC to JSON: drop comments, but not the contents of strings, which may
 * legitimately contain slashes.
 * @param {string} text
 */
function stripComments(text) {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 1;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
      out += '\n';
    } else if (ch === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1;
      i += 1;
    } else {
      out += ch;
    }
  }
  /* Trailing commas are legal in JSONC and not in JSON. */
  return out.replace(/,(\s*[}\]])/g, '$1');
}

const wrangler = JSON.parse(stripComments(await readFile(join(root, 'wrangler.jsonc'), 'utf8')));
const binding = (wrangler.send_email ?? []).find((b) => b.name === 'EMAIL');

if (!binding) {
  problems.push('wrangler.jsonc has no send_email binding named EMAIL, so no form can send.');
} else {
  const allowed = new Set(binding.allowed_destination_addresses ?? []);
  const used = new Set(Object.values(FORMS).map((f) => f.to));

  for (const address of used) {
    if (!allowed.has(address)) {
      problems.push(
        `${address} is a form destination in src/data/forms.mjs but not in the EMAIL binding's ` +
          `allowed_destination_addresses in wrangler.jsonc. Cloudflare would refuse every send to it.`
      );
    }
  }
  for (const address of allowed) {
    if (!used.has(address)) {
      problems.push(
        `${address} may be emailed by the Worker but no form delivers to it. ` +
          `Remove it from wrangler.jsonc, or route a form to it in src/data/forms.mjs.`
      );
    }
  }
  if (!(binding.allowed_sender_addresses ?? []).includes(FORM_SENDER.email)) {
    problems.push(
      `${FORM_SENDER.email} is the forms' sender but is not in the EMAIL binding's allowed_sender_addresses.`
    );
  }
}

/* Every form a page declares must have somewhere to go. */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.astro')) yield full;
  }
}

const declared = new Set();
for await (const file of walk(join(root, 'src/pages'))) {
  const text = await readFile(file, 'utf8');
  for (const [, name] of text.matchAll(/<FormProtection\s+form="([^"]+)"/g)) {
    declared.add(name);
    if (!FORMS[name]) {
      problems.push(`${file.slice(root.length + 1)} uses form "${name}", which has no entry in src/data/forms.mjs.`);
    }
  }
}
for (const name of Object.keys(FORMS)) {
  if (!declared.has(name)) notes.push(`Form "${name}" has a destination but no page uses it.`);
}

/* Every page the Worker redirects to must exist. */
const routes = new Set([NOT_SENT, ...Object.values(FORMS).map((f) => f.sent)]);
for (const route of routes) {
  const source = join(root, 'src/pages', `${route.replace(/^\//, '')}.astro`);
  try {
    await access(source);
  } catch {
    problems.push(`The Worker sends people to ${route}, but there is no src/pages${route}.astro.`);
  }
}

if (/NOT_SET/.test(TURNSTILE_SITE_KEY)) {
  notes.push(
    'The Turnstile site key is still the placeholder, so the forms cannot be sent yet. ' +
      'Set TURNSTILE_SITE_KEY in src/data/forms.mjs: docs/forms.md.'
  );
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s) with the website forms:\n`);
  for (const p of problems) console.log(`  ${p}\n`);
  process.exit(1);
}

const destinations = [...new Set(Object.values(FORMS).map((f) => f.to))].join(' and ');
console.log(`Forms: ${Object.keys(FORMS).length} forms deliver to ${destinations}, and the email binding allows exactly those.`);
for (const note of notes) console.log(`  Note: ${note}`);
