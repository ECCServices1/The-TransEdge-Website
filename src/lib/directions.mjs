/**
 * Every navigation app a visitor is likely to have, from one address.
 *
 * "Get directions" used to mean Google Maps, which decided for the visitor
 * which app they use. The client asked in September 2026 that the visitor
 * choose. These are universal links: each opens the app where it is installed
 * and the web version where it is not, and none of them needs an API key or
 * sets a cookie on our side.
 *
 * @param {string} address  The destination, as a human-readable address.
 * @returns {{ label: string, href: string, external: true }[]}
 */
export function directionsOptions(address) {
  const q = encodeURIComponent(address);
  return [
    { label: 'Apple Maps', href: `https://maps.apple.com/?daddr=${q}&dirflg=d`, external: true },
    { label: 'Google Maps', href: `https://www.google.com/maps/dir/?api=1&destination=${q}`, external: true },
    { label: 'Waze', href: `https://www.waze.com/ul?q=${q}&navigate=yes`, external: true },
  ];
}
