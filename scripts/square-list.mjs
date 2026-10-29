#!/usr/bin/env node
/**
 * What to set up in Square's item library so the website can read its stock:
 * one item per product, one variation per colour and size, each variation's
 * SKU set to the code printed here. `npm run shop:square-list` prints it.
 *
 * The price column is for whoever sells at the welcome desk with Square. The
 * website does not read prices from Square: it sends the catalogue's price with
 * every order, so changing a price at /admin is enough for online orders.
 */
import { stockVariants, formatMoney, variantLabel } from '../src/lib/shop.mjs';

/** @type {Map<string, ReturnType<typeof stockVariants>>} */
const byProduct = new Map();
for (const variant of stockVariants()) {
  const list = byProduct.get(variant.product.name) ?? [];
  list.push(variant);
  byProduct.set(variant.product.name, list);
}

console.log('| Item in Square | Variation | SKU | Price |');
console.log('|---|---|---|---|');
for (const [name, variants] of byProduct) {
  for (const variant of variants) {
    console.log(`| ${name} | ${variantLabel(variant)} | \`${variant.code}\` | ${formatMoney(variant.unitCents)} |`);
  }
}
console.log(`\n${stockVariants().length} variations in ${byProduct.size} items.`);
