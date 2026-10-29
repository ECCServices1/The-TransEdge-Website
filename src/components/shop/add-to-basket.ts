/**
 * Choosing a colour, fit and size and putting it in the basket, on a product
 * page. The markup, and what happens without JavaScript, are in
 * AddToBasket.astro, which also says how stock from Square is shown here.
 */
import { readBasket, writeBasket } from './basket-store';
import { variantLabel, stockCode } from '../../lib/variant.mjs';

/** What Square holds, by stock code, once /api/stock has answered. */
type Stock = Record<string, number>;

for (const buy of document.querySelectorAll<HTMLElement>('[data-buy]')) {
  const add = buy.querySelector<HTMLButtonElement>('[data-add]');
  const qty = buy.querySelector<HTMLSelectElement>('[data-qty]');
  const said = buy.querySelector<HTMLElement>('[data-said]');
  const stockNote = buy.querySelector<HTMLElement>('[data-stock-note]');
  const { sku, name = '' } = buy.dataset;
  const needsSize = buy.dataset.needsSize === 'true';
  const hasColours = buy.dataset.hasColours === 'true';
  const limit = Number(buy.dataset.limit) || 10;
  const lowStock = Number(buy.dataset.lowStock) || 0;
  if (!add || !qty || !sku) continue;

  /* The colour chooser sits beside the pictures, outside this block. */
  const page = buy.closest('[data-product]') ?? document;

  /* The script is here, so the control works. */
  add.disabled = false;

  const say = (text: string) => {
    if (said) said.textContent = text;
  };

  let stock: Stock | null = null;

  const chosenColour = () =>
    hasColours
      ? (page.querySelector<HTMLInputElement>('[data-colour-choice]:checked')?.value ?? null)
      : null;

  /** The fit a size button belongs to: its own run's fit, or the only one. */
  const fitOf = (sizeInput: HTMLInputElement) => {
    const run = sizeInput.closest<HTMLElement>('[data-fit-sizes]')?.dataset.fitSizes ?? '0';
    return (
      buy.querySelector<HTMLInputElement>(`[data-fit-choice="${run}"]`)?.value ??
      (buy.dataset.singleFit || null)
    );
  };

  /** How many Square holds of a choice, or undefined when it is not known. */
  const leftOf = (colour: string | null, fit: string | null, size: string | null) =>
    stock?.[stockCode({ sku, colour, fit, size })];

  const chosenSize = () => {
    const fitInput = buy.querySelector<HTMLInputElement>('[data-fit-choice]:checked');
    const run = fitInput?.dataset.fitChoice ?? '0';
    return buy.querySelector<HTMLInputElement>(`[data-fit-sizes="${run}"] [data-size]:checked`);
  };

  /** Mark what Square has none of, for the colour on show. */
  const showStock = () => {
    if (!stock) return;
    const colour = chosenColour();

    for (const input of buy.querySelectorAll<HTMLInputElement>('[data-size]')) {
      const label = input.closest('label');
      const gone = input.dataset.listedOut === 'true' || leftOf(colour, fitOf(input), input.value) === 0;
      input.disabled = gone;
      if (gone) input.checked = false;
      label?.classList.toggle('buy__choice--gone', gone);
      const note = label?.querySelector('[data-gone-note]');
      if (gone && label && !note) {
        const hidden = document.createElement('span');
        hidden.className = 'visually-hidden';
        hidden.dataset.goneNote = '';
        hidden.textContent = ', sold out';
        label.append(hidden);
      } else if (!gone) {
        note?.remove();
      }
    }

    showLeft();
  };

  /** "Only 2 left in this size", and no more in the quantity than that. */
  const showLeft = () => {
    const size = chosenSize();
    const left = size ? leftOf(chosenColour(), fitOf(size), size.value) : undefined;
    const most = left === undefined ? limit : Math.min(limit, left);

    for (const option of qty.options) option.disabled = Number(option.value) > most;
    if (Number(qty.value) > most && most > 0) qty.value = String(most);

    if (stockNote) {
      stockNote.textContent =
        left !== undefined && left > 0 && left <= lowStock
          ? `Only ${left} left in this size.`
          : '';
    }
  };

  buy.addEventListener('change', (event) => {
    const target = event.target as HTMLElement;
    if (target.matches('[data-size], [data-fit-choice]')) showLeft();
  });

  for (const colourInput of page.querySelectorAll<HTMLInputElement>('[data-colour-choice]')) {
    colourInput.addEventListener('change', showStock);
  }

  /* Only a page with sizes to mark asks. A failed or slow answer leaves the
     page as it was built, with the sizes ticked at /admin. */
  if (needsSize) {
    fetch('/api/stock', { headers: { accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { stock?: unknown } | null) => {
        if (data && data.stock && typeof data.stock === 'object') {
          stock = data.stock as Stock;
          showStock();
        }
      })
      .catch(() => {});
  }

  add.addEventListener('click', () => {
    const colour = chosenColour();
    if (hasColours && !colour) return say('Choose a colour first.');

    let fit: string | null = null;
    let size: string | null = null;
    if (needsSize) {
      const sizeInput = chosenSize();
      if (!sizeInput) return say('Choose a size first.');
      fit = fitOf(sizeInput);
      size = sizeInput.value;
    }

    const want = Number(qty.value) || 1;
    const items = readBasket();
    const existing = items.find(
      (item) =>
        item.sku === sku &&
        (item.colour ?? null) === colour &&
        (item.fit ?? null) === fit &&
        (item.size ?? null) === size
    );

    const variant = variantLabel({ colour, fit, size });
    const left = leftOf(colour, fit, size);
    const already = Number(existing?.qty) || 0;
    if (left !== undefined && already + want > left) {
      return say(
        left === 0
          ? `Sorry, ${name}${variant ? `, ${variant},` : ''} has sold out.`
          : `Only ${left} of ${name}${variant ? `, ${variant},` : ''} ${left === 1 ? 'is' : 'are'} left${
              already ? `, and ${already} ${already === 1 ? 'is' : 'are'} already in your basket` : ''
            }.`
      );
    }

    if (existing) existing.qty = already + want;
    else items.push({ sku, colour, fit, size, qty: want });

    say(
      writeBasket(items)
        ? `Added ${name}${variant ? `, ${variant}` : ''}. Your basket is on the basket page.`
        : 'Your browser is not letting this site remember a basket, so ordering online will not work. Please call us instead.'
    );
  });
}
