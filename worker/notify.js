/**
 * The shop's own emails: each paid online order, and a morning list of
 * anything running low (client, 30 October 2026).
 *
 * WHO GETS WHAT
 *
 * SHOP_PACKER_EMAIL packs the orders and gets them to act on. SHOP_INFO_EMAIL
 * gets the same, marked "for your information": nothing for them to do. Both
 * are Worker secrets, set in Cloudflare, not addresses in this file, because
 * this repository is public and they belong to people rather than to church
 * inboxes. Cloudflare only sends to addresses verified in the church's
 * account, so a mistyped secret delivers nothing rather than to a stranger.
 *
 * WHY THE WORKER ASKS SQUARE, RATHER THAN SQUARE TELLING IT
 *
 * Every ten minutes a scheduled run lists the last day's payments at TTE's
 * location, keeps the completed ones whose order came from the website (its
 * reference starts "TTE-"), and emails any not emailed before. A Square webhook
 * would be quicker by a few minutes, but needs a subscription and a signing
 * key set up in Square, and misses whatever arrives while it is broken. This
 * catches up on its own. Sales at the welcome desk are not emailed: they were
 * handed over in person.
 *
 * SHOP_STATE, a small key-value store, remembers which payments have been
 * emailed and whether today's stock list has gone, so nothing goes twice.
 *
 * Nothing personal is logged: a failed send is logged by reference only.
 */
import { stockVariants, variantLabel, productBySku, formatMoney, LOW_STOCK } from '../src/lib/shop.mjs';
import { FORM_SENDER } from '../src/data/forms.mjs';
import { squareConfigured, squareUrl, squareHeaders, readStock } from './square.js';

/** Emailed payments are remembered for a month, far longer than the look-back. */
const REMEMBER_SECONDS = 60 * 60 * 24 * 31;

/** The morning list goes on the first run at or after this hour, Sydney time. */
const STOCK_HOUR = 7;

/** @param {Date} when */
const sydney = (when) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(when)
      .map((part) => [part.type, part.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
};

/** @param {string | undefined} iso */
const sydneyTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(iso))
    : 'just now';

/**
 * What an order line is, in the shop's words when it came from the website.
 * @param {any} item
 */
function lineText(item) {
  const product = item?.metadata?.sku ? productBySku(item.metadata.sku) : null;
  const what = product
    ? [product.name, variantLabel({ colour: item.metadata.colour, fit: item.metadata.fit, size: item.metadata.size })]
        .filter(Boolean)
        .join(', ')
    : [item?.name, item?.variation_name].filter(Boolean).join(', ') || 'An item';
  return `- ${item?.quantity ?? '1'} x ${what}`;
}

/** @param {any} address */
const addressText = (address) =>
  address
    ? [
        address.first_name || address.last_name ? `${address.first_name ?? ''} ${address.last_name ?? ''}`.trim() : '',
        address.address_line_1,
        address.address_line_2,
        [address.locality, address.administrative_district_level_1, address.postal_code].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join('\n')
    : '';

/**
 * The two versions of one order's email.
 * @param {any} payment
 * @param {any} order
 */
export function orderEmails(payment, order) {
  const reference = order.reference_id;
  const fulfilment = order.metadata?.fulfilment === 'post' ? 'post' : 'collect';
  const address = addressText(payment.shipping_address);
  const body = [
    `Reference: ${reference}`,
    `Paid: ${sydneyTime(payment.created_at)}`,
    `Getting it to them: ${fulfilment === 'post' ? 'post it' : 'they collect it at the Sunday gathering'}`,
    '',
    'What they ordered:',
    ...(order.line_items ?? []).map(lineText),
    '',
    `Total paid: ${formatMoney(Number(payment.total_money?.amount ?? 0))}`,
    payment.buyer_email_address ? `Their email: ${payment.buyer_email_address}` : '',
    address ? `\nPost to:\n${address}` : '',
    '',
    'Square has the full record under Transactions, and has sent them their receipt.',
  ]
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n');

  return {
    packer: {
      subject: `Online order ${reference}: to pack`,
      text: `A new order has been paid on the website. Please pack it${
        fulfilment === 'post' ? ' and post it' : ' for collection'
      }.\n\n${body}\n`,
    },
    info: {
      subject: `Online order ${reference} (for your information)`,
      text: `For your information: a new order has been paid on the website, and it has gone to be packed. Nothing for you to do.\n\n${body}\n`,
    },
  };
}

/**
 * The morning list, or null when nothing is low.
 * @param {Map<string, { known: boolean, quantity: number }>} held
 */
export function stockEmails(held) {
  const low = stockVariants()
    .map((variant) => ({ variant, item: held.get(variant.code) }))
    .filter(({ item }) => item?.known && item.quantity <= LOW_STOCK);
  if (!low.length) return null;

  const lines = low.map(({ variant, item }) => {
    const label = variantLabel(variant);
    return `- ${variant.product.name}${label ? `, ${label}` : ''}: ${item?.quantity ? `${item.quantity} left` : 'sold out'}`;
  });
  const count = `${low.length} size${low.length === 1 ? '' : 's'}`;
  const list = `${lines.join('\n')}\n\nThese are Square's counts this morning. After a stocktake, change the numbers in Square; the website follows within a minute.\n`;
  return {
    packer: { subject: `Shop stock running low: ${count}`, text: `${count} in the shop ${low.length === 1 ? 'is' : 'are'} at ${LOW_STOCK} or fewer:\n\n${list}` },
    info: {
      subject: `Shop stock running low: ${count} (for your information)`,
      text: `For your information: ${count} in the shop ${low.length === 1 ? 'is' : 'are'} at ${LOW_STOCK} or fewer. Nothing for you to do.\n\n${list}`,
    },
  };
}

/**
 * Send the packer's version, then the copy. Each address is optional.
 * @param {Record<string, any>} env
 * @param {{ packer: { subject: string, text: string }, info: { subject: string, text: string } }} versions
 */
async function sendBoth(env, versions) {
  if (env.SHOP_PACKER_EMAIL) {
    await env.SHOP_EMAIL.send({ to: env.SHOP_PACKER_EMAIL, from: FORM_SENDER, ...versions.packer });
  }
  if (env.SHOP_INFO_EMAIL) {
    await env.SHOP_EMAIL.send({ to: env.SHOP_INFO_EMAIL, from: FORM_SENDER, ...versions.info });
  }
}

/**
 * Email any website order paid in the last day and not emailed yet.
 * @param {Record<string, any>} env
 * @param {Date} now
 */
async function newOrders(env, now) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const payments = [];
  let cursor = '';
  for (let page = 0; page < 10; page += 1) {
    const url = new URL(squareUrl(env, '/v2/payments'));
    url.searchParams.set('begin_time', since);
    url.searchParams.set('location_id', env.SQUARE_LOCATION_ID);
    url.searchParams.set('sort_order', 'ASC');
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetch(url.toString(), { headers: squareHeaders(env) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new Error(`payments ${response.status} ${data?.errors?.[0]?.code ?? ''}`);
    payments.push(...(data.payments ?? []));
    cursor = data.cursor ?? '';
    if (!cursor) break;
  }

  /* Completed, with an order, and not emailed before. */
  const waiting = [];
  for (const payment of payments) {
    if (payment?.status !== 'COMPLETED' || !payment.order_id) continue;
    if (await env.SHOP_STATE.get(`order-mail:${payment.id}`)) continue;
    waiting.push(payment);
  }
  if (!waiting.length) return;

  const response = await fetch(squareUrl(env, '/v2/orders/batch-retrieve'), {
    method: 'POST',
    headers: squareHeaders(env),
    body: JSON.stringify({ location_id: env.SQUARE_LOCATION_ID, order_ids: waiting.map((payment) => payment.order_id) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(`orders ${response.status} ${data?.errors?.[0]?.code ?? ''}`);
  const orders = new Map((data.orders ?? []).map((/** @type {any} */ order) => [order.id, order]));

  for (const payment of waiting) {
    const order = orders.get(payment.order_id);
    /* Only orders the website made. A sale at the welcome desk was handed over there. */
    if (!order || !String(order.reference_id ?? '').startsWith('TTE-')) {
      await env.SHOP_STATE.put(`order-mail:${payment.id}`, 'not ours', { expirationTtl: REMEMBER_SECONDS });
      continue;
    }
    try {
      await sendBoth(env, orderEmails(payment, order));
      await env.SHOP_STATE.put(`order-mail:${payment.id}`, order.reference_id, { expirationTtl: REMEMBER_SECONDS });
    } catch (error) {
      /* Not remembered, so the next run tries again. */
      const e = /** @type {any} */ (error);
      console.error('order email could not be sent', order.reference_id, e?.code ?? e?.name ?? 'Error');
    }
  }
}

/**
 * The morning list: once a day, on the first run from STOCK_HOUR, Sydney time.
 * @param {Record<string, any>} env
 * @param {Date} now
 */
async function morningStock(env, now) {
  const { date, hour } = sydney(now);
  if (hour < STOCK_HOUR) return;
  const key = `stock-mail:${date}`;
  if (await env.SHOP_STATE.get(key)) return;

  const held = await readStock(env);
  if (!held) return; /* Square did not answer; the next run tries again. */

  const versions = stockEmails(held);
  try {
    if (versions) await sendBoth(env, versions);
    await env.SHOP_STATE.put(key, versions ? 'sent' : 'nothing low', { expirationTtl: 60 * 60 * 48 });
  } catch (error) {
    const e = /** @type {any} */ (error);
    console.error('stock email could not be sent', e?.code ?? e?.name ?? 'Error');
  }
}

/**
 * The scheduled run, every ten minutes (wrangler.jsonc). Does nothing until
 * Square, the store, the email binding and at least one address are set up.
 *
 * @param {Record<string, any>} env
 * @param {Date} [now]
 */
export async function runShopNotices(env, now = new Date()) {
  if (!squareConfigured(env) || !env.SHOP_STATE || !env.SHOP_EMAIL) return;
  if (!env.SHOP_PACKER_EMAIL && !env.SHOP_INFO_EMAIL) return;

  for (const job of [newOrders, morningStock]) {
    try {
      await job(env, now);
    } catch (error) {
      console.error('shop notices', job.name, error instanceof Error ? error.message : String(error));
    }
  }
}
