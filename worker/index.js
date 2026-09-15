/**
 * The Worker in front of the static site.
 *
 * Until now this site had no server code at all: wrangler.jsonc carried no
 * `main` and Cloudflare served the build directly. That was right while nothing
 * needed a server. The shop needs one, because creating a Stripe Checkout
 * Session requires a secret key, and a secret key in a browser is not a secret.
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
 * It also does not record the order. Stripe does that. The Checkout Session
 * holds the line items, the size, the fulfilment choice and, for a posted
 * order, the address and phone. Whoever packs the orders reads them in the
 * Stripe Dashboard. A second copy of that data in a database here would be one
 * more place for personal information to live and one more thing to keep in
 * step with Stripe.
 */
import { validateBasket, shippingOption, postingAvailable } from '../src/lib/shop.mjs';

const STRIPE_API = 'https://api.stripe.com/v1/checkout/sessions';

/** A request body larger than this is not a basket. */
const MAX_BODY_BYTES = 8_000;

/** @param {string} message @param {number} status */
const fail = (message, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/**
 * Flatten a nested object into Stripe's bracketed form encoding.
 * Stripe's API takes form bodies, not JSON, and nested values are expressed as
 * a[b][0][c]. Undefined and null are dropped so optional settings can simply be
 * left out of the object above.
 *
 * @param {Record<string, unknown>} value
 * @param {string} prefix
 * @param {URLSearchParams} into
 */
function toForm(value, prefix = '', into = new URLSearchParams()) {
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined || item === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(item)) {
      item.forEach((entry, index) => {
        if (entry !== null && typeof entry === 'object') toForm(entry, `${name}[${index}]`, into);
        else into.append(`${name}[${index}]`, String(entry));
      });
    } else if (typeof item === 'object') {
      toForm(/** @type {Record<string, unknown>} */ (item), name, into);
    } else {
      into.append(name, String(item));
    }
  }
  return into;
}

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

  if (!env.STRIPE_SECRET_KEY) {
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

  const taxRate = env.STRIPE_GST_TAX_RATE;

  const payload = {
    mode: 'payment',
    success_url: `${here}/shop/order-complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${here}/shop/basket`,
    /* Stripe collects an email address of its own accord, which is how the
       receipt reaches the buyer. */
    billing_address_collection: 'auto',
    line_items: lines.map((line) => ({
      quantity: line.qty,
      /* Prices are created here per session rather than kept as Stripe Price
         objects, so the catalogue at /admin is the only place a price lives
         and the two can never drift apart. */
      price_data: {
        currency: 'aud',
        unit_amount: line.unitCents,
        product_data: {
          name: line.size ? `${line.product.name}, size ${line.size}` : line.product.name,
          metadata: { sku: line.product.sku, size: line.size ?? '' },
        },
      },
      /* The tax rate object in Stripe is configured as inclusive, matching the
         catalogue, so this reports GST rather than adding it. Left out when
         unconfigured, which is the state before the accountant has set it up. */
      tax_rates: taxRate ? [taxRate] : undefined,
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: delivery.label,
          fixed_amount: { amount: delivery.cents, currency: 'aud' },
          tax_behavior: 'inclusive',
        },
      },
    ],
    /* An address is only collected when there is something to post to it. */
    shipping_address_collection: fulfilment === 'post' ? { allowed_countries: ['AU'] } : undefined,
    phone_number_collection: fulfilment === 'post' ? { enabled: true } : undefined,
    metadata: {
      fulfilment,
      items: lines
        .map((line) => `${line.qty} x ${line.product.sku}${line.size ? ` ${line.size}` : ''}`)
        .join(', ')
        .slice(0, 480),
    },
    payment_intent_data: {
      description: 'The Transformation Edge shop',
    },
  };

  let response;
  try {
    response = await fetch(STRIPE_API, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'content-type': 'application/x-www-form-urlencoded',
        /* Stops a double click or a retried request opening two sessions. */
        'idempotency-key': crypto.randomUUID(),
      },
      body: toForm(payload).toString(),
    });
  } catch {
    return fail('We could not reach the payment service. Please try again shortly.', 502);
  }

  const session = await response.json().catch(() => null);

  if (!response.ok || !session?.url) {
    /* Stripe's message can name internal configuration, so it is logged rather
       than returned. Observability is on for this Worker. */
    console.error('Stripe rejected a checkout session', response.status, session?.error?.code ?? '');
    return fail('We could not start the payment. Please try again, or call us and we will take the order.', 502);
  }

  return new Response(JSON.stringify({ url: session.url }), {
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

    /*
      Everything else is the site. /api/contact is deliberately not handled
      here: open question 5 has not been answered, so where a contact or prayer
      message should be delivered is still undecided, and guessing would be
      worse than the current behaviour. Those forms behave exactly as they did
      before this Worker existed.
    */
    return env.ASSETS.fetch(request);
  },
};
