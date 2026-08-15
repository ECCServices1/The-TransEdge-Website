/**
 * Locked facts and locked copy.
 *
 * ============================ DO NOT EDIT ==================================
 * The vision, mission and tagline below are fixed by the brief, section 2.
 * They are reproduced exactly, including punctuation. Do not rephrase, shorten
 * or modernise them, and do not "fix" the em-dash in the mission: it is part of
 * the locked original. The no-em-dash rule applies to new copy, not to these.
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
  'To discover, develop, and empower individuals to become faithful disciples of Jesus Christ. Our mission is to equip believers to influence their communities through the power of the Gospel. We are committed to building a Christian community that is youthful, creative, and purpose-driven—raising leaders who make a lasting impact in every sphere of life.';

export const TAGLINE = 'A Change is Inevitable';

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
 * Renovate Health is a psychotherapy and counselling practice, kept outside the
 * church brand. Pastoral care is never presented as clinical treatment.
 */
export const FAMILY_ORGS = {
  eccs: {
    name: 'Edge Community Care Services Ltd',
    shortName: 'ECCS',
    relationship: 'Sister organisation and community outreach arm',
    separateEntity: true,
    dgrEndorsed: true,
    url: 'https://www.edgecommunitycare.org.au',
  },
  edgedin: {
    name: 'EdgedIn Network',
    shortName: 'EdgedIn',
    relationship: 'Media and publishing arm',
    separateEntity: false,
  },
  renovate: {
    name: 'Renovate Health Consortium Ltd',
    shortName: 'Renovate Health',
    relationship: 'Separate psychotherapy and counselling practice',
    separateEntity: true,
    url: 'https://www.re-nov8.com.au',
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
  bank: {
    accountName: 'The Transformation Edge Ltd',
    bsb: 'TBC-BSB',
    accountNumber: 'TBC-ACCOUNT',
    reference: 'Your name, or OFFERING',
  },
  card: {
    /** Stripe lives inside Connect. There is no card capture on this site. */
    href: `${CHURCH.connectUrl}/give`,
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

/**
 * Crisis pointer, section 8 audience 5 and section 19 screen 8. Always visible
 * on the contact and prayer routes. Pastoral, never clinical.
 */
export const CRISIS_SUPPORT = [
  { name: 'Emergency', detail: 'Call 000', href: 'tel:000' },
  { name: 'Lifeline', detail: '13 11 14, 24 hours', href: 'tel:131114' },
  { name: 'Beyond Blue', detail: '1300 22 4636, 24 hours', href: 'tel:1300224636' },
  { name: '13YARN', detail: '13 92 76, for Aboriginal and Torres Strait Islander people', href: 'tel:139276' },
];
