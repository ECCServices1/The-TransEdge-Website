/**
 * The Transformation Edge Conference 2026, tagged RAIN.
 *
 * A standing fact rather than a Connect record. The Connect read API does not
 * exist yet, and the one event the site cannot afford to be missing is the
 * flagship one. So it lives here, is always rendered, and does not depend on a
 * fetch succeeding.
 *
 * Everything below came from the supplied teaser artwork and nothing was
 * inferred. There is deliberately no venue, no daily timetable, no speaker
 * list, no price and no registration link, because none of those were given and
 * a conference page that invents them is worse than one that says "details to
 * come". `registrationUrl` stays null until there is a real one, and the
 * component renders a holding line rather than a dead button.
 */

export const CONFERENCE = {
  name: 'The Transformation Edge Conference',
  /** The theme, as set on the artwork. One word, capitalised. */
  tag: 'RAIN',
  /** The teaser line, verbatim from the artwork. */
  teaser: 'The Rain is Coming',

  /** 13.11.2026 to 15.11.2026, as printed on the artwork. */
  startsAt: '2026-11-13',
  endsAt: '2026-11-15',
  /** For a reader: "13 to 15 November 2026". Built rather than typed twice. */
  get displayDates() {
    const start = new Date(`${this.startsAt}T00:00:00+11:00`);
    const end = new Date(`${this.endsAt}T00:00:00+11:00`);
    const month = new Intl.DateTimeFormat('en-AU', {
      month: 'long',
      timeZone: 'Australia/Sydney',
    }).format(end);
    return `${start.getDate()} to ${end.getDate()} ${month} ${end.getFullYear()}`;
  },

  /** Announced but not yet open. */
  registrationUrl: null,

  /**
   * The artwork exists and is not in this repository. Drop it in as
   * src/assets/photos/E1-rain-2026.jpg and pass it to the teaser component.
   * Until then the teaser is set typographically in the site's own system,
   * which is honest: an approximation of the artwork would be worse than none.
   */
  artworkRef: 'E1',
};

/** Whether the conference is still ahead of a given date. */
export const conferenceIsUpcoming = (today = new Date()) =>
  new Date(`${CONFERENCE.endsAt}T23:59:59+11:00`) >= today;
