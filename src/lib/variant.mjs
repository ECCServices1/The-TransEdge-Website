/**
 * How a chosen colour, fit and size are written down, everywhere they are
 * written: on the basket page, on Square's payment page and on the receipt.
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

/**
 * The code a chosen colour, fit and size go by in Square's item library, as
 * that variation's SKU: the product's code, then each choice in capitals with
 * spaces and punctuation taken out. "TTE-RAIN-TEE-ESS-NAVY-M",
 * "TTE-RAIN-TEE-DS-GREYAPRICOT-XL". The website finds its stock in Square by
 * this code, and the product page's script works it out too, so it lives here
 * with nothing else attached.
 *
 * @param {{ sku: string, colour?: string|null, fit?: string|null, size?: string|null }} choice
 */
export function stockCode({ sku, colour = null, fit = null, size = null }) {
  /** @param {string} value */
  const part = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '');
  return [sku, ...[colour, fit, size].filter((value) => value).map((value) => part(String(value)))].join('-');
}

/**
 * A stock code as letters and digits only, for comparing it with a SKU a
 * person typed into Square: "TTE-RAIN-TEE-DS-GREY-APRICOT-XL", "tte rain tee ds
 * greyapricot xl" and the code itself all come out the same. check-shop makes
 * sure no two codes on sale here come out the same as each other.
 *
 * @param {string} code
 */
export const squashCode = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
