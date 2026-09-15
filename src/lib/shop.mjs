/**
 * The shop's only understanding of money, stock and what may be bought.
 *
 * This module is imported by two very different things: the Astro pages that
 * render the shop, and the Cloudflare Worker that creates the Stripe Checkout
 * Session. That is deliberate. If the price a visitor reads and the price
 * Stripe charges came from two pieces of code, they would eventually disagree,
 * and the first anyone would know about it is a customer being charged the
 * wrong amount. There is one catalogue and one set of rules, and both sides
 * read them.
 *
 * WHY PRICES ARE STRINGS IN THE DATA AND INTEGERS EVERYWHERE ELSE
 *
 * The catalogue stores "45.00", because an editor at /admin thinks in dollars
 * and a field labelled "price in cents" is how a hooded jumper eventually goes
 * on sale for forty five cents. Everything past the parse is integer cents,
 * because money in a float is a bug waiting for a quiet afternoon: 19.99 * 100
 * is 1998.9999999999998. The parse below never multiplies a float. It splits on
 * the decimal point and adds two integers.
 *
 * GST: The Transformation Edge Ltd is registered, and every price in the
 * catalogue includes GST. The component of a GST-inclusive amount is a
 * eleventh of it, which is what `gstComponent` returns, for display only.
 * Stripe is told `tax_behavior: inclusive` and works out its own figure.
 */
import catalogue from '../data/shop/products.json' with { type: 'json' };
import shipping from '../data/shop/shipping.json' with { type: 'json' };

export { BASKET_KEY } from './basket-key.mjs';

/**
 * @typedef {object} ProductSize
 * @property {string} label
 * @property {boolean} available
 *
 * @typedef {object} ProductImage
 * @property {string} file   Filename inside src/assets/shop, without the extension.
 * @property {string} alt    Required. An image without it fails the build.
 *
 * @typedef {object} Product
 * @property {string} sku
 * @property {string} slug
 * @property {string} name
 * @property {'apparel'|'accessory'|'print'} category
 * @property {string} price            Dollars, GST included, as "45.00".
 * @property {boolean} priceConfirmed  False until a person has signed off the figure.
 * @property {boolean} available
 * @property {number} order
 * @property {string} summary
 * @property {string} [description]
 * @property {string} [careNotes]
 * @property {number} [limitPerOrder]
 * @property {ProductImage[]} images
 * @property {ProductSize[]} sizes
 */

/** How many of one line a single order may carry, when a product does not say. */
export const DEFAULT_LIMIT = 10;

/**
 * A ceiling on one basket. Not a business rule: a blunt guard so that a
 * malformed or malicious request cannot open a Stripe session for a fortune.
 * Anyone with a genuine reason to order more than this should talk to a person.
 */
export const MAX_BASKET_CENTS = 200_000;

/** GST is a tenth added, so it is an eleventh of the inclusive figure. */
const GST_DIVISOR = 11;

/** @type {Product[]} */
export const PRODUCTS = [...catalogue.products].sort(
  (a, b) => a.order - b.order || a.name.localeCompare(b.name)
);

export const SHIPPING = shipping;

/**
 * Dollars as written by an editor, to integer cents, without touching a float.
 * Returns null for anything that is not exactly digits, a point and two digits,
 * so a malformed price is a visible failure rather than a silent zero.
 * @param {string} price
 * @returns {number|null}
 */
export function toCents(price) {
  if (typeof price !== 'string') return null;
  const match = /^(\d{1,6})\.(\d{2})$/.exec(price.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}

/**
 * Integer cents as Australian currency.
 * @param {number} cents
 */
export function formatMoney(cents) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

/**
 * The GST inside a GST-inclusive amount. For display on the basket only;
 * Stripe computes the figure that appears on the receipt.
 * @param {number} cents
 */
export function gstComponent(cents) {
  return Math.round(cents / GST_DIVISOR);
}

/** @param {string} slug */
export const productBySlug = (slug) => PRODUCTS.find((p) => p.slug === slug) ?? null;

/** @param {string} sku */
export const productBySku = (sku) => PRODUCTS.find((p) => p.sku === sku) ?? null;

/** @param {Product} product */
export const priceCents = (product) => toCents(product.price);

/** @param {Product} product */
export const orderableSizes = (product) => product.sizes.filter((size) => size.available);

/**
 * Whether a product can be put in a basket at all.
 *
 * A confirmed price is part of the test. A product whose price nobody has
 * signed off is not sellable, however complete the rest of the record looks,
 * because the failure mode is charging a real person the wrong money.
 *
 * @param {Product} product
 */
export function isOrderable(product) {
  if (!product.available || !product.priceConfirmed) return false;
  if (!priceCents(product)) return false;
  if (product.category === 'apparel') return orderableSizes(product).length > 0;
  return true;
}

/** Everything a visitor may see on the range page, in display order. */
export const listedProducts = () => PRODUCTS.filter((p) => p.available);

/** Whether there is anything at all to sell. Drives the empty state. */
export const shopHasStock = () => PRODUCTS.some(isOrderable);

/**
 * Turn what a browser sent into priced lines, or refuse.
 *
 * The only things taken from the request are a sku, a size label and a
 * quantity. Names and prices are read from the catalogue on this side. A
 * basket that has been edited in a console gets the real price or an error,
 * never the price it asked for.
 *
 * @param {unknown} items
 * @returns {{ lines: {product: Product, size: string|null, qty: number, unitCents: number, totalCents: number}[], subtotalCents: number, errors: string[] }}
 */
export function validateBasket(items) {
  /** @type {string[]} */
  const errors = [];
  /** @type {{product: Product, size: string|null, qty: number, unitCents: number, totalCents: number}[]} */
  const lines = [];

  if (!Array.isArray(items) || items.length === 0) {
    return { lines, subtotalCents: 0, errors: ['There is nothing in the basket.'] };
  }

  if (items.length > 30) {
    return { lines, subtotalCents: 0, errors: ['That is more separate items than we can take in one order.'] };
  }

  for (const item of items) {
    const sku = typeof item?.sku === 'string' ? item.sku : '';
    const product = productBySku(sku);

    if (!product) {
      errors.push(`We no longer have ${sku || 'one of these items'}.`);
      continue;
    }

    if (!isOrderable(product)) {
      errors.push(`${product.name} is not available at the moment.`);
      continue;
    }

    const unitCents = priceCents(product);
    if (!unitCents) {
      errors.push(`${product.name} has no usable price.`);
      continue;
    }

    /** Apparel must name a size, and it must be one we said was available. */
    let size = null;
    if (product.category === 'apparel') {
      size = typeof item?.size === 'string' ? item.size : '';
      const match = orderableSizes(product).find((s) => s.label === size);
      if (!match) {
        errors.push(`${product.name} in size ${size || 'unspecified'} is not available.`);
        continue;
      }
      size = match.label;
    }

    const limit = product.limitPerOrder ?? DEFAULT_LIMIT;
    const asked = Number(item?.qty);
    if (!Number.isInteger(asked) || asked < 1) {
      errors.push(`The quantity for ${product.name} does not make sense.`);
      continue;
    }
    const qty = Math.min(asked, limit);

    lines.push({ product, size, qty, unitCents, totalCents: unitCents * qty });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);

  if (subtotalCents > MAX_BASKET_CENTS) {
    errors.push('That order is larger than we can take online. Please call us and we will sort it out.');
  }

  return { lines, subtotalCents, errors };
}

/**
 * What delivery costs, and what to call it.
 *
 * Collection is free and collects no address, which is both the cheaper option
 * for a visitor and the smaller amount of personal information for us to hold.
 *
 * @param {'collect'|'post'} fulfilment
 * @param {number} subtotalCents
 * @returns {{ key: 'collect'|'post', label: string, cents: number, note: string, free: boolean }|null}
 */
export function shippingOption(fulfilment, subtotalCents) {
  if (fulfilment === 'collect') {
    return {
      key: 'collect',
      label: SHIPPING.collect.label,
      cents: 0,
      note: SHIPPING.collect.note,
      free: true,
    };
  }

  if (fulfilment !== 'post') return null;

  const rate = toCents(SHIPPING.post.price);
  if (rate === null) return null;

  const threshold = SHIPPING.freeOver ? toCents(SHIPPING.freeOver) : null;
  const free = threshold !== null && subtotalCents >= threshold;

  return {
    key: 'post',
    label: SHIPPING.post.label,
    cents: free ? 0 : rate,
    note: SHIPPING.post.note,
    free,
  };
}

/** Whether posting is set up at all. False while the rate is unconfirmed. */
export const postingAvailable = () =>
  SHIPPING.post.priceConfirmed === true && toCents(SHIPPING.post.price) !== null;
