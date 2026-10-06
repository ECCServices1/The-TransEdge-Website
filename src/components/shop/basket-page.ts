/**
 * Drawing the basket page, src/pages/shop/basket.astro, from what is in this
 * browser's basket, and handing it to the Worker to start a Stripe payment.
 *
 * The catalogue arrives in a data attribute on the page, so the prices shown
 * here are the reader's. The figure anybody is charged is worked out again in
 * the Worker from its own copy of the catalogue.
 */
import { readBasket, writeBasket, type Line } from './basket-store';
import { variantLabel } from '../../lib/variant.mjs';

type Entry = {
  sku: string;
  slug: string;
  name: string;
  category: string;
  cents: number;
  fitCents: Record<string, number>;
  limit: number;
};

const root = document.querySelector<HTMLElement>('[data-basket]');
if (root) {
  const catalogue: Entry[] = JSON.parse(root.dataset.catalogue ?? '[]');
  const canPost = root.dataset.canPost === 'true';
  const postRate = Number(root.dataset.postRate) || 0;

  const emptyEl = root.querySelector<HTMLElement>('[data-basket-empty]')!;
  const fullEl = root.querySelector<HTMLElement>('[data-basket-full]')!;
  const linesEl = root.querySelector<HTMLElement>('[data-lines]')!;
  const subtotalEl = root.querySelector<HTMLElement>('[data-subtotal]')!;
  const deliveryEl = root.querySelector<HTMLElement>('[data-delivery]')!;
  const deliveryRow = root.querySelector<HTMLElement>('[data-delivery-row]')!;
  const totalEl = root.querySelector<HTMLElement>('[data-total]')!;
  const gstEl = root.querySelector<HTMLElement>('[data-gst]')!;
  const payEl = root.querySelector<HTMLButtonElement>('[data-pay]')!;
  const saidEl = root.querySelector<HTMLElement>('[data-said]')!;

  const money = (cents: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);

  const chosenFulfilment = () =>
    root.querySelector<HTMLInputElement>('[data-fulfilment]:checked')?.value ?? 'collect';

  /** Drop anything the catalogue no longer knows about, so a stale basket
      cannot linger and fail at the last step instead of the first. */
  const known = (items: Line[]) =>
    items.filter((item) => catalogue.some((entry) => entry.sku === item.sku));

  /*
    Lines are identified by what they are, not by where they sit. Matching on
    array position looks equivalent and is not: another tab, or a second
    window on the same phone, can rewrite the basket between this page being
    drawn and a button on it being pressed, and then position 2 is somebody
    else's jumper. A stock code with its colour, fit and size cannot drift
    like that.
  */
  const sameLine = (item: Line) => (other: Line) =>
    other.sku === item.sku &&
    (other.colour ?? null) === (item.colour ?? null) &&
    (other.fit ?? null) === (item.fit ?? null) &&
    (other.size ?? null) === (item.size ?? null);

  /* "Forest green, Women's M", or nothing for a book. */
  const describe = (item: Line) =>
    variantLabel({ colour: item.colour ?? null, fit: item.fit ?? null, size: item.size ?? null });

  function paint() {
    const items = known(readBasket());
    linesEl.replaceChildren();

    if (items.length === 0) {
      emptyEl.hidden = false;
      fullEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    fullEl.hidden = false;

    let subtotal = 0;

    items.forEach((item) => {
      const entry = catalogue.find((e) => e.sku === item.sku)!;
      const qty = Math.min(Math.max(Number(item.qty) || 1, 1), entry.limit);
      const unit = (item.fit && entry.fitCents[item.fit]) || entry.cents;
      const lineTotal = unit * qty;
      subtotal += lineTotal;

      const li = document.createElement('li');
      li.className = 'line';

      const words = document.createElement('div');
      const name = document.createElement('a');
      name.className = 'line__name';
      name.href = `/shop/${entry.slug}`;
      name.textContent = entry.name;
      words.append(name);

      const variant = describe(item);
      if (variant) {
        const chosen = document.createElement('p');
        chosen.className = 'line__size';
        chosen.textContent = variant;
        words.append(chosen);
      }

      const each = document.createElement('p');
      each.className = 'line__each';
      each.textContent = `${money(unit)} each`;
      words.append(each);

      const controls = document.createElement('div');
      controls.className = 'line__controls';

      const qtyLabel = document.createElement('label');
      qtyLabel.className = 'line__qty';
      const qtyText = document.createElement('span');
      qtyText.className = 'visually-hidden';
      qtyText.textContent = `Quantity of ${entry.name}${variant ? `, ${variant}` : ''}`;
      const select = document.createElement('select');
      for (let n = 1; n <= Math.min(entry.limit, 10); n += 1) {
        const option = document.createElement('option');
        option.value = String(n);
        option.textContent = String(n);
        if (n === qty) option.selected = true;
        select.append(option);
      }
      select.addEventListener('change', () => {
        const next = known(readBasket());
        const line = next.find(sameLine(item));
        if (line) line.qty = Number(select.value) || 1;
        writeBasket(next);
        paint();
      });
      qtyLabel.append(qtyText, select);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'line__remove';
      remove.textContent = 'Remove';
      const label = `Remove ${entry.name}${variant ? `, ${variant}` : ''}`;
      remove.setAttribute('aria-label', label);
      remove.addEventListener('click', () => {
        const next = known(readBasket()).filter((other) => !sameLine(item)(other));
        writeBasket(next);
        paint();
      });

      controls.append(qtyLabel, remove);

      const price = document.createElement('p');
      price.className = 'line__total';
      price.textContent = money(lineTotal);

      li.append(words, controls, price);
      linesEl.append(li);
    });

    const post = chosenFulfilment() === 'post';
    const delivery = post ? postRate : 0;

    subtotalEl.textContent = money(subtotal);
    deliveryRow.hidden = false;
    deliveryEl.textContent = delivery === 0 ? 'Free' : money(delivery);
    totalEl.textContent = money(subtotal + delivery);
    gstEl.textContent = `Includes GST of ${money(Math.round((subtotal + delivery) / 11))}.`;
  }

  for (const radio of root.querySelectorAll<HTMLInputElement>('[data-fulfilment]')) {
    radio.addEventListener('change', paint);
  }

  payEl.addEventListener('click', async () => {
    const items = known(readBasket());
    if (items.length === 0) return;

    payEl.disabled = true;
    saidEl.textContent = 'Taking you to Stripe.';

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            sku: item.sku,
            colour: item.colour ?? null,
            fit: item.fit ?? null,
            size: item.size ?? null,
            qty: item.qty,
          })),
          fulfilment: canPost ? chosenFulfilment() : 'collect',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && typeof data.url === 'string') {
        window.location.href = data.url;
        return;
      }

      payEl.disabled = false;
      saidEl.textContent =
        typeof data.error === 'string'
          ? data.error
          : 'Something went wrong starting the payment. Please try again, or call us.';
    } catch {
      payEl.disabled = false;
      saidEl.textContent =
        'We could not reach the payment service. Please check your connection and try again.';
    }
  });

  paint();
  window.addEventListener('storage', paint);
}
