/**
 * Locked facts and locked copy.
 *
 * ============================ DO NOT EDIT ==================================
 * The vision, mission and tagline below are fixed copy. They are reproduced
 * exactly, including punctuation. Do not rephrase, shorten or modernise them.
 * The vision is from the brief, section 2. The mission is the corrected text
 * supplied by the client in August 2026, which supersedes the section 2
 * wording (and retired the em-dash the original carried).
 *
 * Everything in this file is the single source of truth. A service time, a
 * phone number or an address appears here once and is read everywhere else, so
 * a change is one edit rather than a search.
 * ===========================================================================
 */

import gatheringsData from './gatherings.json' with { type: 'json' };

export const VISION =
  "Our vision is to generously impact nations, building a people with God-likeness, a people who will lead and influence in all areas of life through the knowledge and wisdom of God's word.";

export const MISSION =
  'To discover, develop, and empower individuals to become faithful disciples of Jesus Christ prepared to influence their community with the Gospel. We are committed to building a Christian community that is youthful, creative, and purpose-driven in every sphere of life.';

/*
  Sentence case, no full stop, matching the supplied lockup artwork in
  TTE Masterbrand Production Suite v1.0. This supersedes the title-case form in
  section 2 of the brief, by the client's decision: the artwork is the master and
  the copy now agrees with it rather than contradicting it in print.
*/
export const TAGLINE = 'A change is inevitable';

export const CHURCH = {
  legalName: 'The Transformation Edge Ltd',
  name: 'The Transformation Edge',
  shortName: 'The TransEdge Church',
  initials: 'TTE',

  /**
   * Positioning, section 3. Place is "Penrith, Sydney". The suburb is used only
   * in an address block, a map, an event location or structured data. There is
   * deliberately no "multicultural church in Jamisontown" string anywhere in
   * this codebase, and scripts/check-copy.mjs fails the build if one appears.
   */
  place: 'Penrith, Sydney',

  domain: 'www.thetransedge.com',
  url: 'https://www.thetransedge.com',
  connectUrl: 'https://connect.thetransedge.com',

  seniorPastors: [
    { name: 'Dr Michaels Aibangbee', role: 'Senior Pastor' },
    { name: 'Pastor Osas Aibangbee', role: 'Senior Pastor' },
  ],

  address: {
    unit: 'Unit 1',
    street: '2 Harford Street',
    suburb: 'Jamisontown',
    state: 'NSW',
    postcode: '2750',
    country: 'Australia',
    countryCode: 'AU',
    /** Used for the map link and for LocalBusiness structured data. */
    full: 'Unit 1, 2 Harford Street, Jamisontown NSW 2750, Australia',
  },

  phone: '(02) 7209 1453',
  phoneE164: '+61272091453',
  email: 'frontdesk@thetransedge.com',

  acn: '166 008 377',
  abn: '68 166 008 377',
  registration: 'Registered charity with the ACNC',

  /**
   * Read from gatherings.json rather than written here, because this is the
   * one fact a non-technical editor changes most often and the CMS needs a
   * plain data file to edit. `isoDay` is derived from `day`, so an editor
   * cannot leave the two contradicting each other.
   */
  gatherings: gatheringsData.gatherings.map((g) => ({ ...g, isoDay: g.day })),
};

/**
 * Sister and related organisations, section 7.
 *
 * ECCS is legally separate and DGR-endorsed. Nothing on this site may imply
 * that ECCS services are church programs, or that church involvement is
 * required to access them.
 *
 * Renovate Health was removed from this list, and from the site, by the
 * client's instruction in August 2026: the church site carries no reference
 * to it or to any therapeutic service. Pastoral care is still never presented
 * as clinical treatment; the site simply no longer points anywhere clinical.
 */
export const FAMILY_ORGS = {
  eccs: {
    name: 'Edge Community Care Services Ltd',
    shortName: 'ECCS',
    relationship: 'Sister organisation and community outreach arm',
    separateEntity: true,
    dgrEndorsed: true,
    /** Confirmed by the client, 3 September 2026. */
    url: 'https://www.edgecommunitycareservices.org.au',
  },
  edgedin: {
    name: 'EdgedIn Network',
    shortName: 'EdgedIn',
    relationship: 'Media and publishing arm',
    separateEntity: false,
  },
};

/**
 * Giving, section 13. Two methods, and the two flows are kept apart.
 *
 * A tax-deductible receipt must never be implied for church giving. Bank
 * details are placeholders until the account is confirmed, and the build fails
 * while they are still placeholders: see scripts/check-copy.mjs.
 */
export const GIVING = {
  /*
    Two accounts, either one. Supplied by the client and reproduced exactly:
    a wrong digit here sends someone's gift to a stranger, so these are never
    retyped from memory or reformatted for tidiness.

    accountName was confirmed by the client on 3 September 2026 as the trading
    name, without "Ltd". Several Australian banks now run confirmation of
    payee, and a name that does not match the account warns the giver
    mid-transfer, so this string is the one the bank holds, not the legal name.
  */
  bank: {
    accountName: 'The Transformation Edge',
    accountNameConfirmed: true,
    reference: 'Your name, or OFFERING',
    accounts: [
      { bsb: '633-000', accountNumber: '159 596 881' },
      { bsb: '112-879', accountNumber: '475 901 531' },
    ],
  },
  card: {
    /** Stripe lives inside Connect. There is no card capture on this site.
        The address is the client's, supplied 3 September 2026. */
    href: 'https://connect.thetransedge.com/giving',
    provider: 'Stripe, inside the TTE Connect Hub',
  },
  taxDeductible: false,
  eccs: {
    /** ECCS DGR giving is a separate flow with separate receipting. */
    taxDeductible: true,
    href: FAMILY_ORGS.eccs.url,
    /** Open question 2: confirm whether ECCS runs its own Stripe account. */
    stripeAccountConfirmed: false,
  },
};

/*
  The crisis pointer (000, Lifeline, Beyond Blue, 13YARN) that section 8
  audience 5 and section 19 screen 8 placed on the contact and prayer routes
  was removed by the client's instruction in August 2026, along with every
  other reference to therapeutic services. Recorded here because the brief
  required it and the removal is a client decision, not an oversight.
*/
