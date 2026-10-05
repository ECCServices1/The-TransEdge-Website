/**
 * How a chosen colour, fit and size are written down, everywhere they are
 * written: on the basket page, on the Stripe page and on the receipt.
 *
 * Its own module, with no catalogue in it, because the basket's script imports
 * it too, and a script that pulled in the whole catalogue would ship it to every
 * visitor's phone.
 *
 * "Forest green, Women's M". "Navy, Kids 8". "Size L" for clothing with one
 * size run and no colours. An empty string for a book.
 *
 * @param {{ colour?: string|null, fit?: string|null, size?: string|null }} choice
 */
export function variantLabel({ colour = null, fit = null, size = null }) {
  const sized = size ? (fit ? `${fit} ${size}` : `size ${size}`) : fit ?? '';
  const parts = [colour, sized].filter(Boolean);
  const label = parts.join(', ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
