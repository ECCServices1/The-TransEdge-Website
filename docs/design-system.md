# Design system

Tokens before screens. `src/styles/tokens.css` is the system; this explains it.
Nothing in the codebase uses a raw colour, size or duration. If a value is
needed and no token fits, the token set is wrong and that file changes first.

**The live style guide page is not built yet.** It is the largest remaining gap,
and it is on the launch checklist.

## Colour

### Primitives

Never used directly in a component.

Supplied by the client in *TTE Masterbrand Production Suite v1.0*. A primitive
is the brand, not a preference, and `npm run check:brand` fails the build if one
is edited.

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#303847` | Deep Slate. The identity and the one-colour mark |
| `--color-heritage` | `#4B576E` | The previous brand slate, carried forward |
| `--color-ember` | `#E46F3C` | Graphic accent only, capped at 5% of a composition |
| `--color-ember-accessible` | `#A94722` | The accent cut that clears 4.5:1 on light |
| `--color-ember-light` | `#f6895b` | Derived on the same hue for dark surfaces |
| `--color-neutral-100…900` | supplied | Nine steps, warm |

### Semantic

What components actually use, so a palette change is one edit.

`canvas`, `canvas-raised`, `canvas-sunken`, `canvas-inverse`, `text`,
`text-muted`, `text-subtle`, `text-inverse`, `text-accent`, `text-anchor`,
`action-bg` and its states, `action-fg`, `action-quiet-*`, `border`,
`border-strong`, `focus`, `seam`, `seam-lit`, and the three status pairs.

### Rules

- **Every guaranteed pairing is measured.** `npm run tokens:contrast` checks 50
  pairings in both schemes and fails below WCAG 2.2. Evidence in
  `docs/colour-contrast-evidence.md`.
- **Accent text is guaranteed on `canvas` and `canvas-raised` only.** On
  `canvas-sunken` it drops below 4.5:1, so sunken surfaces use `--color-text`.
- **`border` is decorative** and deliberately below 3:1. Anything carrying state
  or a control boundary uses `border-strong`, which clears 3:1 under SC 1.4.11.
- **Colour is never the only carrier of meaning.** Status pairs colour with an
  icon and a word. The current language in the switcher is marked with a tick,
  not just weight.
- **Dark is a re-mapping, never a filter.** The class-based and media-query dark
  scopes must stay identical, and the contrast checker fails on drift between
  them.

## Type

Two families. Both SIL Open Font Licence 1.1, so there is no licence to track
and no cost line.

- **Display:** Fraunces. Variable optical size and weight. Headings set at
  `opsz 48`; the home heading gets `SOFT 40, WONK 1, opsz 144`, the one place it
  is allowed its full character.
- **Text:** Inter. Variable weight.
- **Non-Latin:** the Noto families, loaded per locale. A page links
  `latin.css` always and its own script on top, so an English page never carries
  a hundred and twenty CJK `@font-face` rules.

Seven-step fluid scale, `--text--1` to `--text-5`, each a `clamp()` between
320px and 1440px viewports. No size breakpoints to maintain.

Measure held between 60 and 75 characters via `--measure: 66ch`. Line height
1.5 on body.

## Space

4px base grid, `--space-3xs` (4px) to `--space-4xl` (128px). No arbitrary values.

`--space-movement` and `--space-movement-tight` set the rhythm of the home
canvas. They are fluid and deliberately large, because the silence between
movements is part of the composition.

## Layout

Page 80rem, wide 96rem, prose 42rem. Twelve columns, fluid gutter, fluid inline
padding. Mobile first, assuming a mid-range Android on mobile data.

**Logical properties throughout.** There is no `margin-left` anywhere in this
codebase. Arabic is a launch locale, so mirroring is a system property, not a
translation task. Directional icons carry `.mirror-in-rtl`; photographs and the
mark never do. Numerals, times and phone numbers inside Arabic prose are wrapped
in `.ltr-embed`.

## Elevation and radii

Depth by layering, not drop shadows. Two shadows only, reserved for things that
genuinely float: the sticky header and the modal. Radii from 2px to a full pill.

## Motion

Three durations, three easings. Movement explains continuity; nothing moves for
decoration.

- Transform and opacity only, everywhere.
- Parallax capped at 15 per cent, read from `--parallax-max` rather than chosen
  per component.
- Type settles 12px. It does not travel.
- Under `prefers-reduced-motion`, `[data-reveal]` is forced to its arrived state
  rather than hidden, so nothing is lost.
- With JavaScript disabled, everything is visible, because the pre-arrival state
  only applies where the browser can also animate out of it.

## Components

Built: button in three tones and two sizes, form field, disclosure, header with
a no-JavaScript mobile drawer, footer, locale switcher, breadcrumb, crisis
pointer, photo slot, event card, seam.

Each has default, hover, focus-visible, active and disabled states, and each has
been built with logical properties so it works in both text directions.

Still to build: media player, episode card, modal, tabs, toast, skeleton, and
the empty and error states beyond 404 and the events empty state.

Minimum target size is 2.75rem on every interactive element, comfortably past
the 24 by 24 in SC 2.5.8.
