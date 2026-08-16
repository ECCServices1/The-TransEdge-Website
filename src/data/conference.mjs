/**
 * The Transformation Edge Conference 2026, tagged RAIN.
 *
 * A standing fact rather than a Connect record. The Connect read API does not
 * exist yet, and the one event the site cannot afford to be missing is the
 * flagship one. So it lives here, is always rendered, and does not depend on a
 * fetch succeeding.
 *
 * Everything below came from the supplied artwork and nothing was inferred.
 * The first teaser gave the name, tag, line and dates. The master poster of
 * August 2026 (RAIN_2026_Master_Poster_Landscape_New_Brand) added the session
 * times, the open-air crusade, the ministers, the venue, and the fact that
 * changes the call to action: NO REGISTRATION REQUIRED, printed in those
 * words. There is still no price and no timetable beyond the sessions,
 * because none were given.
 */

import { CHURCH } from './church.mjs';

export const CONFERENCE = {
  name: 'The Transformation Edge Conference',
  /** The theme, as set on the artwork. One word, capitalised. */
  tag: 'RAIN',
  /** The teaser line, verbatim from the artwork. */
  teaser: 'The Rain is Coming',

  /** 13.11.2026 to 15.11.2026, as printed on the artwork. */
  startsAt: '2026-11-13',
  endsAt: '2026-11-15',

  /** Session times, verbatim from the master poster. */
  sessions: [
    { day: 'Friday', time: '6pm' },
    { day: 'Saturday', time: '4pm' },
    { day: 'Sunday', time: '4pm' },
  ],

  /** The open-air crusade, from the master poster. */
  crusade: { day: 'Saturday 14 November', time: '4pm' },

  /** As billed on the artwork. The site's canonical names for the Senior
      Pastors live in church.mjs; these are the guest ministers. */
  ministers: ['Min. Nelly Ewelike', 'Min. Eseosa Ohenhen'],

  /** The poster prints the church's own address as the venue. Built from the
      one address source so a venue typo cannot exist separately. */
  venue: `${CHURCH.address.unit}, ${CHURCH.address.street}, ${CHURCH.address.suburb} ${CHURCH.address.state}`,

  /** "NO REGISTRATION REQUIRED", verbatim on the poster. This is why there is
      no registration link: there is nothing to register for. Doors open. */
  registrationRequired: false,
  /**
   * For a reader: "13 to 15 November 2026". Built rather than typed twice.
   *
   * Every part is formatted through Intl with the Sydney timezone. The first
   * version read the day with getDate(), which uses the machine's own clock:
   * correct on a Sydney laptop, and a day early on the UTC build machine,
   * where it printed "12 to 14" on every page. A conference date that is
   * wrong by one day is the worst kind of wrong, so nothing here may consult
   * the system timezone.
   */
  get displayDates() {
    const start = new Date(`${this.startsAt}T00:00:00+11:00`);
    const end = new Date(`${this.endsAt}T00:00:00+11:00`);
    const sydney = { timeZone: 'Australia/Sydney' };
    const day = new Intl.DateTimeFormat('en-AU', { day: 'numeric', ...sydney });
    const month = new Intl.DateTimeFormat('en-AU', { month: 'long', ...sydney }).format(end);
    const year = new Intl.DateTimeFormat('en-AU', { year: 'numeric', ...sydney }).format(end);
    return `${day.format(start)} to ${day.format(end)} ${month} ${year}`;
  },

  /** Superseded by registrationRequired: false. Kept so a future ticketed
      event can flip one flag and add one URL without a component change. */
  registrationUrl: null,

  /**
   * The artwork is in the repository now: E1-rain-2026.jpg is the master
   * poster (on the home chapter), E1-rain-ministers.jpg is the hosts and
   * speakers social (on the events card). Both converted from the supplied
   * PNGs, not re-graded: designed artwork keeps its own colour.
   */
  artworkRef: 'E1',
};

/** Whether the conference is still ahead of a given date. */
export const conferenceIsUpcoming = (today = new Date()) =>
  new Date(`${CONFERENCE.endsAt}T23:59:59+11:00`) >= today;
