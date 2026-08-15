# Connect read API: the contract this site expects

Section 12. Connect is the system of record; this site is a read layer over it.

This document is written **for the Connect team**. It is what the site already
expects, so if Connect matches it, wiring up is one environment variable.
If it differs, the mapping changes in one function in `src/lib/connect.mjs` and
nothing else moves.

## How the site behaves today

Without `CONNECT_API_URL`, every call resolves from the committed snapshots in
`src/data/connect/`, a build warning is raised, and the site renders normally.

That is deliberate. Part C names the hard dependency: Connect must expose its
read API before week 2, or events and EdgedIn ship as static content at launch
and switch over in phase 2. Both paths are already built.

## Authentication

Preferred: a bearer token, scoped to read, sent as `Authorization: Bearer …`.

It is used at build time only, from Cloudflare Pages, and stored as an encrypted
environment variable. It is never sent from a browser and never appears in the
repository.

The token needs read access to published events, published EdgedIn assets and
published sermons. Nothing else. It must not be able to read people, giving,
rosters or anything about a child.

## Endpoints

| Collection | Path | Notes |
|---|---|---|
| Events | `GET /v1/events?status=published&from=now` | Future events, soonest first |
| EdgedIn | `GET /v1/edgedin/assets?status=published` | All strands |
| Sermons | `GET /v1/sermons?status=published` | |

A bare array or `{ "data": [ … ] }` are both accepted.

## Event

```json
{
  "id": "evt_01HXYZ",
  "slug": "easter-sunday-2026",
  "title": "Easter Sunday",
  "summary": "One gathering, 9:30am, with breakfast afterwards.",
  "startsAt": "2026-04-05T09:30:00+11:00",
  "endsAt": "2026-04-05T11:30:00+11:00",
  "locationName": "The Transformation Edge",
  "locationAddress": null,
  "image": "https://connect.thetransedge.com/media/easter-2026.jpg",
  "registrationUrl": "https://connect.thetransedge.com/events/easter-sunday-2026/register"
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Stable and unique |
| `slug` | yes | Lower case, hyphens. **Stable.** It is the public URL, so a change breaks every link and every share |
| `title` | yes | |
| `summary` | no | One or two sentences |
| `startsAt` | yes | ISO 8601 **with offset**. Not naive local time |
| `endsAt` | no | |
| `locationName` | no | Defaults to the church |
| `locationAddress` | no | schema.org `PostalAddress` shape, or null for the church address |
| `image` | no | Must have a consent record behind it. See below |
| `registrationUrl` | no | A Connect URL. Registration always happens in Connect |

A record missing `id`, `slug`, `title` or `startsAt` is dropped with a warning
rather than allowed to break the build.

## EdgedIn asset

```json
{
  "id": "ep_01HXYZ",
  "slug": "on-being-sent",
  "title": "On being sent",
  "strand": "podcast",
  "summary": "What it means to be sent, and what it costs.",
  "publishedAt": "2026-03-02T06:00:00+11:00",
  "durationSeconds": 2280,
  "audioUrl": "https://cdn.example/edgedin/on-being-sent.mp3",
  "videoId": null,
  "image": "https://connect.thetransedge.com/media/on-being-sent.jpg"
}
```

`strand` is one of `podcast`, `youtube`, `radio`, `devotional`, `publishing`.
An unrecognised strand is kept and listed, but gets no strand-specific treatment.

## Sermon

Same shape as an EdgedIn asset, with `preachedAt` in place of `publishedAt`, and
`speaker`, `series` and `passage` as optional strings.

## Rules the site enforces on the response

**An empty live response does not overwrite a non-empty snapshot.** If Connect
returns zero events while the snapshot holds some, the snapshot is served and an
error is raised. Connect genuinely having no published events is possible, but a
filter or token-scope problem is far more likely, and shipping an empty events
section is the outcome the brief forbids.

**A slow Connect does not hang a deploy.** Requests time out at 15 seconds and
fall back.

**A malformed record is dropped, not fatal.** One bad date does not cost the
whole build.

## Images and consent

Any `image` URL Connect returns will be published on a public page. Section 17
applies to it exactly as it applies to an image in this repository: alt text,
a credit where applicable, and a recorded consent, with a parent or guardian
consent for any image of a child.

If Connect cannot guarantee that for every image it serves, say so and the site
will ignore the field rather than publish an image whose consent is unknown.

## Rebuilding when content changes

The site is static, so a change in Connect is live after a rebuild.

**Preferred:** Connect calls a Cloudflare Pages deploy hook on publish. One POST,
no payload needed. The hook URL is a secret and is treated as one.

**Fallback:** a scheduled rebuild. Once an hour is enough, and it is what
guarantees an event published on Saturday night is on the site on Sunday morning.

## Keeping the fallback current

```bash
CONNECT_API_URL=… CONNECT_API_TOKEN=… npm run connect:snapshot
```

Run on a schedule from CI and commit the result. A fallback that was taken on
launch day and never refreshed is a fallback that serves last year's events the
first time Connect has an outage.

## Questions back to the Connect team

1. Does the read API exist, and what is its base URL?
2. Is bearer token the right authentication model, and who issues the token?
3. Are slugs stable across an edit?
4. Can Connect call a deploy hook on publish?
5. Does every image Connect serves have a consent record behind it?
