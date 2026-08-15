// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

import { LOCALES, DEFAULT_LOCALE } from './src/i18n/locales.mjs';

const site = 'https://www.thetransedge.com';

/**
 * Astro locale entries. Mandarin is served at /zh but advertises zh-Hans to
 * search engines, which is the script-accurate tag for Simplified Chinese.
 *
 * Typed as the non-generic i18n config rather than left to inference. The
 * generic form infers literal locale names from an inline array, which this
 * deliberately is not: the locale list has one home, in src/i18n/locales.mjs.
 *
 * @type {import('astro').AstroUserConfig['i18n']}
 */
const i18n = {
  defaultLocale: DEFAULT_LOCALE,
  locales: LOCALES.map((locale) =>
    locale.hreflang === locale.path
      ? locale.path
      : { path: locale.path, codes: /** @type {[string, ...string[]]} */ ([locale.hreflang, locale.path]) }
  ),
  routing: {
    // English is the canonical root. www.thetransedge.com stays unprefixed,
    // which keeps every existing inbound link and printed URL working.
    prefixDefaultLocale: false,
    redirectToDefaultLocale: false,
  },
};

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',

  // Astro types `defaultLocale` by inferring literal locale names from an
  // inline `locales` array. This list is built from src/i18n/locales.mjs so it
  // has one home, which means there are no literals to infer and the inferred
  // type collapses to `never`. The value is correct and the build proves it.
  // @ts-expect-error inferred defaultLocale is `never` for a non-literal locale list
  i18n,

  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: Object.fromEntries(LOCALES.map((l) => [l.path, l.hreflang])),
      },
      filter: (page) => !page.includes('/admin') && !page.includes('/styleguide'),
    }),
  ],

  build: {
    // 'auto' inlines stylesheets under 4kB. That keeps LCP off a second round
    // trip. The cost is style-src 'unsafe-inline' in the CSP; see docs/security.md
    // for why that trade is accepted and how to reverse it.
    inlineStylesheets: 'auto',
    format: 'file',
  },

  image: {
    // Every published photograph goes through the pipeline in scripts/, which
    // strips EXIF before the file ever reaches the repository.
    responsiveStyles: true,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});
