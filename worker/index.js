/**
 * The Worker in front of the static site.
 *
 * Until now this site had no server code at all: wrangler.jsonc carried no
 * `main` and Cloudflare served the build directly. That was right while nothing
 * needed a server. The shop needs one, because creating a Square payment link
 * requires an access token, and a token in a browser is not a secret.
 *
 * Everything that is not /api/* still goes straight to the static assets, so
 * the site keeps behaving exactly as it did.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not trust a single number sent by the browser. The request names a
 * sku, a size and a quantity; every price, every name and every availability
 * decision is read here, from this Worker's own copy of the catalogue, which is
 * the same file the pages were built from. A basket edited in a developer
 * console gets the real price or an error. It never gets the price it asked
 * for.
 *
 * It also does not record the order. Square does that. The order behind the
 * payment link holds the line items with the size in each name, the payment
 * note says collect or post, and for a posted order Square asks for the
 * address. Whoever packs the orders reads them in the Square Dashboard. A
 * second copy of that data in a database here would be one more place for
 * personal information to live and one more thing to keep in step with Square.
 *
 * Square, not Stripe, since 25 October 2026, by the client's decision. Square's
 * published online rate in October 2026 was a flat 2.2% with no fixed fee,
 * which costs less than Stripe's 1.65% plus 30c on the $25 and $28 items that
 * most orders are made of.
 */
import {
  validateBasket,
  shippingOption,
  postingAvailable,
  lineName,
  variantLabel,
} from '../src/lib/shop.mjs';
import { CHURCH } from '../src/data/church.mjs';
import { handleForm } from './forms.js';

/* SQUARE_ENVIRONMENT=sandbox points at Square's test system, for a test
   purchase with a sandbox token. Anything else is the real one. */
const SQUARE_API = {
  production: 'https://connect.squareup.com/v2/online-checkout/payment-links',
  sandbox: 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links',
};

/* Pinned rather than left to the account's default, so a change on Square's
   side cannot quietly change what these fields mean. */
const SQUARE_VERSION = '2026-09-16';

/** A request body larger than this is not a basket. */
const MAX_BODY_BYTES = 8_000;

/** @param {string} message @param {number} status */
const fail = (message, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/**
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 */
async function handleCheckout(request, env) {
  if (request.method !== 'POST') return fail('Use POST.', 405);

  /*
    Same-origin only. This endpoint spends money on somebody's behalf, so it
    should not be callable from another site's page. There is no CORS header
    anywhere in this file, which means a cross-origin caller cannot read the
    reply either.
  */
  const origin = request.headers.get('origin');
  const here = new URL(request.url).origin;
  if (origin && origin !== here) return fail('Not allowed from there.', 403);

  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID) {
    /* Configuration is missing, which is our problem rather than the
       visitor's. Say something true and useful without describing our setup. */
    return fail('Online payment is not switched on yet. Please call us and we will take the order.', 503);
  }

  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) return fail('That order is too large to send.', 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('We could not read that order.');
  }

  const wanted = body?.fulfilment === 'post' ? 'post' : 'collect';
  const fulfilment = wanted === 'post' && postingAvailable() ? 'post' : 'collect';

  const { lines, subtotalCents, errors } = validateBasket(body?.items);
  if (errors.length) return fail(errors[0]);
  if (!lines.length) return fail('There is nothing in the basket.');

  const delivery = shippingOption(fulfilment, subtotalCents);
  if (!delivery) return fail('We could not work out delivery for that order.');

  /* Square appends its own details to the address it sends people back to.
     This one is ours, so the confirmation page knows the visit came from a
     payment, and it is on the order in Square too. */
  const reference = `TTE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const packingList = lines
    .map((line) => {
      const variant = variantLabel(line);
      return `${line.qty} x ${line.product.sku}${variant ? ` (${variant})` : ''}`;
    })
    .join(', ');

  const payload = {
    /* Stops a double click or a retried request opening two payment links. */
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: env.SQUARE_LOCATION_ID,
      reference_id: reference,
      /* Prices are sent with each order rather than kept as Square catalogue
         items, so the catalogue at /admin is the only place a price lives and
         the two can never drift apart. */
      line_items: lines.map((line) => ({
        name: lineName(line),
        quantity: String(line.qty),
        base_price_money: { amount: line.unitCents, currency: 'AUD' },
        metadata: Object.fromEntries(
          Object.entries({
            sku: line.product.sku,
            colour: line.colour,
            fit: line.fit,
            size: line.size,
          }).filter(([, value]) => value),
        ),
      })),
      metadata: { fulfilment },
    },
    checkout_options: {
      redirect_url: `${here}/shop/order-complete?ref=${reference}`,
      merchant_support_email: CHURCH.email,
      /* An address is only asked for when there is something to post to it. */
      ask_for_shipping_address: fulfilment === 'post',
      shipping_fee:
        delivery.cents > 0
          ? { name: delivery.label, charge: { amount: delivery.cents, currency: 'AUD' } }
          : undefined,
      /* A purchase, not a donation, so no tip. Afterpay is off because it
         costs several times the card fee. */
      allow_tipping: false,
      enable_coupon: false,
      enable_loyalty: false,
      accepted_payment_methods: { afterpay_clearpay: false },
    },
    /* The note Square shows on the payment in its Dashboard, so whoever packs
       the order sees collect or post, and what to pack, at a glance. */
    payment_note: `${delivery.label}. ${packingList}`.slice(0, 500),
  };

  let response;
  try {
    response = await fetch(
      env.SQUARE_ENVIRONMENT === 'sandbox' ? SQUARE_API.sandbox : SQUARE_API.production,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
          'content-type': 'application/json',
          'square-version': SQUARE_VERSION,
        },
        body: JSON.stringify(payload),
      },
    );
  } catch {
    return fail('We could not reach the payment service. Please try again shortly.', 502);
  }

  const reply = await response.json().catch(() => null);
  const url = reply?.payment_link?.url ?? reply?.payment_link?.long_url;

  if (!response.ok || !url) {
    /* Square's message can name internal configuration, so it is logged rather
       than returned. Observability is on for this Worker. */
    console.error('Square rejected a payment link', response.status, reply?.errors?.[0]?.code ?? '');
    return fail('We could not start the payment. Please try again, or call us and we will take the order.', 502);
  }

  return new Response(JSON.stringify({ url }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } } & Record<string, string | undefined>} env
   */
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/checkout') return handleCheckout(request, env);

    /* The contact form and the Life-Link finder share /api/contact; prayer
       requests have their own address so they can never be routed with
       general enquiries by mistake. Destinations live in src/data/forms.mjs. */
    if (pathname === '/api/contact') return handleForm(request, env, 'contact');
    if (pathname === '/api/prayer') return handleForm(request, env, 'prayer');

    return env.ASSETS.fetch(request);
  },
};
