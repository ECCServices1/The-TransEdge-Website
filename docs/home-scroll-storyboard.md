# Home canvas: scroll storyboard

Seven movements. Each ends with something the next completes. The seam runs
through all of them as one path.

Implemented in `src/pages/index.astro` and `src/components/Seam.astro`. The
comment above each movement in that file names its handoff, so the storyboard
and the code cannot drift apart.

## The seam

One SVG path, drawn once, spanning the full document height. It is not revealed
by scrolling: it is present from the first paint, which is what keeps it intact
with JavaScript disabled and under reduced motion.

What moves is a soft-edged mask window travelling down the path, lighting a
segment as it goes. The window is animated with `translateY` only, driven by
`animation-timeline: scroll(root block)`, so nothing leaves the compositor and
no scroll handler exists.

Vertices sit at movement boundaries, in seam units of a 1000-unit viewBox:

| Unit | Movement boundary | x | What the seam does |
|---|---|---|---|
| 0 | enters above the fold | 88 | steep, on the trailing edge |
| 180 | arrival into welcome | 79 | leans in behind the welcome photograph |
| 330 | welcome into vision | 86 | eases back out past the vision |
| 520 | vision into this week | 70 | swings in across the EdgedIn movement |
| 700 | this week into EdgedIn | 80 | returns |
| 880 | EdgedIn into outreach | 72 | settles vertical |
| 1020 | into the footer | 71 | runs out of the canvas |

The path stays between x 68 and 88, in the trailing third. The prose column is
capped at 42 to 46rem inside an 80rem shell, so it ends around 62 per cent on a
wide screen. Keeping the seam beyond that is what stops it reading as a stray
line drawn through the headline: it passes behind the images and the open
right-hand space, which is where a fold belongs.

An earlier route put it at x 22, which rendered as a straight diagonal through
the h1. That was caught by looking at it rather than by any test, which is the
argument for looking at it.

On screens under 48rem it is pushed mostly off-canvas and thinned: a hint of a
fold, not a diagram competing with the text over it.

In right-to-left the whole seam field is mirrored with `scaleX(-1)`, so it
enters from the leading edge in Arabic too. The mark and photography sit outside
that element, so nothing that must not flip does.

## The movements

### 1. Arrival

**Holds:** who, where, when, one action. Above the fold on every breakpoint.

Eyebrow with the mark and "Penrith, Sydney". Heading at the top of the type
scale, with "nations" set in the accent and the display face at its most
expressive setting: the one place Fraunces gets its full character. Three facts
as a definition list. One button, Plan your visit, with a line under it that
answers the three questions a first-time visitor is actually asking.

**Handoff out:** the sentence "There is a place for you here," set large and
unfinished, with a comma.

### 2. Welcome

**Opens with:** "and you do not have to arrive as anyone but yourself."

The sentence finishes across the boundary. There is no way to read the two
movements as separate blocks, because the grammar refuses it.

**Handoff out:** photograph S1 crops past the trailing viewport edge and
continues into the next movement.

### 3. Vision

**Holds:** the locked vision statement, set at `--text-4` on wide screens, and
the tagline.

Indented from the leading edge on wide screens, with the seam easing out to x 86
past it so the two never collide.

**Handoff out:** the seam changes colour here, and that colour resolves into the
accent the next movement's links use.

### 4. This week

**Holds:** up to three events from Connect.

No boxed cards. Each item is separated by a single heavy rule that starts at the
seam side and runs out, so the group reads as a rhythm rather than a row of
containers.

**Never empty.** With no events, the standing gatherings render instead, which
are always true.

**Handoff out:** the trailing rule aligns with the opening edge of EdgedIn.

### 5. EdgedIn

**Holds:** the network, positioned, with one action.

The ground inverts here. The inversion begins and ends inside the movement, as a
gradient from transparent at 0 per cent to the inverted ground at 14 per cent
and back out at 86 per cent, so the boundary is a fade rather than an edge. The
seam reads as light rather than line while it crosses.

The most editorially expressive movement, still inside the family.

**Handoff out:** the inverted ground resolves back to canvas across the
boundary.

### 6. Outreach

**Holds:** ECCS as sister organisation.

Careful wording, checked by the copy linter: separate entity, services open to
anyone, no church involvement required. Deliberately quiet and short. It is a
signpost, not a pitch.

**Handoff out:** the closing line opens the Connect movement.

### 7. Connect

**Holds:** the handoff out of the marketing site.

Same tokens, same symbol, so leaving does not feel like leaving. The label reads
"Sign in to Connect", and becomes "Open Connect" when a Connect session cookie is
present on the shared parent domain. No request is made to detect it.

**Handoff out:** the seam settles vertical and runs into the footer.

## Rhythm

Density and height vary on purpose. `--space-movement` is fluid from 4rem to
10rem; `--space-movement-tight` is roughly half that. Arrival and vision are
tall and sparse. This week is dense. Outreach is short. The silence between
movements is part of the composition.

## Motion policy

| Constraint | How it is met |
|---|---|
| JavaScript disabled | Nothing is revealed by script. Reveals use CSS scroll-driven animation, and the pre-arrival state only applies where the browser can animate out of it |
| `prefers-reduced-motion` | `[data-reveal]` forced to its arrived state, `[data-parallax]` to none, durations to 1ms. The seam stays fully drawn |
| Transform and opacity only | The seam light is a moving mask window. No `stroke-dashoffset`, no path morphing, no filter |
| Parallax under 15 per cent | `--parallax-max: 0.15`, read by components rather than chosen per component |
| Type settles, does not travel | `reveal-settle` moves 12px, not 60px |

## What is still to do here

- Photographs S1 and S2 are reserved, not filled. Shot list in
  `docs/photography-shot-list.md`.
- The weekly notice collection exists and is editable, but is not yet surfaced
  in the arrival movement.
- Checked at 480, 900 and 1280. Below 480 is unverified: headless Chrome in the
  build environment clamps its layout viewport at about 480px, so a 320px
  screenshot is a crop rather than a narrow-viewport layout. 320px needs a real
  device.
- Neither scheme has been reviewed by a person at each width. That review needs
  eyes, not a test.
