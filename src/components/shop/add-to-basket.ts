/**
 * Choosing a colour, fit and size and putting it in the basket, on a product
 * page. The markup, and what happens without JavaScript, are in
 * AddToBasket.astro.
 */
import { readBasket, writeBasket } from './basket-store';
import { variantLabel } from '../../lib/variant.mjs';

for (const buy of document.querySelectorAll<HTMLElement>('[data-buy]')) {
  const add = buy.querySelector<HTMLButtonElement>('[data-add]');
  const qty = buy.querySelector<HTMLSelectElement>('[data-qty]');
  const said = buy.querySelector<HTMLElement>('[data-said]');
  const { sku, name = '' } = buy.dataset;
  const needsSize = buy.dataset.needsSize === 'true';
  const hasColours = buy.dataset.hasColours === 'true';
  if (!add || !qty || !sku) continue;

  /* The colour chooser sits beside the pictures, outside this block. */
  const page = buy.closest('[data-product]') ?? document;

  /* The script is here, so the control works. */
  add.disabled = false;

  const say = (text: string) => {
    if (said) said.textContent = text;
  };

  add.addEventListener('click', () => {
    const colour = hasColours
      ? (page.querySelector<HTMLInputElement>('[data-colour-choice]:checked')?.value ?? null)
      : null;
    if (hasColours && !colour) return say('Choose a colour first.');

    let fit: string | null = null;
    let size: string | null = null;
    if (needsSize) {
      const fitInput = buy.querySelector<HTMLInputElement>('[data-fit-choice]:checked');
      const fitIndex = fitInput?.dataset.fitChoice ?? '0';
      fit = fitInput?.value ?? (buy.dataset.singleFit || null);
      size =
        buy.querySelector<HTMLInputElement>(`[data-fit-sizes="${fitIndex}"] [data-size]:checked`)
          ?.value ?? null;
      if (!size) return say('Choose a size first.');
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

    if (existing) existing.qty = (Number(existing.qty) || 0) + want;
    else items.push({ sku, colour, fit, size, qty: want });

    const variant = variantLabel({ colour, fit, size });
    say(
      writeBasket(items)
        ? `Added ${name}${variant ? `, ${variant}` : ''}. Your basket is on the basket page.`
        : 'Your browser is not letting this site remember a basket, so ordering online will not work. Please call us instead.'
    );
  });
}
