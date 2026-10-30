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
import { stockVariants, squashCode } from '../src/lib/shop.mjs';

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
 * @property {string} id        The variation's id in Square's item library.
 * @property {boolean} known    Whether Square's number for it can be relied on:
 *                              stock tracked at TTE's location, or marked sold
 *                              out there. Unknown is left to the ticks at /admin.
 * @property {number} quantity  In stock at TTE's location. Zero when sold out.
 */

/**
 * Whether a catalogue object exists at a location. Square's rule: present
 * everywhere unless `present_at_all_locations` is false, less any location
 * listed as absent; or, when it is false, only where listed as present.
 *
 * @param {{ present_at_all_locations?: boolean, present_at_location_ids?: string[], absent_at_location_ids?: string[] }} object
 * @param {string | undefined} location
 */
const presentAt = (object, location) =>
  object.present_at_all_locations === false
    ? (object.present_at_location_ids ?? []).includes(location ?? '')
    : !(object.absent_at_location_ids ?? []).includes(location ?? '');

/**
 * Every variation in Square whose SKU is one of ours, with its stock. Null
 * when Square could not be read, which callers treat as "unknown", never as
 * "none left": a slow Square should not close the shop.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<Map<string, HeldStock> | null>}
 */
export async function readStock(env) {
  const location = env.SQUARE_LOCATION_ID;
  /* SKUs are typed by a person, so they are compared as letters and digits
     only: "GREY-APRICOT", a stray space or lower case still match. */
  const ours = new Map(stockVariants().map((variant) => [squashCode(variant.code), variant.code]));
  const headers = squareHeaders(env);
  /**
   * Every variation carrying one of our codes. Usually one each; more than
   * one when an item was copied in Square without changing its SKUs.
   * @type {Map<string, { id: string, tracked: boolean, soldOut: boolean, quantity: number, here: boolean, elsewhere: boolean }[]>}
   */
  const candidates = new Map();

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
        const code = typeof variation?.sku === 'string' ? ours.get(squashCode(variation.sku)) : undefined;
        /* A variation not stocked at TTE's location is not ours to sell. */
        if (object.type !== 'ITEM_VARIATION' || object.is_deleted || !code || !presentAt(object, location)) continue;
        const here = (variation.location_overrides ?? []).find(
          (/** @type {{ location_id?: string }} */ override) => override.location_id === location
        );
        /* Square's own "sold out" switch counts as none left, until the date
           it was set to lapse, if any. */
        const lapses = here?.sold_out_valid_until ? Date.parse(here.sold_out_valid_until) : NaN;
        const list = candidates.get(code) ?? [];
        list.push({
          id: object.id,
          tracked: Boolean(here?.track_inventory ?? variation.track_inventory),
          soldOut: here?.sold_out === true && !(lapses <= Date.now()),
          quantity: 0,
          here: false,
          elsewhere: false,
        });
        candidates.set(code, list);
      }

      cursor = data.cursor ?? '';
      if (!cursor) break;
    }

    /* Counts at every location, so stock held somewhere else can be told
       apart from stock never added. */
    const tracked = new Map(
      [...candidates.values()].flat().filter((candidate) => candidate.tracked).map((candidate) => [candidate.id, candidate])
    );
    const ids = [...tracked.keys()];
    for (let start = 0; start < ids.length; start += 100) {
      let countCursor = '';
      for (let page = 0; page < 50; page += 1) {
        const response = await fetch(squareUrl(env, '/v2/inventory/counts/batch-retrieve'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            catalog_object_ids: ids.slice(start, start + 100),
            states: ['IN_STOCK'],
            cursor: countCursor || undefined,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) throw new Error(`stock counts ${response.status} ${data?.errors?.[0]?.code ?? ''}`);

        for (const count of data.counts ?? []) {
          const candidate = tracked.get(count?.catalog_object_id);
          if (!candidate || count.state !== 'IN_STOCK') continue;
          if (count.location_id === location) {
            candidate.quantity = Math.max(0, Math.floor(Number(count.quantity) || 0));
            candidate.here = true;
          } else {
            candidate.elsewhere = true;
          }
        }

        countCursor = data.cursor ?? '';
        if (!countCursor) break;
      }
    }

    /** @type {Map<string, HeldStock>} */
    const found = new Map();
    for (const [code, list] of candidates) {
      const judged = list.map((candidate) => {
        /* Tracked with no count anywhere: stock was never added, so none.
           Tracked with counts only at another location: that is a setup
           question, not an empty shelf, so unknown. */
        if (candidate.tracked && !candidate.here && candidate.elsewhere && !candidate.soldOut) {
          console.warn('Square holds stock for this SKU only at another location', code, candidate.id);
        }
        return {
          id: candidate.id,
          known: candidate.soldOut || (candidate.tracked && (candidate.here || !candidate.elsewhere)),
          quantity: candidate.soldOut ? 0 : candidate.quantity,
        };
      });
      if (judged.length > 1) {
        console.warn('Square has more than one variation with this SKU', code, judged.map((held) => held.id).join(', '));
      }
      /* With copies, the one Square is counting, and of those the one with
         stock, so a forgotten copy cannot mark a size sold out. */
      const best = judged.reduce((a, b) =>
        Number(b.known) > Number(a.known) || (b.known === a.known && b.quantity > a.quantity) ? b : a
      );
      found.set(code, best);
    }

    return found;
  } catch (error) {
    console.error('Could not read stock from Square', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * GET /api/stock: { stock: { "<code>": <number in stock> } }, for variations
 * whose stock is known (see HeldStock). Read by the product pages' script. It holds nothing
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
        [...held].filter(([, item]) => item.known).map(([code, item]) => [code, item.quantity])
      ),
    },
    'public, max-age=60'
  );
  if (cache) ctx?.waitUntil?.(cache.put(key, response.clone()));
  return response;
}
