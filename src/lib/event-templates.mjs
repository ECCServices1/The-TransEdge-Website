/**
 * Six ways an event can present, and the rule that picks one.
 *
 * The client asked in September 2026 that the events page feed from the TTE
 * Connect hub with as little manual handling as possible, that only active and
 * future events show, and that each event arrive in one of six presentations
 * chosen for it. So the presentation is data. Connect may name a template on
 * the record (`template`); when it does not, the shape of the record decides:
 *
 *   marquee  the flagship. Inverse ground, drawn weather, tag, teaser line,
 *            dates, sessions, artwork. Featured events and conferences.
 *   series   several sessions or several days: the schedule is the point.
 *   poster   artwork-led. A card that opens with the picture.
 *   ticket   registration-led. A stub, a date, one action: register.
 *   numeral  typographic. A large day numeral beside the title. The default.
 *   line     one quiet row, for the recurring and the minor, and for anything
 *            past the fourth position in a long list.
 *
 * Every date is formatted for Sydney, never for the machine the build runs on.
 * The first version of the conference dates read the day with getDate() and
 * printed the wrong day on the UTC build machine; nothing here may consult the
 * system timezone.
 */

export const TEMPLATES = Object.freeze(['marquee', 'series', 'poster', 'ticket', 'numeral', 'line']);

const SYDNEY = 'Australia/Sydney';
const QUIET_KINDS = new Set(['prayer', 'meeting', 'recurring']);

/**
 * @param {import('./connect.mjs').ConnectEvent} event
 * @param {number} position  0-based place in the list it is rendered in
 * @returns {string} one of TEMPLATES
 */
export function templateFor(event, position = 0) {
  if (event.template && TEMPLATES.includes(event.template)) return event.template;
  if (event.featured || event.kind === 'conference') return 'marquee';
  if (event.sessions.length > 1 || isMultiDay(event)) return 'series';
  if (event.artwork || event.image) return 'poster';
  if (event.registrationUrl) return 'ticket';
  if (QUIET_KINDS.has(event.kind) || position >= 4) return 'line';
  return 'numeral';
}

const fmt = (iso, options) =>
  new Intl.DateTimeFormat('en-AU', { timeZone: SYDNEY, ...options }).format(new Date(iso));

/** The pieces a template lays out, each already in Sydney time. */
export function sydneyParts(iso) {
  return {
    weekday: fmt(iso, { weekday: 'long' }),
    weekdayShort: fmt(iso, { weekday: 'short' }),
    day: fmt(iso, { day: 'numeric' }),
    month: fmt(iso, { month: 'long' }),
    monthShort: fmt(iso, { month: 'short' }),
    year: fmt(iso, { year: 'numeric' }),
    time: formatTime(iso),
  };
}

/** "6pm", "9:30am": the site's own way of writing a time. */
export function formatTime(iso) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: SYDNEY,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = get('hour');
  const minute = get('minute');
  const period = get('dayPeriod').replace(/\./g, '').toLowerCase();
  return minute === '00' ? `${hour}${period}` : `${hour}:${minute}${period}`;
}

const dayKey = (iso) => fmt(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });

export function isMultiDay(event) {
  return Boolean(event.endsAt) && dayKey(event.startsAt) !== dayKey(event.endsAt);
}

/** "13 to 15 November 2026", "Friday 13 November 2026", built rather than typed. */
export function formatRange(startsAt, endsAt) {
  const a = sydneyParts(startsAt);
  if (!endsAt || dayKey(startsAt) === dayKey(endsAt)) return `${a.weekday} ${a.day} ${a.month} ${a.year}`;
  const b = sydneyParts(endsAt);
  if (a.month === b.month && a.year === b.year) return `${a.day} to ${b.day} ${a.month} ${a.year}`;
  if (a.year === b.year) return `${a.day} ${a.month} to ${b.day} ${b.month} ${a.year}`;
  return `${a.day} ${a.month} ${a.year} to ${b.day} ${b.month} ${b.year}`;
}
