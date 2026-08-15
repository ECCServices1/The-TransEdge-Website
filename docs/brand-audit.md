# Brand: the approved identity

**The gate is closed.** The client supplied *TTE Masterbrand Production Suite
v1.0*, and **A2 Architectural Threshold** is the approved symbol. The three
exploratory directions produced during week 1 are superseded and have been
removed from the repository.

Working reference: **`/brand`**. Supplied guidelines:
`public/brand/reference/TTE_Masterbrand_Guidelines_v1.0.pdf`.

## What was supplied

| Group | Contents |
|---|---|
| Vector masters | Horizontal, stacked and symbol cuts in primary, reversed, mono and compact, each as SVG, PDF and EPS |
| Digital icons | Favicon, app icon and social avatar, SVG plus PNG at 16, 32, 48, 512, 1024 and 1080 |
| Guidelines and tokens | Guidelines PDF, `tte_brand_tokens.css`, `tte_brand_tokens.json` |

The wordmark is fully outlined, so the files are portable with no typeface to
supply alongside them. That was the one step the earlier plan flagged as
outstanding, and it is now done.

## The rules that govern everything else

From the supplied README, verbatim:

> Approved symbol: A2 Architectural Threshold.
> Primary identity: Deep Slate one-colour mark.
> Ember is a controlled supporting accent only and must never colour a plane in
> the core symbol.

Plus, from the token file: **accent capped at five per cent of a composition**.

These are encoded rather than left to memory:

- `EdgeMark` takes no colour prop and offers no variant. It inherits
  `currentColor`, so it is one colour by construction.
- `npm run check:brand` fails the build if any plane in the vector master is
  filled with an accent value.
- The primary action is Deep Slate, not ember. Making every button ember would
  spend the whole accent budget on furniture. Ember is reserved for the rule
  device in the lockups, the focus ring, the lit seam and inline accent text.
- The canvas wash mixes ember at 5 to 9 per cent, so it reads as warmth in the
  paper rather than as colour.

## The palette, as mapped

Primitives are the supplied values, verbatim. The semantic mapping is ours, and
it is where accessibility is won.

| Supplied | Value | Used as |
|---|---|---|
| `brand.primary` | `#303847` | Canvas inverse, primary action, the mark |
| `brand.heritage` | `#4B576E` | Anchor text, quiet action label |
| `brand.accent-ember` | `#E46F3C` | Graphic accent only. Never text |
| `brand.accent-ember-accessible` | `#A94722` | Accent text, focus ring, lit seam |
| `neutral.100` … `neutral.900` | supplied | Surfaces and text |

One value is not from the supplied file: `--color-ember-light` `#f6895b`,
derived on the same OKLCh hue (42.7) because plain ember measures **3.72:1** on
the dark raised surface and fails. It exists to keep the accent usable in dark
mode, not to change the brand.

Plain ember measures **2.90:1** on the warm surface, which is why the supplied
palette carries an accessible cut at all. The brand designer anticipated this
correctly.

All 50 guaranteed pairings pass in both schemes:
`docs/colour-contrast-evidence.md`.

## How the mark is used on the site

**Symbol.** Inlined from geometry transcribed from
`tte_symbol_primary.svg`, so it inherits `currentColor` and needs no second
request. `check:brand` re-reads the master and fails on any drift, so the
inline copy cannot disagree with the shipped vector.

**Lockup.** The header and footer inline the **compact** cut, read from the
supplied file at build time with its single fill swapped for `currentColor`.
One asset, correct on any ground and in both colour schemes, 1.5KB gzipped, no
request on the critical path, and nothing transcribed by hand.

**Minimum sizes**, enforced in code rather than remembered:

| Use | Minimum |
|---|---|
| Symbol, digital | 16px, clamped by the component |
| Symbol, print | 5mm |
| Horizontal with tagline | 200px / 50mm |
| Horizontal compact | 140px / 35mm |
| Stacked | 96px / 25mm |

## Misuse

- Do not recolour a plane of the symbol, and never with ember.
- Do not add a containing circle, box, outline or drop shadow.
- Do not close, narrow or widen the gap between the planes. The gap is the threshold.
- Do not rotate, stretch, skew or redraw the symbol.
- Do not set any lockup below its minimum size.
- Do not rebuild the wordmark in another typeface.
- Do not place the primary lockup on a busy photograph. Use the reversed cut.
- Do not use the tagline as a substitute for the mark.

## Two things to confirm

**1. The tagline case.** The supplied lockup artwork sets the tagline as
*A change is inevitable*. The locked wording in section 2 of the brief is
*A Change is Inevitable*, in title case. The site uses the locked wording
wherever the tagline is set as text; the artwork has not been altered because it
is a supplied master. Worth resolving before anything goes to print.

**2. The family lockups.** The supplied README states:

> The exact organisation family names and descriptors referenced in section 7
> were not supplied. The masterbrand and descriptor construction rule are
> complete; named family lockups remain to be generated when those names are
> confirmed.

The names are confirmed in the brief and are listed at `/brand` ready to be
generated. Until those lockups exist, this site renders no family mark at all.
An approximated ECCS lockup would be worse than none: ECCS is a separate legal
entity and its identity is not ours to improvise.

## What the earlier audit found

Retained as the record of why the redesign happened. Every finding is answered
by the supplied identity.

| Finding on the old mark | How the new identity answers it |
|---|---|
| The circle was decorative and forced the lockup to shrink inside it | No containing shape. The symbol is the mark |
| The monogram read EGDE left to right | No letterform in the symbol at all |
| Five competing elements, none usable as an icon | One symbol, usable at 16px |
| Palette cool and low in chroma, reading corporate | Ember accent with real chroma, warm neutral ramp |
| Wordmark tracked across three lines | One line in the compact cut, two in the full |
| No single-colour, reversed, dark or app-icon variant | All supplied |

The heritage slate `#4B576E` is carried forward in the supplied palette rather
than dropped, so the equity survives the redesign.
