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
      // Never inline a script into the page. The Content Security Policy in
      // public/_headers allows scripts from this site's own files only
      // ('self', no 'unsafe-inline'), and by default Astro inlines any script
      // under 4kB. Every small script on the site was therefore refused by the
      // browser: the mobile menu's Escape and click-outside handling never ran
      // on any page, and the Turnstile loader that every form depends on could
      // not run either. Measured in Chromium against the real Workers runtime
      // on 5 October 2026. Emitting every script as a file keeps the policy
      // strict and makes the scripts actually run; module scripts are deferred,
      // so the extra file does not hold up the first paint.
      //
      // Astro reads this same setting to decide which stylesheets
      // `inlineStylesheets: 'auto'` inlines, so a flat 0 also pushed every small
      // stylesheet into its own render-blocking file: eight of them on the home
      // page, and 150ms of simulated LCP against a 2000ms budget.
      //
      // Stylesheets go inline up to 10kB rather than the default 4kB, which
      // takes in a shop product page's own styles (about 9kB). As a separate
      // file they held the first paint back until after the requests a browser
      // makes as a page finishes loading, which Lighthouse then counts: the RAIN
      // jumper page measured 1970 to 1990ms with the file and 1820 to 1840ms
      // inline, against a 2000ms budget. The shared layout stylesheet (23kB)
      // stays a file every page caches. The event list's (11kB) stays a file
      // too: inline, it would take the home page's compressed HTML past the
      // 14.6kB a first round trip can carry, which costs a whole round trip.
      // Images keep the default 4kB rule.
      assetsInlineLimit: (filePath, content) => {
        if (filePath.endsWith('.js')) return false;
        if (filePath.endsWith('.css')) return content.length <= 10 * 1024;
        return undefined;
      },
    },
  },
});
