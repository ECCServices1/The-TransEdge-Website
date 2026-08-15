# The Transformation Edge

The website for The Transformation Edge, also known as The TransEdge Church, at
[www.thetransedge.com](https://www.thetransedge.com).

Built to the redesign brief, v3. Australian English. No em-dashes in new copy.

## Where things are

| Path | What it holds |
|---|---|
| `src/data/church.mjs` | Locked facts and locked copy. The single source of truth for times, address, phone, ABN. **The vision and mission may not be edited.** |
| `src/data/gatherings.json` | Service times, editable through the CMS |
| `src/data/redirects.mjs` | The redirect map. `public/_redirects` is generated from it |
| `src/data/connect/` | Connect fallback snapshots |
| `src/styles/tokens.css` | Every colour, size, space, radius and duration in the system |
| `src/i18n/` | Locales, interface strings, translation status |
| `src/lib/brand-marks.mjs` | The approved symbol geometry and the asset map |
| `src/lib/connect.mjs` | The Connect content layer and its fallback |
| `public/fonts/` | Self-hosted typefaces, split by unicode range |
| `docs/` | Brand audit, storyboard, API contract, checklists |

## Running it

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # static build plus the Pagefind index
npm run verify         # copy rules, contrast, types
```

Useful pages while working:

- `/brand` the approved identity and its usage rules
- `/admin` the content editor
- `/ar/new-here/plan-your-visit` the right-to-left build

## The checks, and what they are for

These run in CI and fail the build. They exist because a style rule that is not
enforced is a style rule that lasts about six weeks.

```bash
npm run check:copy       # the section 22 do-not-ship list, and positioning
npm run check:brand      # the inlined mark and the palette against the supplied masters
npm run tokens:contrast  # every guaranteed colour pairing, both schemes, WCAG 2.2
```

`npm run tokens:contrast` also writes `docs/colour-contrast-evidence.md`, which
is the evidence the brief asks for rather than an assertion that it was checked.

## Things that are deliberately not automatic

- **Translations.** Non-English locales render English and are marked `noindex`
  until a native speaker from the congregation has reviewed them and been
  recorded in `TRANSLATION_STATUS`. Nothing machine-translated is published.
- **Photographs.** `PhotoSlot` reserves space and states the shot rather than
  filling it with stock. No image ships without alt text and a recorded consent,
  and no image of a child ships without a parent or guardian consent on file.
- **The brand.** The approved identity is A2 Architectural Threshold, from the
  supplied Masterbrand Production Suite v1.0. Primitives in `tokens.css` and the
  inlined symbol geometry are copies of supplied files, and `check:brand` fails
  the build if either drifts. Do not edit a brand primitive.

## Regenerating assets

```bash
npm run fonts:fetch                    # re-vendor the typefaces
npm run check:brand                    # symbol and palette still match the supplied masters
npm run connect:snapshot               # refresh the Connect fallback
```

## Deployment

Cloudflare Pages, building from `main`.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | from `.nvmrc` |

Environment variables, set in Cloudflare and never in the repository:

| Name | Needed for |
|---|---|
| `CONNECT_API_URL` | Reading events, sermons and EdgedIn from Connect. Absent, the snapshots are used |
| `CONNECT_API_TOKEN` | Authenticating that read |
| `TURNSTILE_SECRET_KEY` | Form spam protection, on the Worker |

## Where to start reading

1. `docs/open-questions.md` for what is still blocked and on whom
2. `docs/launch-checklist.md` for what has to be true before this goes live
3. `docs/brand-audit.md` for the approved identity and its rules
