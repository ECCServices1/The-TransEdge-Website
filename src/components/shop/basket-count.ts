/**
 * The count beside the basket link in the header. The link itself, and why it
 * appears only inside the shop, are in BasketLink.astro.
 */
import { readBasket } from './basket-store';

const count = document.querySelector<HTMLElement>('[data-basket-count]');
if (count) {
  const paint = () => {
    const total = readBasket().reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
    count.textContent = total > 0 ? ` (${total})` : '';
  };

  paint();
  /* Fired by every change to the basket, so the count is right without a
     reload. */
  window.addEventListener('tte:basket', paint);
  /* Another tab changed the basket. */
  window.addEventListener('storage', paint);
}
