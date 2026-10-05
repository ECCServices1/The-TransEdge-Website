/**
 * Emptying the basket once Stripe has the order, on the page Stripe sends
 * people back to, src/pages/shop/order-complete.astro.
 *
 * The order is with Stripe, so the basket has done its job. Clearing it here
 * rather than before the redirect means somebody who backed out of Stripe's
 * page still has their basket waiting for them.
 *
 * Only when Stripe actually sent them, though. The success_url carries a
 * session id, so its absence means this page was reached some other way: a
 * bookmark, a back button, a shared link. Emptying a basket somebody is still
 * filling, because they pressed back one time too many, is a small disaster for
 * them and an invisible one for us.
 *
 * This runs on every shop page, so it also checks it is on that page: a
 * session id in the address of any other page empties nothing.
 */
import { emptyBasket } from './basket-store';

if (
  document.querySelector('[data-done]') &&
  new URLSearchParams(window.location.search).has('session_id')
) {
  emptyBasket();
}
