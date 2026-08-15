# Connect snapshots

These files are the fallback payload for the Connect content layer
(`src/lib/connect.mjs`). They are deliberately empty.

## What they are for

Connect is the system of record. When `CONNECT_API_URL` is set, the build reads
from Connect and these files are not used. When it is not set, or when Connect
is unreachable at build time, these files are served instead, so the site never
ships an empty section.

They are also the launch mechanism. Part C names a hard dependency: Connect must
expose its read API before week 2, or events and EdgedIn ship as static content
at launch and switch over in phase 2. "Static content" means these files,
edited through the CMS.

## Why they are empty rather than seeded

Nothing invented ships. A plausible-looking sample event is indistinguishable
from a real one once it is on a public page, and a visitor who turns up to it is
the worst possible outcome of a redesign.

While `events.snapshot.json` is empty the home canvas falls back to the standing
gatherings, which are true, so the movement is never blank.

## Populating them

Refresh from a live Connect once the API exists:

    CONNECT_API_URL=... CONNECT_API_TOKEN=... npm run connect:snapshot

That writes the current payload back to these files, which is what keeps the
fallback current rather than letting it rot at whatever shipped on day one.

The schema each file must match is in `docs/connect-api-contract.md`.
