/**
 * The visitor-essential set, section 15.
 *
 * These pages exist in every launch locale. Everything else stays English until
 * phase 2, and adding a page per locale is one entry here.
 *
 * This lives in its own module because Astro hoists `getStaticPaths` above the
 * rest of a page's frontmatter, so anything it references has to be imported
 * rather than declared alongside it.
 *
 * `slug` is the route below the locale prefix, so Arabic Plan Your Visit is
 * /ar/new-here/plan-your-visit and the English original is
 * /new-here/plan-your-visit. The shape of the site is identical in every
 * language.
 */

/**
 * `titleKey` is checked against the English string set, so a typo here is a
 * build error rather than a page whose heading silently renders the key.
 *
 * @typedef {{ slug: string, titleKey: import('./ui.mjs').UiKey, kind: 'visit'|'expect'|'find'|'kids'|'contact' }} EssentialPage
 */

/** @type {EssentialPage[]} */
export const ESSENTIAL_PAGES = [
  { slug: 'new-here/plan-your-visit', titleKey: 'visit.title', kind: 'visit' },
  { slug: 'new-here/what-to-expect', titleKey: 'visit.whatToExpect', kind: 'expect' },
  { slug: 'new-here/find-us', titleKey: 'visit.where', kind: 'find' },
  { slug: 'new-here/edgekids', titleKey: 'visit.forYourKids', kind: 'kids' },
  { slug: 'get-in-touch', titleKey: 'contact.title', kind: 'contact' },
];

/**
 * Where a visitor lands when they switch to a language that does not have the
 * page they are currently on. Plan Your Visit, because someone changing the
 * site into their own language is overwhelmingly likely to be working out
 * whether to come.
 */
export const LOCALE_ENTRY_SLUG = 'new-here/plan-your-visit';

/**
 * Whether a route actually exists in a locale.
 *
 * English has the whole site. Every other language has the visitor-essential
 * set and nothing else, per section 15.
 *
 * This function is the reason the locale switcher no longer offers links that
 * 404. It used to map over every locale for whatever route it was on, so
 * switching to Arabic from the Give page offered /ar/give, which was never
 * built. That was 110 dead links across the site, all of them invisible to a
 * reader of the source, because the switcher is one component rendered on every
 * page in seven languages.
 *
 * @param {string} localePath
 * @param {string} route  route without a leading slash, '' for home
 */
export function localeHasRoute(localePath, route) {
  if (localePath === 'en') return true;
  const clean = route.replace(/^\/+|\/+$/g, '');
  return ESSENTIAL_PAGES.some((page) => page.slug === clean);
}

/**
 * A navigation href that resolves.
 *
 * The header and footer are rendered inside every locale, and they list the
 * whole site. Prefixing the current locale onto every one of those routes
 * produced links like /zh/give, which was never built: the navigation on a
 * translated page pointed almost entirely at 404s.
 *
 * So a route that exists in this locale keeps the locale prefix, and a route
 * that does not falls back to the English page, which does exist. A visitor
 * reading Plan Your Visit in Korean and tapping Give lands on the English Give
 * page rather than an error, which is the honest behaviour while only the
 * visitor-essential set is translated.
 *
 * @param {(localePath: string, route?: string) => string} localeHref
 * @param {string} localePath
 * @param {string} route
 */
export function resolvedLocaleHref(localeHref, localePath, route) {
  return localeHasRoute(localePath, route)
    ? localeHref(localePath, route)
    : localeHref('en', route);
}
