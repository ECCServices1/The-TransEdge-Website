// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

import { LOCALES, DEFAULT_LOCALE } from './src/i18n/locales.mjs';

const site = 'https://www.thetransedge.com';

/**
 * Astro locale entries. Mandarin is served at /zh but advertises zh-Hans to
 * search engines, which is the script-accurate tag for Simplified Chinese.
 */
const astroLocales = LOCALES.map((locale) =>
  locale.hreflang === locale.path ? locale.path : { path: locale.path, codes: [locale.hreflang, locale.path] }
);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',

  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: astroLocales,
    routing: {
      // English is the canonical root. www.thetransedge.com stays unprefixed,
      // which keeps every existing inbound link and printed URL working.
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

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
