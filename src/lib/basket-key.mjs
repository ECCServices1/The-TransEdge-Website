/**
 * Where the basket lives in the browser.
 *
 * Its own module because the client scripts need it and nothing else. Importing
 * it from src/lib/shop.mjs would pull the whole catalogue and the shipping
 * table into every page's JavaScript bundle to read one string.
 *
 * Versioned, so that changing the shape of a basket item cannot resurrect an
 * incompatible basket somebody left in their browser six months ago.
 */
export const BASKET_KEY = 'tte-basket-v1';
