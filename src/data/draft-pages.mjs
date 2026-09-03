/**
 * Every page deliberately kept out of the index, and why.
 *
 * This exists because CI held a noindex page to an SEO budget it can never
 * meet. Lighthouse scores "page is blocked from indexing" as an SEO failure,
 * which is correct in general and wrong for a page whose whole point is not to
 * be indexed yet. The Arabic routes already had that exemption, hard-coded as a
 * regex against `/ar/`, so the rule was really "Arabic pages are allowed to be
 * noindex" when what it meant was "noindex pages are not judged on SEO".
 *
 * Now the reason lives with the route, one entry per page, and three things
 * read it: the Lighthouse assertion matrix, the drift checker, and anyone
 * asking what is left to approve.
 *
 * Removing a route from this list is part of publishing the page. The checker
 * fails if a route here is missing its noindex, or if a page is noindex without
 * being listed, so the two cannot quietly disagree.
 */

/**
 * @typedef {object} DraftPage
 * @property {string} route     Route without a leading slash.
 * @property {'awaiting-content'|'awaiting-legal'|'working-page'} reason
 * @property {string} needs     What has to happen before it is indexed.
 */

/** @type {DraftPage[]} */
export const DRAFT_PAGES = [
  /* who-we-are/what-we-believe left the register in September 2026: the client
     supplied the nine articles of faith, reproduced verbatim.
     who-we-are/pastoral-team left in August 2026: the client supplied both
     biographies and the approved photograph. */
  {
    route: 'who-we-are/core-course',
    reason: 'awaiting-content',
    needs: 'What CORE stands for, the sessions, the next intake, and the cost.',
  },
  {
    route: 'who-we-are/safeguarding',
    reason: 'awaiting-content',
    needs: 'The named contact for a concern, the policy document, and the escalation path.',
  },
  {
    route: 'new-here/what-to-expect',
    reason: 'awaiting-content',
    needs: 'Confirmation of the order of a Sunday and how long the message runs.',
  },
  {
    route: 'new-here/edgekids',
    reason: 'awaiting-content',
    needs: 'The age bands, the room names and the check-in method.',
  },
  {
    route: 'life-at-tte',
    reason: 'awaiting-content',
    needs: 'A description of Life-Link, Champions and 1B2GaS, and when each meets.',
  },
  {
    route: 'privacy-policy',
    reason: 'awaiting-legal',
    needs: 'Legal review, retention periods, and a named privacy contact.',
  },
  {
    route: 'terms-of-use',
    reason: 'awaiting-legal',
    needs: 'Legal review.',
  },
  {
    route: 'brand',
    reason: 'working-page',
    needs: 'Nothing. This is an internal working page and stays out of the index.',
  },
];

/** Routes only, for the checker and the Lighthouse config generator. */
export const DRAFT_ROUTES = DRAFT_PAGES.map((page) => page.route);

/**
 * The Lighthouse URL shape for a route. The build uses `format: 'file'`, so
 * /life-at-tte is life-at-tte.html rather than life-at-tte/index.html.
 * @param {string} route
 */
export const draftHtmlPath = (route) => `/${route}.html`;
