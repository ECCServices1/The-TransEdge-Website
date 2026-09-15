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
 * The strictest rule is the one about confirmation. A product cannot be
 * available unless somebody has ticked `priceConfirmed`, and posting cannot be
 * offered until the postage rate is confirmed. That mirrors the TBC-BSB guard
 * in check-copy.mjs: an unresolved figure that would charge a real person is a
 * build failure, not a note in a document nobody reads.
 *
 * Run: npm run check:shop
 */
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { PRODUCTS, SHIPPING, toCents, orderableSizes } from '../src/lib/shop.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'src/assets/shop');

const CATEGORIES = new Set(['apparel', 'accessory', 'print']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

/** Image basenames that actually exist, so a typo in a filename is caught. */
const present = new Set();
try {
  for (const entry of await readdir(assets)) {
    present.add(entry.slice(0, -extname(entry).length));
  }
} catch {
  /* No shop assets directory yet is fine while nothing is photographed. */
}

const problems = [];
const notes = [];

const slugs = new Map();
const skus = new Map();

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

  /* Alt text is not optional anywhere on this site, and a product photograph
     is no exception. */
  for (const [index, image] of (product.images ?? []).entries()) {
    if (!image?.file) {
      problems.push(`${where}: image ${index + 1} names no file.`);
      continue;
    }
    if (!image.alt?.trim()) {
      problems.push(`${where}: image "${image.file}" has no alt text. Describe what the photograph shows.`);
    }
    if (present.size && !present.has(image.file)) {
      problems.push(`${where}: image "${image.file}" is not in src/assets/shop. The page would fall back to an empty frame.`);
    }
  }

  if (product.category === 'apparel') {
    if (!Array.isArray(product.sizes) || product.sizes.length === 0) {
      problems.push(`${where}: apparel with no sizes. Add the size run, even if every size is out of stock.`);
    }
  }

  for (const size of product.sizes ?? []) {
    if (!size?.label?.trim()) problems.push(`${where}: a size with no label.`);
    if (typeof size?.available !== 'boolean') {
      problems.push(`${where}: size "${size?.label}" must say available true or false.`);
    }
  }

  if (product.limitPerOrder !== undefined) {
    if (!Number.isInteger(product.limitPerOrder) || product.limitPerOrder < 1) {
      problems.push(`${where}: limitPerOrder must be a whole number of at least 1.`);
    }
  }

  /* --------------------------------------------- rules about being on sale */

  if (product.available) {
    if (!product.priceConfirmed) {
      problems.push(
        `${where} is marked available but its price has not been confirmed. ` +
          `Somebody has to tick priceConfirmed before a real person can be charged it.`
      );
    }
    if (toCents(product.price) === 0) {
      problems.push(`${where} is marked available at $0.00.`);
    }
    if (product.category === 'apparel' && orderableSizes(product).length === 0) {
      problems.push(
        `${where} is marked available but every size is out of stock, so the page offers ` +
          `a product nobody can put in a basket. Mark the product unavailable instead.`
      );
    }
    if ((product.images ?? []).length === 0) {
      notes.push(`${where} is on sale with no photograph. The page shows a reserved frame.`);
    }
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

const onSale = PRODUCTS.filter((p) => p.available).length;
console.log(
  `Shop: ${PRODUCTS.length} product(s) in the catalogue, ${onSale} on sale. ` +
    `Prices are GST inclusive.`
);
for (const note of notes) console.log(`  Note: ${note}`);
