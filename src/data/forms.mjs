/**
 * Where each website form delivers, and the rules it is held to.
 *
 * One file, read by both sides: the pages take the length limits for their
 * `maxlength` attributes and the Turnstile site key for the spam check, and
 * the Worker in worker/forms.js takes the same limits, the destinations and
 * the sender. A limit changed here changes in the browser and on the server at
 * once, so a visitor can never type something the server will then refuse.
 *
 * Destinations are the client's decision of 5 October 2026: everything to the
 * front desk unless specified, and prayer requests to admin@.
 *
 * Changing or adding a destination needs two edits, this file and the
 * `allowed_destination_addresses` list in wrangler.jsonc, because the Worker's
 * email binding is locked to that list and cannot send anywhere else. That lock
 * is the point: even a Worker bug could not turn these forms into a way of
 * emailing strangers. scripts/check-forms.mjs fails the build if the two lists
 * disagree. A new address also has to be verified in Cloudflare before it can
 * receive anything; docs/forms.md has the steps.
 */

/**
 * Cloudflare Turnstile's site key, the public half of the spam check. It is
 * safe in the page source by design. The secret half lives only in the
 * Worker's settings in Cloudflare, as TURNSTILE_SECRET_KEY, and never here.
 *
 * The widget was created in the church's Cloudflare account on 5 October 2026.
 * Which addresses may use it is set there, not here; docs/forms.md lists them.
 * If the widget is ever recreated, both halves change: the new site key goes
 * here and the new secret on the Worker.
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFOPwtxgRGJ7GTxZ';

/** The address the website sends as. It is never a mailbox anyone reads. */
export const FORM_SENDER = {
  email: 'website@thetransedge.com',
  name: 'The Transformation Edge website',
};

/** Where a submission lands, and where the visitor is sent afterwards. */
export const FORMS = {
  contact: { to: 'frontdesk@thetransedge.com', sent: '/get-in-touch/sent' },
  'life-link': { to: 'frontdesk@thetransedge.com', sent: '/get-in-touch/sent' },
  prayer: { to: 'admin@thetransedge.com', sent: '/get-in-touch/prayer/sent' },
};

/** Where anything that could not be sent ends up, whatever the form. */
export const NOT_SENT = '/get-in-touch/not-sent';

/** Field length limits, in characters. Enforced in the browser and the Worker. */
export const LIMITS = {
  name: 100,
  email: 254,
  contact: 254,
  suburb: 80,
  message: 5000,
};
