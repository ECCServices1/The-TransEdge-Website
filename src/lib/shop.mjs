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
import { variantLabel } from './variant.mjs';

export { BASKET_KEY } from './basket-key.mjs';
export { variantLabel } from './variant.mjs';

/**
 * @typedef {object} ProductSize
 * @property {string} label
 * @property {boolean} available
 *
 * A fit is one size run: "Unisex", "Women's", "Kids". Clothing that comes in a
 * single run can list `sizes` on the product instead, which reads as one fit
 * with no name. A fit can carry its own price, as kids' sizes usually do; one
 * that does not costs the product's price. The product's `priceConfirmed`
 * covers every price on it.
 *
 * @typedef {object} ProductFit
 * @property {string} name
 * @property {string} [note]   One line for the size guide.
 * @property {string} [price]  Dollars, GST included. Left out, the product's price.
 * @property {ProductSize[]} sizes
 *
 * @typedef {object} ProductImage
 * @property {string} file   Filename inside src/assets/shop, without the extension.
 * @property {string} alt    Required. An image without it fails the build.
 *
 * A colour carries its own photographs, so choosing it changes the pictures.
 * Its name is what the buyer picks and what the order and the receipt say.
 *
 * @typedef {object} ProductColour
 * @property {string} name
 * @property {string} swatch     The colour as #rrggbb, for the chooser.
 * @property {boolean} available
 * @property {ProductImage[]} images
 *
 * hidden: built, but listed nowhere. coming-soon: on the range, not for sale.
 * on-sale: on the range and in the basket, once the price is confirmed.
 *
 * @typedef {'hidden'|'coming-soon'|'on-sale'} ProductStatus
 *
 * @typedef {object} Product
 * @property {string} sku
 * @property {string} slug
 * @property {string} name
 * @property {'apparel'|'book'|'accessory'|'print'} category
 * @property {string} price            Dollars, GST included, as "45.00".
 * @property {boolean} priceConfirmed  False until a person has signed off the figure.
 * @property {ProductStatus} status
 * @property {string} [statusNote]     A few words beside the price, such as "Coming soon".
 * @property {string} [collection]     For example "RAIN 2026".
 * @property {number} order
 * @property {string} summary
 * @property {string} [description]
 * @property {string} [careNotes]
 * @property {string} [pictureNote]    Said under the pictures, such as that they are mockups.
 * @property {string} [author]         Books.
 * @property {string} [publisher]      Books.
 * @property {string} [isbn]           Books, ISBN-13.
 * @property {string} [format]         Books, such as "Paperback".
 * @property {number} [limitPerOrder]
 * @property {ProductImage[]} images   For a product without colours.
 * @property {ProductColour[]} [colours]
 * @property {ProductFit[]} [fits]
 * @property {ProductSize[]} [sizes]
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

/**
 * The price a visitor may be shown. An unconfirmed figure is never displayed:
 * a price on a page is a promise, and nobody has made this one yet.
 * @param {Product} product
 */
export const shownPriceCents = (product) =>
  product.priceConfirmed ? priceCents(product) || null : null;

/**
 * What one of a product costs in a fit: the fit's own price where it has one,
 * otherwise the product's.
 * @param {Product} product
 * @param {ProductFit|null|undefined} fit
 */
export const fitUnitCents = (product, fit) => toCents(fit?.price ?? product.price);

/**
 * The fits priced differently from the product, to be shown beside its price:
 * "Kids sizes $45.00". Confirmed prices only, like every other price a visitor
 * sees.
 * @param {Product} product
 * @returns {{ name: string, cents: number }[]}
 */
export function fitPriceNotes(product) {
  if (!product.priceConfirmed) return [];
  const base = priceCents(product);
  return fitsOf(product)
    .filter((fit) => fit.price !== undefined && toCents(fit.price) !== base)
    .map((fit) => ({ name: fit.name, cents: /** @type {number} */ (toCents(fit.price)) }));
}

/** Clothing is the only kind that needs a size. @param {Product} product */
export const needsSize = (product) => product.category === 'apparel';

/** @param {Product} product @returns {ProductColour[]} */
export const coloursOf = (product) => product.colours ?? [];

/**
 * The size runs a product comes in. A single `sizes` list reads as one fit with
 * no name, so the rest of the shop has one shape to deal with.
 * @param {Product} product
 * @returns {ProductFit[]}
 */
export function fitsOf(product) {
  if (product.fits?.length) return product.fits;
  if (product.sizes?.length) return [{ name: '', sizes: product.sizes }];
  return [];
}

/** The picture that stands for a product on the range page. @param {Product} product */
export const leadImage = (product) =>
  coloursOf(product)[0]?.images?.[0] ?? product.images?.[0] ?? null;

/** @param {Product} product */
const hasOrderableColour = (product) =>
  coloursOf(product).length === 0 || coloursOf(product).some((colour) => colour.available);

/** @param {Product} product */
const hasOrderableSize = (product) =>
  fitsOf(product).some((fit) => fit.sizes.some((size) => size.available));

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
  if (product.status !== 'on-sale' || !product.priceConfirmed) return false;
  if (!priceCents(product)) return false;
  if (!hasOrderableColour(product)) return false;
  if (needsSize(product)) return hasOrderableSize(product);
  return true;
}

/** Shown on the range page: on sale, or coming soon. @param {Product} product */
export const isListed = (product) => product.status === 'on-sale' || product.status === 'coming-soon';

/** Everything a visitor may see on the range page, in display order. */
export const listedProducts = () => PRODUCTS.filter(isListed);

/** How the range page is divided, in the order the sections appear. */
export const CATEGORY_HEADINGS = /** @type {const} */ ([
  ['apparel', 'Clothing'],
  ['book', 'Books'],
  ['accessory', 'Accessories'],
  ['print', 'Prints'],
]);

/** Listed products in their sections, leaving out any section with nothing in it. */
export const listedByCategory = () =>
  CATEGORY_HEADINGS.map(([category, heading]) => ({
    category,
    heading,
    products: listedProducts().filter((product) => product.category === category),
  })).filter((section) => section.products.length > 0);

/** Whether there is anything at all to sell. Drives the empty state. */
export const shopHasStock = () => PRODUCTS.some(isOrderable);

/**
 * @typedef {object} BasketLine
 * @property {Product} product
 * @property {string|null} colour
 * @property {string|null} fit
 * @property {string|null} size
 * @property {number} qty
 * @property {number} unitCents
 * @property {number} totalCents
 */

/**
 * What a line is called on the Stripe page and the receipt: the product, then
 * the colour, fit and size somebody chose.
 * @param {BasketLine} line
 */
export function lineName(line) {
  const variant = variantLabel(line);
  return variant ? `${line.product.name}, ${variant}` : line.product.name;
}

/**
 * Turn what a browser sent into priced lines, or refuse.
 *
 * The only things taken from the request are a sku, a colour, a fit, a size
 * label and a quantity, and each of the middle three must be one the catalogue
 * says is available. Names and prices are read from the catalogue on this side.
 * A basket that has been edited in a console gets the real price or an error,
 * never the price it asked for.
 *
 * @param {unknown} items
 * @returns {{ lines: BasketLine[], subtotalCents: number, errors: string[] }}
 */
export function validateBasket(items) {
  /** @type {string[]} */
  const errors = [];
  /** @type {BasketLine[]} */
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

    let unitCents = priceCents(product);

    /** A product sold in colours must name one we said was available. */
    let colour = null;
    const colours = coloursOf(product);
    if (colours.length) {
      const asked = typeof item?.colour === 'string' ? item.colour : '';
      const match = colours.find((c) => c.name === asked && c.available);
      if (!match) {
        errors.push(`${product.name} in ${asked || 'that colour'} is not available.`);
        continue;
      }
      colour = match.name;
    }

    /**
     * Clothing must name a size, in a fit, that we said was available. A product
     * with one fit does not need the fit named, because there is no choice.
     */
    let fit = null;
    let size = null;
    if (needsSize(product)) {
      const fits = fitsOf(product);
      const askedFit = typeof item?.fit === 'string' ? item.fit : '';
      const chosenFit = fits.find((f) => f.name === askedFit) ?? (fits.length === 1 ? fits[0] : undefined);
      const askedSize = typeof item?.size === 'string' ? item.size : '';
      const match = chosenFit?.sizes.find((s) => s.label === askedSize && s.available);
      if (!chosenFit || !match) {
        const wanted = variantLabel({ colour: null, fit: askedFit || null, size: askedSize || null });
        errors.push(`${product.name}${wanted ? `, ${wanted},` : ' in that size'} is not available.`);
        continue;
      }
      fit = chosenFit.name || null;
      size = match.label;
      /* Kids' sizes, for one, can cost less than the rest. */
      unitCents = fitUnitCents(product, chosenFit);
    }

    if (!unitCents) {
      errors.push(`${product.name} has no usable price.`);
      continue;
    }

    const limit = product.limitPerOrder ?? DEFAULT_LIMIT;
    const asked = Number(item?.qty);
    if (!Number.isInteger(asked) || asked < 1) {
      errors.push(`The quantity for ${product.name} does not make sense.`);
      continue;
    }
    const qty = Math.min(asked, limit);

    lines.push({ product, colour, fit, size, qty, unitCents, totalCents: unitCents * qty });
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
