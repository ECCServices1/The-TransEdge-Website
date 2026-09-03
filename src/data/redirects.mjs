/**
 * Single source of truth for redirects. `npm run build` generates
 * public/_redirects from this file, so a redirect is reviewed as a code change
 * rather than edited by hand in a generated artefact.
 *
 * Status codes
 *   301  the old address is retired for good. Use this for Wix, portal and
 *        Elvanto routes, so search engines transfer their equity.
 *   302  temporary. Use only while a destination is still being built.
 *
 * THE WIX EXPORT IS WAIVED. The families below cover Wix's route conventions
 * and the IA in section 9. The client ruled on 3 September 2026 that this is a
 * clean build and the live Wix route list is not needed, so nothing further is
 * extracted; the rules stay as a courtesy net for printed bulletins and QR
 * codes. docs/sitemap-and-redirects.md keeps the procedure in case that is
 * ever revisited.
 */

/** @typedef {{ from: string, to: string, status?: number, note?: string }} Redirect */

/** Wix member area and any legacy sign-in route. Connect is now the front door. */
const connectRoutes = [
  { from: '/portal', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/portal/*', to: 'https://connect.thetransedge.com/:splat', status: 301 },
  { from: '/login', to: 'https://connect.thetransedge.com/sign-in', status: 301 },
  { from: '/signin', to: 'https://connect.thetransedge.com/sign-in', status: 301 },
  { from: '/sign-in', to: 'https://connect.thetransedge.com/sign-in', status: 301 },
  { from: '/account', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/account/*', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/member', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/members', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/members-area', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/my-account', to: 'https://connect.thetransedge.com', status: 301 },
];

/**
 * Elvanto is retired entirely. These paths are still live in printed bulletins
 * and on QR codes, so they redirect rather than 404. Deep links land on the
 * Connect equivalent where one exists, and on Connect's root where it does not.
 */
const elvantoRoutes = [
  { from: '/elvanto', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/elvanto/*', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/church', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/church/*', to: 'https://connect.thetransedge.com', status: 301 },
  { from: '/roster', to: 'https://connect.thetransedge.com/rosters', status: 301 },
  { from: '/rosters', to: 'https://connect.thetransedge.com/rosters', status: 301 },
  { from: '/volunteer', to: 'https://connect.thetransedge.com/rosters', status: 301 },
  { from: '/groups', to: '/life-at-tte/life-link', status: 301 },
  { from: '/small-groups', to: '/life-at-tte/life-link', status: 301 },
];

/** Wix page routes, mapped to the section 9 information architecture. */
const wixPageRoutes = [
  { from: '/home', to: '/', status: 301 },
  { from: '/about', to: '/who-we-are', status: 301 },
  { from: '/about-us', to: '/who-we-are', status: 301 },
  { from: '/our-story', to: '/who-we-are', status: 301 },
  { from: '/vision', to: '/who-we-are/vision-and-mission', status: 301 },
  { from: '/vision-mission', to: '/who-we-are/vision-and-mission', status: 301 },
  { from: '/beliefs', to: '/who-we-are/what-we-believe', status: 301 },
  { from: '/what-we-believe', to: '/who-we-are/what-we-believe', status: 301 },
  { from: '/leadership', to: '/who-we-are/pastoral-team', status: 301 },
  { from: '/our-team', to: '/who-we-are/pastoral-team', status: 301 },
  { from: '/pastors', to: '/who-we-are/pastoral-team', status: 301 },
  { from: '/core', to: '/who-we-are/core-course', status: 301 },
  { from: '/core-course', to: '/who-we-are/core-course', status: 301 },
  { from: '/safeguarding', to: '/who-we-are/safeguarding', status: 301 },
  { from: '/child-safe', to: '/who-we-are/safeguarding', status: 301 },

  { from: '/visit', to: '/new-here/plan-your-visit', status: 301 },
  { from: '/plan-a-visit', to: '/new-here/plan-your-visit', status: 301 },
  { from: '/plan-your-visit', to: '/new-here/plan-your-visit', status: 301 },
  { from: '/new', to: '/new-here', status: 301 },
  { from: '/im-new', to: '/new-here', status: 301 },
  { from: '/what-to-expect', to: '/new-here/what-to-expect', status: 301 },
  { from: '/find-us', to: '/new-here/find-us', status: 301 },
  { from: '/location', to: '/new-here/find-us', status: 301 },
  { from: '/locations', to: '/new-here/find-us', status: 301 },
  { from: '/service-times', to: '/new-here/plan-your-visit', status: 301 },
  { from: '/faq', to: '/new-here/faq', status: 301 },
  { from: '/kids', to: '/new-here/edgekids', status: 301 },
  { from: '/edge-kids', to: '/new-here/edgekids', status: 301 },
  { from: '/edgekids', to: '/new-here/edgekids', status: 301 },
  { from: '/children', to: '/new-here/edgekids', status: 301 },

  { from: '/sermons', to: '/watch-and-listen', status: 301 },
  { from: '/messages', to: '/watch-and-listen', status: 301 },
  { from: '/watch', to: '/watch-and-listen', status: 301 },
  { from: '/live', to: '/watch-and-listen/live', status: 301 },
  { from: '/livestream', to: '/watch-and-listen/live', status: 301 },
  { from: '/media', to: '/watch-and-listen', status: 301 },

  // /edgedin, /events, /give and /outreach keep their existing paths in the new
  // information architecture, so they need no rule. A rule pointing a path at
  // itself is a redirect loop in production, which is why the generator rejects one.
  { from: '/podcast', to: '/edgedin', status: 301 },
  { from: '/radio', to: '/edgedin', status: 301 },
  { from: '/devotionals', to: '/edgedin', status: 301 },
  { from: '/blog', to: '/edgedin', status: 301 },
  { from: '/post/*', to: '/edgedin', status: 301, note: 'Wix blog posts. Replace with per-post mappings from the export.' },

  { from: '/ministries', to: '/life-at-tte', status: 301 },
  { from: '/life-link', to: '/life-at-tte/life-link', status: 301 },
  { from: '/lifelink', to: '/life-at-tte/life-link', status: 301 },
  { from: '/champions', to: '/life-at-tte/champions', status: 301 },
  { from: '/serve', to: '/life-at-tte/serve-teams', status: 301 },
  { from: '/1b2gas', to: '/life-at-tte/1b2gas', status: 301 },

  { from: '/event-details/*', to: '/events', status: 301, note: 'Wix event route. Replace with per-event mappings from the export.' },
  { from: '/calendar', to: '/events', status: 301 },

  { from: '/giving', to: '/give', status: 301 },
  { from: '/donate', to: '/give', status: 301 },
  { from: '/tithe', to: '/give', status: 301 },
  { from: '/offering', to: '/give', status: 301 },

  { from: '/contact', to: '/get-in-touch', status: 301 },
  { from: '/contact-us', to: '/get-in-touch', status: 301 },
  { from: '/prayer', to: '/get-in-touch/prayer', status: 301 },
  { from: '/prayer-request', to: '/get-in-touch/prayer', status: 301 },

  { from: '/eccs', to: '/outreach', status: 301 },
  { from: '/community', to: '/outreach', status: 301 },

  { from: '/privacy', to: '/privacy-policy', status: 301 },
  { from: '/terms', to: '/terms-of-use', status: 301 },
];

/**
 * Wix ships commerce and booking routes the new site has no equivalent for.
 * They redirect to the nearest real destination rather than 404, because these
 * paths are indexed and a 404 loses whatever equity they carry.
 */
const retiredRoutes = [
  { from: '/plans-pricing', to: '/give', status: 301 },
  { from: '/bookings-checkout/*', to: '/events', status: 301 },
  { from: '/service-page/*', to: '/events', status: 301 },
  { from: '/shop', to: '/', status: 301 },
  { from: '/product-page/*', to: '/', status: 301 },
];

/** @type {Redirect[]} */
export const redirects = [
  ...connectRoutes,
  ...elvantoRoutes,
  ...wixPageRoutes,
  ...retiredRoutes,
];

/**
 * Localised routes get the same treatment. A visitor who lands on an old
 * English URL with a locale preference is not bounced to English.
 */
export const localeAwareNote =
  'Locale prefixes are handled by Astro routing, not by _redirects. An unprefixed legacy route lands on English, which is correct: the visitor came from an English link.';
