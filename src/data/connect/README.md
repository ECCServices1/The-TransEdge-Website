# Connect snapshots

These files are the fallback payload for the Connect content layer
(`src/lib/connect.mjs`), and until the Connect read API exists they are also
the source: the site builds from them.

## What they are for

Connect is the system of record. When `CONNECT_API_URL` is set, the build reads
from Connect and these files are the fallback for an outage. When it is not set,
they are served, so the site never ships an empty section.

## What is in them

`events.snapshot.json` holds one real record: the 2026 conference, RAIN. Every
field came from the supplied artwork (the teaser, the master poster) and nothing
was inferred; see `docs/photography-shot-list.md` for the artwork and
`docs/connect-api-contract.md` for the field meanings. It is the shape every
Connect event should arrive in, including the fields that choose one of the six
presentations (`kind`, `featured`, `template`, `tag`, `teaser`, `sessions`,
`guests`, `artwork`).

The other two files are empty. Nothing invented ships: a plausible-looking
sample is indistinguishable from a real one once it is on a public page.

## Adding an event by hand, before Connect answers

Copy the RAIN record, change every field, keep the shape. Only active and
future events render, so a past record can stay in the file harmlessly, and an
event with no `endsAt` is treated as three hours long. Commit; the push
deploys.

## Populating them from Connect

    CONNECT_API_URL=... CONNECT_API_TOKEN=... npm run connect:snapshot

`.github/workflows/connect-refresh.yml` runs that nightly once the two secrets
exist in the repository, commits any change, and the push rebuilds the site. Until
the secrets exist the job exits without doing anything.
