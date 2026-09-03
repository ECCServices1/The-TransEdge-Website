/**
 * Date helpers, fixed to Sydney.
 *
 * The build runs on a machine in an unknown timezone, so nothing here reads the
 * host's local time. A service that starts at 9:30am starts at 9:30am in
 * Sydney, and it must say so on a phone in Tokyo.
 */

const SYDNEY = 'Australia/Sydney';

const DAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/** Today's date in Sydney, as YYYY-MM-DD. */
export function todayInSydney(now = new Date()) {
  // en-CA gives ISO-ordered parts, which is the shortest reliable route to a
  // YYYY-MM-DD string for a named timezone.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SYDNEY,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * The next occurrence of a weekday, as YYYY-MM-DD in Sydney. Today counts, so
 * structured data emitted on a Sunday morning describes that morning.
 * @param {string} dayName  a weekday name; an unknown name throws rather than
 *   silently returning today, because a wrong service date is worse than a crash
 */
export function nextOccurrence(dayName, now = new Date()) {
  const target = DAY_INDEX[dayName];
  if (target === undefined) throw new Error(`Unknown weekday "${dayName}"`);

  const todaySydney = todayInSydney(now);
  const [year, month, day] = todaySydney.split('-').map(Number);

  // Built as UTC midnight purely as a calendar counter. No timezone maths is
  // done on it, so there is no daylight saving hazard here.
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const delta = (target - cursor.getUTCDay() + 7) % 7;
  cursor.setUTCDate(cursor.getUTCDate() + delta);

  return cursor.toISOString().slice(0, 10);
}

/**
 * A calendar file for a gathering or an event. Generated rather than linked,
 * so "add to calendar" works with no third-party service and no tracking.
 * @param {{ title: string, description: string, location: string, start: string, durationMinutes: number, url: string, uid: string }} event
 */
export function toICS(event) {
  const stamp = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(event.start);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);

  // Long lines must be folded at 75 octets per RFC 5545, and commas,
  // semicolons and newlines escaped, or half of Outlook drops the field.
  const escape = (value) => String(value).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const fold = (line) => line.match(/.{1,73}/g)?.join('\r\n ') ?? line;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Transformation Edge//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(start.toISOString())}`,
    `DTEND:${stamp(end.toISOString())}`,
    fold(`SUMMARY:${escape(event.title)}`),
    fold(`DESCRIPTION:${escape(event.description)}`),
    fold(`LOCATION:${escape(event.location)}`),
    fold(`URL:${event.url}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}

/**
 * A Google Calendar template link, for visitors who do not want a file.
 * @param {{ title: string, description: string, location: string, start: string, durationMinutes: number }} event
 */
export function toGoogleCalendarUrl(event) {
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(event.start);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: event.description,
    location: event.location,
    ctz: SYDNEY,
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * An Outlook.com template link, the third calendar a visitor may carry.
 * Outlook takes ISO 8601 instants; UTC keeps the arithmetic identical to the
 * Google link and the .ics file.
 * @param {{ title: string, description: string, location: string, start: string, durationMinutes: number }} event
 */
export function toOutlookCalendarUrl(event) {
  const start = new Date(event.start);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location: event.location,
    body: event.description,
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}
