/**
 * Interface strings.
 *
 * ================== ON WHY THE NON-ENGLISH FILES ARE EMPTY ==================
 * Section 15 and section 22 are explicit: human translation, reviewed by a
 * native speaker from the congregation before publishing, and machine output is
 * not published unreviewed. So the six launch locales ship with the routing,
 * the fonts, the direction handling and the switcher all working, and with
 * English strings showing until a reviewed translation is supplied.
 *
 * A locale with no reviewed strings renders in English and is marked
 * `noindex`, so nobody lands on a half-translated page from a search result.
 * The moment a reviewed file lands, the locale is indexed. Nothing else changes.
 *
 * To add a reviewed translation:
 *   1. fill src/i18n/strings/<locale>.mjs
 *   2. set the reviewer and date in TRANSLATION_STATUS below
 *   3. the locale is indexed on the next deploy
 * ===========================================================================
 */

import { LOCALES, DEFAULT_LOCALE } from './locales.mjs';

/**
 * English is the source. Every key here must exist before a locale is translated.
 *
 * @typedef {keyof typeof en} UiKey
 */
export const en = {
  'site.name': 'The Transformation Edge',
  'site.skipToContent': 'Skip to content',

  'nav.home': 'Home',
  'nav.whoWeAre': 'Who We Are',
  'nav.newHere': 'New Here',
  'nav.watchAndListen': 'Watch and Listen',
  'nav.edgedin': 'EdgedIn Network',
  'nav.lifeAtTte': 'Life at TTE',
  'nav.events': 'Events',
  'nav.outreach': 'Outreach',
  'nav.give': 'Give',
  'nav.getInTouch': 'Get in Touch',
  'nav.connect': 'Connect',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.primary': 'Primary',
  'nav.footer': 'Footer',

  'connect.open': 'Open Connect',
  'connect.signIn': 'Sign in to Connect',
  'connect.description': 'Rosters, groups, giving and your details, all in one place.',

  'home.planVisit': 'Plan your visit',
  'home.watchLatest': 'Watch the latest message',

  'visit.title': 'Plan your visit',
  'visit.when': 'When we gather',
  'visit.where': 'Where to find us',
  'visit.sunday': 'Sunday',
  'visit.midweek': 'Wednesday',
  'visit.addToCalendar': 'Add to calendar',
  'visit.getDirections': 'Get directions',
  'visit.whatToExpect': 'What to expect',
  'visit.forYourKids': 'For your kids',
  'visit.howLong': 'About an hour and three quarters, including time afterwards for a cup of tea.',
  'visit.singledOut': 'You will not be singled out, asked to stand, or asked to give.',
  'visit.lookFor': 'Look for the welcome desk inside the main entrance.',

  'locale.switch': 'Language',
  'locale.current': 'Current language',
  'locale.englishOnly': 'This page is available in English only for now.',
  'locale.awaitingReview':
    'This language is being translated by members of our congregation. For now the page shows English.',

  'give.title': 'Give',
  'give.bankTransfer': 'Direct bank transfer',
  'give.card': 'Card giving',
  'give.cardVia': 'Card giving happens inside the TTE Connect Hub.',
  'give.notDeductible':
    'Giving to our church is not tax deductible. Edge Community Care Services is separately endorsed as a deductible gift recipient and has its own giving flow.',

  'contact.title': 'Get in touch',
  'contact.prayer': 'Ask for prayer',
  'contact.responseTime': 'We read everything that comes in and reply within two working days.',
  'contact.private': 'A prayer request goes to the pastoral team only.',

  'events.title': 'Events',
  'events.none': 'There is nothing in the diary just now. Check back soon.',
  'events.register': 'Register',
  'events.registerVia': 'Registration happens in Connect.',

  'edgedin.title': 'EdgedIn Network',
  'edgedin.latest': 'Latest release',
  'edgedin.play': 'Play',
  'edgedin.pause': 'Pause',
  'edgedin.subscribe': 'Subscribe',

  'error.404.title': 'That page has moved on',
  'error.404.body':
    'The address you followed does not exist any more. The links below cover what most people are looking for.',
  'error.search': 'Search the site',

  'footer.acknowledgement':
    'We gather on the land of the Dharug people, and we pay our respects to Elders past and present.',
  'footer.charity': 'Registered charity with the ACNC',
  'footer.safeguarding': 'Child safe policy',
  'footer.privacy': 'Privacy policy',
};

/**
 * Reviewed translations. A locale stays out of the index until its reviewer is
 * recorded here, which answers open question 3 in the brief by making the
 * answer a required field rather than a note in a document.
 */
export const TRANSLATION_STATUS = {
  en: { reviewer: 'Source language', reviewedOn: null, status: 'source' },
  zh: { reviewer: null, reviewedOn: null, status: 'awaiting-reviewer' },
  ar: { reviewer: null, reviewedOn: null, status: 'awaiting-reviewer' },
  hi: { reviewer: null, reviewedOn: null, status: 'awaiting-reviewer' },
  sw: { reviewer: null, reviewedOn: null, status: 'awaiting-reviewer' },
  ja: { reviewer: null, reviewedOn: null, status: 'awaiting-reviewer' },
  ko: { reviewer: null, reviewedOn: null, status: 'awaiting-reviewer' },
};

/**
 * Reviewed string sets, keyed by locale. Empty until a native speaker from the
 * congregation has reviewed them. Import and register here when they land.
 * @type {Record<string, Partial<typeof en>>}
 */
export const translations = {
  en,
  zh: {},
  ar: {},
  hi: {},
  sw: {},
  ja: {},
  ko: {},
};

/** True when the locale has reviewed strings and may be indexed. */
export function isPublishable(locale) {
  const status = TRANSLATION_STATUS[locale];
  if (!status) return false;
  if (status.status === 'source') return true;
  return status.status === 'reviewed' && Boolean(status.reviewer);
}

/**
 * Returns a lookup for the locale, falling back to English per key.
 * @param {string} locale
 */
export function useTranslations(locale) {
  const strings = translations[locale] ?? {};
  /** @param {keyof typeof en} key */
  return function t(key) {
    return strings[key] ?? en[key] ?? key;
  };
}

/** Every locale that is fully reviewed, for the sitemap and the switcher. */
export const publishableLocales = LOCALES.filter((l) => isPublishable(l.path));

export { DEFAULT_LOCALE };
