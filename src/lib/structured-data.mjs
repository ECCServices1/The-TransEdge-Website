/**
 * Structured data, section 21.
 *
 * Built from src/data/church.mjs so a change to a service time or a phone
 * number updates the markup as well as the page, which is the usual place
 * structured data goes stale and starts contradicting the visible content.
 *
 * Jamisontown appears here. That is correct and intended: section 3 permits the
 * suburb in an address block, a map, an event location or structured data.
 */
import { CHURCH, VISION } from '../data/church.mjs';

const DAY_URI = {
  Sunday: 'https://schema.org/Sunday',
  Monday: 'https://schema.org/Monday',
  Tuesday: 'https://schema.org/Tuesday',
  Wednesday: 'https://schema.org/Wednesday',
  Thursday: 'https://schema.org/Thursday',
  Friday: 'https://schema.org/Friday',
  Saturday: 'https://schema.org/Saturday',
};

const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: `${CHURCH.address.unit}, ${CHURCH.address.street}`,
  addressLocality: CHURCH.address.suburb,
  addressRegion: CHURCH.address.state,
  postalCode: CHURCH.address.postcode,
  addressCountry: CHURCH.address.countryCode,
};

/**
 * The organisation itself. Church is a subtype of LocalBusiness in schema.org,
 * so one node satisfies both requirements in section 21 rather than emitting
 * two nodes that describe the same entity and compete.
 */
export function churchSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    '@id': `${CHURCH.url}/#organisation`,
    name: CHURCH.name,
    alternateName: [CHURCH.shortName, CHURCH.initials],
    legalName: CHURCH.legalName,
    description: VISION,
    url: CHURCH.url,
    telephone: CHURCH.phoneE164,
    email: CHURCH.email,
    address: postalAddress,
    areaServed: CHURCH.place,
    logo: `${CHURCH.url}/brand/app-icon.svg`,
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'ABN', value: CHURCH.abn },
      { '@type': 'PropertyValue', propertyID: 'ACN', value: CHURCH.acn },
    ],
    openingHoursSpecification: CHURCH.gatherings.map((g) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_URI[g.isoDay],
      opens: g.isoTime,
    })),
    founder: CHURCH.seniorPastors.map((p) => ({ '@type': 'Person', name: p.name })),
  };
}

/**
 * A gathering as an Event. Emitted for the recurring services so a search
 * result can answer "when" without the visitor opening the page.
 * @param {{ isoDay: string, isoTime: string, day: string, durationMinutes: number }} gathering
 * @param {string} startDate  ISO date of the next occurrence
 */
export function gatheringSchema(gathering, startDate) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${gathering.day} gathering`,
    description: `Our ${gathering.day.toLowerCase()} gathering at ${CHURCH.place}.`,
    startDate: `${startDate}T${gathering.isoTime}:00+10:00`,
    eventSchedule: {
      '@type': 'Schedule',
      byDay: DAY_URI[gathering.isoDay],
      startTime: gathering.isoTime,
      repeatFrequency: 'P1W',
      scheduleTimezone: 'Australia/Sydney',
    },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: CHURCH.name,
      address: postalAddress,
    },
    organizer: { '@id': `${CHURCH.url}/#organisation` },
    isAccessibleForFree: true,
  };
}

/** @param {{ name: string, href: string }[]} trail */
export function breadcrumbSchema(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${CHURCH.url}${crumb.href}`,
    })),
  };
}

/** @param {{ question: string, answer: string }[]} entries */
export function faqSchema(entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

/**
 * An event drawn from Connect.
 * @param {import('./connect.mjs').ConnectEvent} event
 */
export function eventSchema(event) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary,
    startDate: event.startsAt,
    endDate: event.endsAt ?? undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.locationName ?? CHURCH.name,
      address: event.locationAddress ?? postalAddress,
    },
    organizer: { '@id': `${CHURCH.url}/#organisation` },
    image: event.image ? [event.image] : undefined,
    url: `${CHURCH.url}/events/${event.slug}`,
  };
}
