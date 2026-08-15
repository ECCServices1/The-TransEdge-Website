/**
 * Launch locales for The Transformation Edge.
 *
 * `path`      the URL segment, so Arabic lives at /ar/plan-your-visit
 * `hreflang`  the tag emitted in <link rel="alternate"> and the sitemap
 * `dir`       text direction, driving the dir attribute and every logical property
 * `endonym`   the language name in its own language, which is what the switcher shows
 * `fontStack` the token name of the script-specific stack loaded for this locale
 *
 * Adding a locale is a single entry here plus a translation file. Nothing else
 * in the build needs to change.
 */
export const LOCALES = [
  { path: 'en', hreflang: 'en-AU', dir: 'ltr', endonym: 'English', english: 'English', fontStack: 'latin' },
  { path: 'zh', hreflang: 'zh-Hans', dir: 'ltr', endonym: '简体中文', english: 'Mandarin', fontStack: 'sc' },
  { path: 'ar', hreflang: 'ar', dir: 'rtl', endonym: 'العربية', english: 'Arabic', fontStack: 'arabic' },
  { path: 'hi', hreflang: 'hi', dir: 'ltr', endonym: 'हिन्दी', english: 'Hindi', fontStack: 'devanagari' },
  { path: 'sw', hreflang: 'sw', dir: 'ltr', endonym: 'Kiswahili', english: 'Swahili', fontStack: 'latin' },
  { path: 'ja', hreflang: 'ja', dir: 'ltr', endonym: '日本語', english: 'Japanese', fontStack: 'jp' },
  { path: 'ko', hreflang: 'ko', dir: 'ltr', endonym: '한국어', english: 'Korean', fontStack: 'kr' },
];

export const DEFAULT_LOCALE = 'en';

/** Locales other than English, which is what the non-default routes are built from. */
export const TRANSLATED_LOCALES = LOCALES.filter((l) => l.path !== DEFAULT_LOCALE);

/* The visitor-essential set lives in ./essential-pages.mjs, so that Astro's
   getStaticPaths hoisting can import it. */

/** @param {string} path */
export function getLocale(path) {
  return LOCALES.find((l) => l.path === path) ?? LOCALES[0];
}

/**
 * Reads the locale out of a URL pathname. Returns the default locale for
 * unprefixed routes, which is how English stays at the site root.
 * @param {string} pathname
 */
export function localeFromPathname(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0];
  return LOCALES.find((l) => l.path === segment) ?? getLocale(DEFAULT_LOCALE);
}

/**
 * Builds a locale-correct href. English returns an unprefixed path.
 * @param {string} localePath
 * @param {string} route  route without a leading slash, '' for home
 */
export function localeHref(localePath, route = '') {
  const clean = route.replace(/^\/+|\/+$/g, '');
  if (localePath === DEFAULT_LOCALE) return clean ? `/${clean}` : '/';
  return clean ? `/${localePath}/${clean}` : `/${localePath}`;
}
