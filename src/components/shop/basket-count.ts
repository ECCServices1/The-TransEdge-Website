/**
 * The count beside the basket link in the header. The link itself, and why it
 * appears only inside the shop, are in BasketLink.astro.
 */
import { readBasket } from './basket-store';

const count = document.querySelector<HTMLElement>('[data-basket-count]');
/* The same number for the eye on a narrow phone, where the words are hidden. */
const badge = document.querySelector<HTMLElement>('[data-basket-badge]');
if (count) {
  const paint = () => {
    const total = readBasket().reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
    count.textContent = total > 0 ? ` (${total})` : '';
    if (badge) badge.textContent = total > 0 ? String(total) : '';
  };

  paint();
  /* Fired by every change to the basket, so the count is right without a
     reload. */
  window.addEventListener('tte:basket', paint);
  /* Another tab changed the basket. */
  window.addEventListener('storage', paint);
}
