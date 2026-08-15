/**
 * The Connect content layer, section 12.
 *
 * Connect is the system of record. This site is a read layer over it. Events,
 * sermons and EdgedIn assets are fetched at build time and never duplicated
 * into the repository as authored content.
 *
 * THE FALLBACK IS THE POINT
 * If Connect is unreachable at build time, the last successful payload is used
 * and an alert is raised. The site never ships an empty section. That is a hard
 * requirement, because the alternative is a deploy at 6am on a Sunday that
 * quietly removes every event from the site.
 *
 * Order of preference:
 *   1. a live fetch from Connect
 *   2. the committed snapshot in src/data/connect/
 *   3. an empty list, with the calling page rendering its own standing content
 *
 * Cases 2 and 3 both raise an alert. Case 3 is a launch blocker.
 *
 * HARD DEPENDENCY, still open
 * Part E question 1 is unanswered: whether Connect exposes a read API and what
 * its authentication model is. Until CONNECT_API_URL is set in the Cloudflare
 * Pages environment, every call here resolves from the snapshot, which is what
 * lets events and EdgedIn ship as static content at launch and switch over in
 * phase 2 without a code change. The contract this layer expects is written up
 * in docs/connect-api-contract.md.
 */

import events from '../data/connect/events.snapshot.json';
import episodes from '../data/connect/episodes.snapshot.json';
import sermons from '../data/connect/sermons.snapshot.json';

/**
 * @typedef {object} ConnectEvent
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} summary
 * @property {string} startsAt      ISO 8601 with offset
 * @property {string|null} endsAt
 * @property {string} displayDate   pre-formatted for Australia/Sydney
 * @property {string|null} locationName
 * @property {object|null} locationAddress
 * @property {string|null} image
 * @property {string|null} registrationUrl  a Connect URL, registration happens there
 */

/**
 * @typedef {object} ConnectEpisode
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} strand        podcast | youtube | radio | devotional | publishing
 * @property {string} summary
 * @property {string} publishedAt
 * @property {number|null} durationSeconds
 * @property {string|null} audioUrl
 * @property {string|null} videoId
 * @property {string|null} image
 */

const SNAPSHOTS = {
  events,
  episodes,
  sermons,
};

/** Endpoints this layer expects. Documented in docs/connect-api-contract.md. */
const ENDPOINTS = {
  events: '/v1/events?status=published&from=now',
  episodes: '/v1/edgedin/assets?status=published',
  sermons: '/v1/sermons?status=published',
};

/** Raised to the build log and, in CI, to the nominated alert address. */
const alerts = [];

export function getBuildAlerts() {
  return [...alerts];
}

function alert(level, message) {
  alerts.push({ level, message });
  const prefix = level === 'error' ? 'CONNECT ERROR' : 'CONNECT WARNING';
  console[level === 'error' ? 'error' : 'warn'](`${prefix}: ${message}`);
}

/**
 * Fetches a collection, falling back to the committed snapshot.
 * @param {keyof typeof ENDPOINTS} collection
 */
async function fetchCollection(collection) {
  const base = import.meta.env.CONNECT_API_URL;
  const token = import.meta.env.CONNECT_API_TOKEN;

  if (!base) {
    alert(
      'warn',
      `CONNECT_API_URL is not set, so ${collection} is being served from the committed snapshot. ` +
        `This is expected before the Connect read API exists. It is a launch blocker only if the ` +
        `snapshot is also empty.`
    );
    return SNAPSHOTS[collection];
  }

  try {
    const response = await fetch(new URL(ENDPOINTS[collection], base), {
      headers: {
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      // A slow Connect must not hang a deploy indefinitely.
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data;

    if (!Array.isArray(items)) {
      throw new Error('response was not an array and had no data array');
    }

    // An empty live response is treated as suspect rather than authoritative.
    // Connect having zero published events is possible, but it is far more
    // often a filter or permission problem, and shipping an empty section is
    // the outcome the brief forbids.
    if (items.length === 0 && SNAPSHOTS[collection].length > 0) {
      alert(
        'error',
        `Connect returned zero ${collection} while the snapshot holds ${SNAPSHOTS[collection].length}. ` +
          `Serving the snapshot. Check the query and the token scope before assuming the diary is genuinely empty.`
      );
      return SNAPSHOTS[collection];
    }

    return items;
  } catch (error) {
    alert(
      'error',
      `Could not read ${collection} from Connect (${error instanceof Error ? error.message : error}). ` +
        `Serving the last successful snapshot of ${SNAPSHOTS[collection].length} item(s).`
    );
    return SNAPSHOTS[collection];
  }
}

/**
 * Validates and normalises one event. A malformed record is dropped rather
 * than allowed to throw mid-render and take the whole build with it.
 * @returns {ConnectEvent|null}
 */
function normaliseEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { id, slug, title, startsAt } = raw;
  if (!id || !slug || !title || !startsAt) {
    alert('warn', `Dropped a malformed event record: ${JSON.stringify(raw).slice(0, 120)}`);
    return null;
  }

  const starts = new Date(startsAt);
  if (Number.isNaN(starts.getTime())) {
    alert('warn', `Dropped event "${title}": startsAt "${startsAt}" is not a valid date.`);
    return null;
  }

  return {
    id: String(id),
    slug: String(slug),
    title: String(title),
    summary: raw.summary ? String(raw.summary) : '',
    startsAt: starts.toISOString(),
    endsAt: raw.endsAt ?? null,
    displayDate: formatSydney(starts),
    locationName: raw.locationName ?? null,
    locationAddress: raw.locationAddress ?? null,
    image: raw.image ?? null,
    registrationUrl: raw.registrationUrl ?? null,
  };
}

/** Australian formatting, Sydney time, regardless of where the build runs. */
export function formatSydney(date) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  }).format(date);
}

/** @returns {Promise<ConnectEvent[]>} */
export async function getUpcomingEvents() {
  const raw = await fetchCollection('events');
  const now = Date.now();
  return raw
    .map(normaliseEvent)
    .filter((event) => event !== null)
    .filter((event) => new Date(event.startsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** @returns {Promise<ConnectEvent[]>} */
export async function getAllEvents() {
  const raw = await fetchCollection('events');
  return raw
    .map(normaliseEvent)
    .filter((event) => event !== null)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

/** @returns {Promise<ConnectEpisode[]>} */
export async function getEdgedInAssets(strand = null) {
  const raw = await fetchCollection('episodes');
  const items = raw
    .filter((item) => item && item.id && item.slug && item.title)
    .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')));
  return strand ? items.filter((item) => item.strand === strand) : items;
}

export async function getSermons() {
  const raw = await fetchCollection('sermons');
  return raw
    .filter((item) => item && item.id && item.slug && item.title)
    .sort((a, b) => String(b.preachedAt ?? '').localeCompare(String(a.preachedAt ?? '')));
}
