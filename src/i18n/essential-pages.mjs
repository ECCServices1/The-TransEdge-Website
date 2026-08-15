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

/** @typedef {{ slug: string, titleKey: string, kind: 'visit'|'expect'|'find'|'kids'|'contact' }} EssentialPage */

/** @type {EssentialPage[]} */
export const ESSENTIAL_PAGES = [
  { slug: 'new-here/plan-your-visit', titleKey: 'visit.title', kind: 'visit' },
  { slug: 'new-here/what-to-expect', titleKey: 'visit.whatToExpect', kind: 'expect' },
  { slug: 'new-here/find-us', titleKey: 'visit.where', kind: 'find' },
  { slug: 'new-here/edgekids', titleKey: 'visit.forYourKids', kind: 'kids' },
  { slug: 'get-in-touch', titleKey: 'contact.title', kind: 'contact' },
];
