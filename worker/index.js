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
 * STOCK
 *
 * Square is also the stock book (client, 29 October 2026; worker/square.js
 * says how). Before opening a payment, the checkout reads Square's stock and
 * refuses more than there is. Each line then points at its item in Square, so
 * the sale counts the stock down there, with the catalogue's price sent beside
 * it. Square's own total for the order is checked against ours before the buyer
 * is sent on: if Square has charged anything else, that link is not used, and
 * the order goes as plain lines, the way it did before stock was in Square.
 * Nobody is ever charged a figure the site did not show them.
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
  stockCode,
} from '../src/lib/shop.mjs';
import { CHURCH } from '../src/data/church.mjs';
import { handleForm } from './forms.js';
import { squareConfigured, squareUrl, squareHeaders, readStock, handleStock } from './square.js';

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

  if (!squareConfigured(env)) {
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

  /** @param {import('../src/lib/shop.mjs').BasketLine} line */
  const codeOf = (line) => stockCode({ sku: line.product.sku, colour: line.colour, fit: line.fit, size: line.size });

  /* Read afresh, not from the minute-old copy the product pages see. Null if
     Square could not be read, and then the order goes on as it always has. */
  const stock = await readStock(env);
  if (stock) {
    /** @type {Map<string, number>} */
    const asked = new Map();
    for (const line of lines) asked.set(codeOf(line), (asked.get(codeOf(line)) ?? 0) + line.qty);
    for (const line of lines) {
      const held = stock.get(codeOf(line));
      if (!held?.known || (asked.get(codeOf(line)) ?? 0) <= held.quantity) continue;
      const variant = variantLabel(line);
      const what = `${line.product.name}${variant ? `, ${variant},` : ''}`;
      return fail(
        held.quantity === 0
          ? `Sorry, ${what} has just sold out. Please take it out of your basket.`
          : `Sorry, only ${held.quantity} of ${what} ${held.quantity === 1 ? 'is' : 'are'} left. Please lower the quantity in your basket.`,
        409
      );
    }
  }

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

  /**
   * The request to Square. With `held`, a line whose item is set up in Square
   * points at it, so Square counts the sale off its stock; the price still
   * comes from the catalogue at /admin, sent with every line, so a price lives
   * in one place. Without it, every line is plain: a name and a price.
   *
   * @param {Map<string, import('./square.js').HeldStock> | null} held
   */
  const payloadFor = (held) => ({
    /* Stops a double click or a retried request opening two payment links. */
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: env.SQUARE_LOCATION_ID,
      reference_id: reference,
      line_items: lines.map((line) => {
        const metadata = Object.fromEntries(
          Object.entries({
            sku: line.product.sku,
            colour: line.colour,
            fit: line.fit,
            size: line.size,
          }).filter(([, value]) => value),
        );
        const item = held?.get(codeOf(line));
        return item
          ? {
              catalog_object_id: item.id,
              quantity: String(line.qty),
              base_price_money: { amount: line.unitCents, currency: 'AUD' },
              metadata,
            }
          : {
              name: lineName(line),
              quantity: String(line.qty),
              base_price_money: { amount: line.unitCents, currency: 'AUD' },
              metadata,
            };
      }),
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
  });

  /** @param {ReturnType<typeof payloadFor>} payload */
  const openLink = async (payload) => {
    const response = await fetch(squareUrl(env, '/v2/online-checkout/payment-links'), {
      method: 'POST',
      headers: squareHeaders(env),
      body: JSON.stringify(payload),
    });
    const reply = await response.json().catch(() => null);
    return {
      status: response.status,
      ok: response.ok,
      code: reply?.errors?.[0]?.code ?? '',
      url: reply?.payment_link?.url ?? reply?.payment_link?.long_url,
      /* The order Square made, with the total it will charge. */
      charges: Number(reply?.related_resources?.orders?.[0]?.total_money?.amount),
    };
  };

  const pointsAtSquare = Boolean(stock && lines.some((line) => stock.get(codeOf(line))));
  const expected = subtotalCents + delivery.cents;

  let link;
  try {
    link = await openLink(payloadFor(pointsAtSquare ? stock : null));
    if (pointsAtSquare && (!link.ok || !link.url || link.charges !== expected)) {
      /* Square refused the lines that point at its items, or would charge a
         different total, or did not say what it would charge. That link is
         left unused, and the order goes as plain lines, as it did before stock
         was in Square: the sale is not counted off Square's stock, but nobody
         pays a figure the site did not show. */
      console.error(
        'Square payment link pointing at stock items not used',
        link.status,
        link.code,
        Number.isFinite(link.charges) ? link.charges : 'no total',
        expected
      );
      link = await openLink(payloadFor(null));
    }
  } catch {
    return fail('We could not reach the payment service. Please try again shortly.', 502);
  }

  const { url } = link;
  if (!link.ok || !url) {
    /* Square's message can name internal configuration, so it is logged rather
       than returned. Observability is on for this Worker. */
    console.error('Square rejected a payment link', link.status, link.code);
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
   * @param {{ waitUntil: (promise: Promise<unknown>) => void }} [ctx]
   */
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/checkout') return handleCheckout(request, env);
    if (pathname === '/api/stock') return handleStock(request, env, ctx);

    /* The contact form and the Life-Link finder share /api/contact; prayer
       requests have their own address so they can never be routed with
       general enquiries by mistake. Destinations live in src/data/forms.mjs. */
    if (pathname === '/api/contact') return handleForm(request, env, 'contact');
    if (pathname === '/api/prayer') return handleForm(request, env, 'prayer');

    return env.ASSETS.fetch(request);
  },
};
