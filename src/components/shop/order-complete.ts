/**
 * Emptying the basket once Square has the order, on the page Square sends
 * people back to, src/pages/shop/order-complete.astro.
 *
 * The order is with Square, so the basket has done its job. Clearing it here
 * rather than before the redirect means somebody who backed out of Square's
 * page still has their basket waiting for them.
 *
 * Only when Square actually sent them, though. The address the Worker gives
 * Square to send people back to carries the order's reference, so its absence
 * means this page was reached some other way: a bookmark, a back button, a
 * shared link. Emptying a basket somebody is still
 * filling, because they pressed back one time too many, is a small disaster for
 * them and an invisible one for us.
 *
 * This runs on every shop page, so it also checks it is on that page: a
 * reference in the address of any other page empties nothing.
 */
import { emptyBasket } from './basket-store';

if (
  document.querySelector('[data-done]') &&
  new URLSearchParams(window.location.search).has('ref')
) {
  emptyBasket();
}
