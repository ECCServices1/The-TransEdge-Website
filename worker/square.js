/**
 * Square: where the shop's stock is kept, and how the Worker reads it.
 *
 * Square is the stock book (client, 29 October 2026). Each colour and size is
 * an item variation in TTE's Square item library, with stock tracked there and
 * its SKU set to the code the website gives it (stockCode in
 * src/lib/variant.mjs). Whoever does the stocktake changes the numbers in
 * Square's app or Dashboard; Square emails a low-stock alert; and a sale at the
 * welcome desk through Square counts down the same stock as a sale online.
 *
 * The website only reads. It looks up the variations whose SKU it knows, and
 * their stock at TTE's location, so a product page can say a size is gone or
 * nearly gone, and the checkout can refuse more than there is. Anything not set
 * up in Square, or with its stock not tracked there, is simply unknown, and the
 * shop treats it exactly as it did before: the ticks at /admin decide.
 */
import { stockVariants } from '../src/lib/shop.mjs';

/* SQUARE_ENVIRONMENT=sandbox points at Square's test system, for a test
   purchase with a sandbox token. Anything else is the real one. */
const SQUARE_HOST = {
  production: 'https://connect.squareup.com',
  sandbox: 'https://connect.squareupsandbox.com',
};

/* Pinned rather than left to the account's default, so a change on Square's
   side cannot quietly change what these fields mean. */
export const SQUARE_VERSION = '2026-09-16';

/** @param {Record<string, string | undefined>} env */
export const squareConfigured = (env) => Boolean(env.SQUARE_ACCESS_TOKEN && env.SQUARE_LOCATION_ID);

/**
 * @param {Record<string, string | undefined>} env
 * @param {string} path
 */
export const squareUrl = (env, path) =>
  new URL(path, env.SQUARE_ENVIRONMENT === 'sandbox' ? SQUARE_HOST.sandbox : SQUARE_HOST.production).toString();

/** @param {Record<string, string | undefined>} env */
export const squareHeaders = (env) => ({
  authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
  'content-type': 'application/json',
  'square-version': SQUARE_VERSION,
});

/**
 * @typedef {object} HeldStock
 * @property {string} id         The variation's id in Square's item library.
 * @property {boolean} tracked   Whether Square is counting its stock.
 * @property {number} quantity   In stock at TTE's location. Zero when untracked.
 */

/**
 * Every variation in Square whose SKU is one of ours, with its stock. Null
 * when Square could not be read, which callers treat as "unknown", never as
 * "none left": a slow Square should not close the shop.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<Map<string, HeldStock> | null>}
 */
export async function readStock(env) {
  const ours = new Set(stockVariants().map((variant) => variant.code));
  const headers = squareHeaders(env);
  /** @type {Map<string, HeldStock>} */
  const found = new Map();

  try {
    /* The item library is small, so listing its variations and picking ours
       out is simpler and sturdier than searching for each one. */
    let cursor = '';
    for (let page = 0; page < 50; page += 1) {
      const url = new URL(squareUrl(env, '/v2/catalog/list'));
      url.searchParams.set('types', 'ITEM_VARIATION');
      if (cursor) url.searchParams.set('cursor', cursor);
      const response = await fetch(url.toString(), { headers });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(`catalog list ${response.status} ${data?.errors?.[0]?.code ?? ''}`);

      for (const object of data.objects ?? []) {
        const variation = object?.item_variation_data;
        /* Typed in by a person, so forgiving of case and stray spaces. */
        const code = typeof variation?.sku === 'string' ? variation.sku.trim().toUpperCase() : '';
        if (object.type !== 'ITEM_VARIATION' || object.is_deleted || !ours.has(code) || found.has(code)) continue;
        const here = (variation.location_overrides ?? []).find(
          (/** @type {{ location_id?: string }} */ override) => override.location_id === env.SQUARE_LOCATION_ID
        );
        found.set(code, {
          id: object.id,
          tracked: Boolean(here?.track_inventory ?? variation.track_inventory),
          quantity: 0,
        });
      }

      cursor = data.cursor ?? '';
      if (!cursor) break;
    }

    /* A tracked variation Square has no count for has never had stock added,
       so it stays at the zero it started with. */
    const tracked = new Map([...found.values()].filter((held) => held.tracked).map((held) => [held.id, held]));
    const ids = [...tracked.keys()];
    for (let start = 0; start < ids.length; start += 100) {
      let countCursor = '';
      for (let page = 0; page < 50; page += 1) {
        const response = await fetch(squareUrl(env, '/v2/inventory/counts/batch-retrieve'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            catalog_object_ids: ids.slice(start, start + 100),
            location_ids: [env.SQUARE_LOCATION_ID],
            states: ['IN_STOCK'],
            cursor: countCursor || undefined,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) throw new Error(`stock counts ${response.status} ${data?.errors?.[0]?.code ?? ''}`);

        for (const count of data.counts ?? []) {
          const held = tracked.get(count?.catalog_object_id);
          if (!held || count.state !== 'IN_STOCK' || count.location_id !== env.SQUARE_LOCATION_ID) continue;
          held.quantity = Math.max(0, Math.floor(Number(count.quantity) || 0));
        }

        countCursor = data.cursor ?? '';
        if (!countCursor) break;
      }
    }

    return found;
  } catch (error) {
    console.error('Could not read stock from Square', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * GET /api/stock: { stock: { "<code>": <number in stock> } }, for tracked
 * variations only. Read by the product pages' script. It holds nothing
 * private: anybody standing at the welcome desk can count the shirts.
 *
 * Kept for a minute, in the browser and at Cloudflare's edge, so a busy page
 * does not become a busy Square. The checkout never relies on it: it reads
 * Square afresh.
 *
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @param {{ waitUntil?: (promise: Promise<unknown>) => void } | undefined} ctx
 */
export async function handleStock(request, env, ctx) {
  /** @param {unknown} body @param {string} cacheControl @param {number} [status] */
  const reply = (body, cacheControl, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cacheControl },
    });

  if (request.method !== 'GET') return reply({ error: 'Use GET.' }, 'no-store', 405);
  if (!squareConfigured(env)) return reply({ stock: {} }, 'public, max-age=60');

  const cache = typeof caches === 'undefined' ? null : /** @type {any} */ (caches).default;
  const key = new Request(new URL('/api/stock', request.url).toString());
  const hit = cache ? await cache.match(key) : null;
  if (hit) return hit;

  const held = await readStock(env);
  /* Unknown, so the pages fall back to the ticks at /admin. Not cached, so the
     next visitor tries Square again. */
  if (!held) return reply({ stock: {} }, 'no-store');

  const response = reply(
    {
      stock: Object.fromEntries(
        [...held].filter(([, item]) => item.tracked).map(([code, item]) => [code, item.quantity])
      ),
    },
    'public, max-age=60'
  );
  if (cache) ctx?.waitUntil?.(cache.put(key, response.clone()));
  return response;
}
