/**
 * The basket in this browser: reading it, writing it, emptying it.
 *
 * Part of the shop's one script, so import it only from the modules
 * ShopScript.astro brings together. A second importer anywhere else splits it
 * into a file of its own, and that costs a round trip on every shop page.
 *
 * Every access is wrapped, because localStorage throws rather than returning
 * null in a browser set to block site data, and a shop that breaks entirely in
 * a private window is a worse outcome than a shop that forgets.
 *
 * Every change announces itself with a `tte:basket` event, so the count in the
 * header follows without a reload.
 */
import { BASKET_KEY } from '../../lib/basket-key.mjs';

export type Line = {
  sku: string;
  colour?: string | null;
  fit?: string | null;
  size?: string | null;
  qty: number;
};

export function readBasket(): Line[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** False when the browser would not keep it. */
export function writeBasket(items: Line[]): boolean {
  let kept = true;
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(items));
  } catch {
    kept = false;
  }
  window.dispatchEvent(new CustomEvent('tte:basket'));
  return kept;
}

export function emptyBasket() {
  try {
    localStorage.removeItem(BASKET_KEY);
  } catch {
    /* A browser blocking site data had nothing stored to begin with. */
  }
  window.dispatchEvent(new CustomEvent('tte:basket'));
}
