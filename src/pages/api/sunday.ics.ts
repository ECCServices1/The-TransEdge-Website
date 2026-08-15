/**
 * The Sunday gathering as a calendar file.
 *
 * Generated at build time and served as a static file, so "add to calendar"
 * needs no third-party service, sets no cookie and tells nobody that this
 * visitor is planning to come.
 */
import type { APIRoute } from 'astro';
import { CHURCH } from '../../data/church.mjs';
import { nextOccurrence, toICS } from '../../lib/dates.mjs';

export const prerender = true;

export const GET: APIRoute = () => {
  const sunday = CHURCH.gatherings.find((g) => g.key === 'sunday')!;
  const date = nextOccurrence(sunday.isoDay);

  const ics = toICS({
    uid: `sunday-${date}@thetransedge.com`,
    title: 'Sunday gathering, The Transformation Edge',
    description: `Our Sunday gathering. Look for the welcome desk inside the main entrance. ${CHURCH.url}/new-here/plan-your-visit`,
    location: CHURCH.address.full,
    start: `${date}T${sunday.isoTime}:00+10:00`,
    durationMinutes: sunday.durationMinutes,
    url: `${CHURCH.url}/new-here/plan-your-visit`,
  });

  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="tte-sunday.ics"',
    },
  });
};
