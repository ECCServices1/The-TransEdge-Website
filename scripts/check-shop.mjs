#!/usr/bin/env node
/**
 * The shop catalogue must be sane before it can be built.
 *
 * Everything checked here is something that costs real money or real trust when
 * it is wrong, and every one of them is invisible on a page that otherwise
 * looks finished: a price with three decimal places, two products sharing a
 * slug so one of them silently wins, a photograph with no alt text, a jumper
 * listed for sale with every size sold out.
 *
 * The strictest rule is the one about confirmation. A product cannot be on
 * sale unless somebody has ticked `priceConfirmed`, and posting cannot be
 * offered until the postage rate is confirmed. That mirrors the TBC-BSB guard
 * in check-copy.mjs: an unresolved figure that would charge a real person is a
 * build failure, not a note in a document nobody reads.
 *
 * Run: npm run check:shop
 */
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { PRODUCTS, SHIPPING, toCents, fitsOf, coloursOf, needsSize } from '../src/lib/shop.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'src/assets/shop');

const CATEGORIES = new Set(['apparel', 'book', 'accessory', 'print']);
const STATUSES = new Set(['hidden', 'coming-soon', 'on-sale']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const SWATCH = /^#[0-9a-f]{6}$/i;

/* The product page shows a colour's pictures, and the basket block a fit's
   sizes, with one CSS rule per choice. These are how many rules there are. */
const MAX_COLOURS = 8;
const MAX_FITS = 4;

/** Image basenames that actually exist, so a typo in a filename is caught. */
const present = new Set();
try {
  for (const entry of await readdir(assets)) {
    present.add(entry.slice(0, -extname(entry).length));
  }
} catch {
  /* No shop assets directory yet is fine while nothing is photographed. */
}

/** A valid ISBN-13: thirteen digits whose last is the check digit. */
function isIsbn13(value) {
  if (!/^\d{13}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const sum = digits.slice(0, 12).reduce((total, digit, i) => total + digit * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

const problems = [];
const notes = [];

const slugs = new Map();
const skus = new Map();

/* Alt text is not optional anywhere on this site, and a product photograph is
   no exception. */
function checkImage(where, image, index) {
  if (!image?.file) {
    problems.push(`${where}: image ${index + 1} names no file.`);
    return;
  }
  if (!image.alt?.trim()) {
    problems.push(`${where}: image "${image.file}" has no alt text. Describe what the photograph shows.`);
  }
  if (present.size && !present.has(image.file)) {
    problems.push(`${where}: image "${image.file}" is not in src/assets/shop. The page would fall back to an empty frame.`);
  }
}

for (const product of PRODUCTS) {
  const where = product.sku || product.slug || '(a product with no sku)';

  if (!SKU.test(product.sku ?? '')) {
    problems.push(`${where}: sku should be upper case letters, digits and hyphens, like TTE-TEE-001.`);
  }
  if (!SLUG.test(product.slug ?? '')) {
    problems.push(`${where}: slug "${product.slug}" must be lower case letters, digits and hyphens. It is the web address.`);
  }
  if (slugs.has(product.slug)) {
    problems.push(`${where}: slug "${product.slug}" is already used by ${slugs.get(product.slug)}. One of the two pages would silently replace the other.`);
  }
  slugs.set(product.slug, where);

  if (skus.has(product.sku)) {
    problems.push(`${where}: sku is already used by ${skus.get(product.sku)}. The basket matches on sku, so the wrong item would be sold.`);
  }
  skus.set(product.sku, where);

  if (!product.name?.trim()) problems.push(`${where}: no name.`);
  if (!product.summary?.trim()) problems.push(`${where}: no summary. It is what the range page shows under the name.`);

  if (!CATEGORIES.has(product.category)) {
    problems.push(`${where}: category "${product.category}" is not one of ${[...CATEGORIES].join(', ')}.`);
  }

  if (toCents(product.price) === null) {
    problems.push(`${where}: price "${product.price}" is not dollars and cents, like "45.00".`);
  }

  if (typeof product.priceConfirmed !== 'boolean') {
    problems.push(`${where}: priceConfirmed must be true or false.`);
  }

  /* --------------------------------------------------- where it is listed */

  if ('available' in product) {
    problems.push(`${where}: "available" was replaced by "status" (hidden, coming-soon or on-sale). Use status.`);
  }
  if (!STATUSES.has(product.status)) {
    problems.push(`${where}: status "${product.status}" is not one of ${[...STATUSES].join(', ')}.`);
  }
  if (product.statusNote !== undefined && (!product.statusNote.trim() || product.statusNote.length > 60)) {
    problems.push(`${where}: statusNote should be a few words, 60 characters at most, like "Coming soon".`);
  }

  for (const [index, image] of (product.images ?? []).entries()) checkImage(where, image, index);

  /* -------------------------------------------------------------- colours */

  const colours = coloursOf(product);
  if (colours.length > MAX_COLOURS) {
    problems.push(`${where}: ${colours.length} colours. The product page can show ${MAX_COLOURS} at most.`);
  }
  const colourNames = new Set();
  for (const colour of colours) {
    const name = colour?.name?.trim();
    if (!name) {
      problems.push(`${where}: a colour with no name.`);
      continue;
    }
    if (colourNames.has(name)) {
      problems.push(`${where}: colour "${name}" is listed twice. Orders name the colour, so each must be distinct.`);
    }
    colourNames.add(name);
    if (!SWATCH.test(colour.swatch ?? '')) {
      problems.push(`${where}: colour "${name}" needs a swatch written like #1f4d33.`);
    }
    if (typeof colour.available !== 'boolean') {
      problems.push(`${where}: colour "${name}" must say available true or false.`);
    }
    if (!Array.isArray(colour.images) || colour.images.length === 0) {
      notes.push(`${where}: colour "${name}" has no pictures, so choosing it shows an empty frame.`);
    }
    for (const [index, image] of (colour.images ?? []).entries()) {
      checkImage(`${where}, ${name}`, image, index);
    }
  }

  /* ------------------------------------------------------- fits and sizes */

  if (product.fits?.length && product.sizes?.length) {
    problems.push(`${where}: has both fits and a plain size list. Put every size run inside a fit.`);
  }
  if ((product.fits?.length ?? 0) > MAX_FITS) {
    problems.push(`${where}: ${product.fits.length} fits. The page can offer ${MAX_FITS} at most.`);
  }
  const fitNames = new Set();
  for (const fit of fitsOf(product)) {
    const label = fit.name || '(the size run)';
    if (product.fits?.length > 1 && !fit.name?.trim()) {
      problems.push(`${where}: a fit with no name. With more than one fit, each needs a name like "Women's".`);
    }
    if (fitNames.has(fit.name)) problems.push(`${where}: fit "${fit.name}" is listed twice.`);
    fitNames.add(fit.name);
    if (!Array.isArray(fit.sizes) || fit.sizes.length === 0) {
      problems.push(`${where}: fit ${label} has no sizes. List the whole run, even if every size is out of stock.`);
    }
    const labels = new Set();
    for (const size of fit.sizes ?? []) {
      if (!size?.label?.trim()) problems.push(`${where}: a size in ${label} with no label.`);
      if (labels.has(size?.label)) problems.push(`${where}: size "${size.label}" is listed twice in ${label}.`);
      labels.add(size?.label);
      if (typeof size?.available !== 'boolean') {
        problems.push(`${where}: size "${size?.label}" in ${label} must say available true or false.`);
      }
    }
  }

  if (needsSize(product) && fitsOf(product).length === 0) {
    problems.push(`${where}: clothing with no sizes. Add the size runs, even if every size is out of stock.`);
  }
  if (!needsSize(product) && fitsOf(product).length > 0) {
    problems.push(`${where}: only clothing has sizes, and this is ${product.category}.`);
  }

  /* ---------------------------------------------------------------- books */

  if (product.category === 'book') {
    if (!product.author?.trim()) problems.push(`${where}: a book with no author.`);
    if (product.isbn !== undefined && !isIsbn13(product.isbn)) {
      problems.push(`${where}: ISBN "${product.isbn}" is not a valid ISBN-13. Write the thirteen digits with no hyphens.`);
    }
  }

  if (product.limitPerOrder !== undefined) {
    if (!Number.isInteger(product.limitPerOrder) || product.limitPerOrder < 1) {
      problems.push(`${where}: limitPerOrder must be a whole number of at least 1.`);
    }
  }

  /* --------------------------------------------- rules about being on sale */

  if (product.status === 'on-sale') {
    if (!product.priceConfirmed) {
      problems.push(
        `${where} is on sale but its price has not been confirmed. ` +
          `Somebody has to tick priceConfirmed before a real person can be charged it.`
      );
    }
    if (toCents(product.price) === 0) {
      problems.push(`${where} is on sale at $0.00.`);
    }
    if (colours.length && !colours.some((colour) => colour.available)) {
      problems.push(`${where} is on sale but no colour is available. Mark it coming soon or hidden instead.`);
    }
    if (needsSize(product) && !fitsOf(product).some((fit) => fit.sizes.some((size) => size.available))) {
      problems.push(
        `${where} is on sale but every size is out of stock, so the page offers ` +
          `a product nobody can put in a basket. Mark it coming soon or hidden instead.`
      );
    }
    const pictured = (product.images ?? []).length > 0 || colours.some((colour) => colour.images?.length);
    if (!pictured) notes.push(`${where} is on sale with no photograph. The page shows a reserved frame.`);
  }
}

/* ------------------------------------------------------------- the postage */

if (toCents(SHIPPING.post?.price) === null) {
  problems.push(`Postage rate "${SHIPPING.post?.price}" is not dollars and cents, like "12.50".`);
}

if (SHIPPING.post?.priceConfirmed && toCents(SHIPPING.post.price) === 0) {
  problems.push('Postage is confirmed at $0.00. If postage really is free, say so deliberately by setting freeOver to "0.00".');
}

if (!SHIPPING.post?.priceConfirmed) {
  notes.push('Postage is not confirmed, so the shop offers collection only. Set the rate and priceConfirmed in src/data/shop/shipping.json to switch posting on.');
}

if (SHIPPING.freeOver !== null && toCents(SHIPPING.freeOver) === null) {
  problems.push(`freeOver "${SHIPPING.freeOver}" is not dollars and cents. Use null for no free threshold.`);
}

for (const key of ['collect', 'post']) {
  if (!SHIPPING[key]?.label?.trim()) problems.push(`Shipping option "${key}" has no label.`);
}

/* ------------------------------------------------------------------ report */

if (problems.length) {
  console.log(`\n${problems.length} problem(s) in the shop catalogue:\n`);
  for (const p of problems) console.log(`  ${p}\n`);
  process.exit(1);
}

const count = (status) => PRODUCTS.filter((p) => p.status === status).length;
console.log(
  `Shop: ${PRODUCTS.length} product(s) in the catalogue: ${count('on-sale')} on sale, ` +
    `${count('coming-soon')} coming soon, ${count('hidden')} hidden. Prices are GST inclusive.`
);
for (const note of notes) console.log(`  Note: ${note}`);
