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

**Hidden when nothing is on.** The client's rule of September 2026: nothing is
presented unless something is upcoming. With no events beyond the flagship the
movement is omitted altogether (the standing gatherings are already stated in
the arrival chapter), and a script removes anything that ends between builds.
Each event arrives in one of six templates chosen for it; see
`docs/connect-api-contract.md`.

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


## The twelve movements, the reveal, and the drop

Revised after review: the page was too short and stopped before most of what a
returning visitor comes for. It now runs the full length of the site.

| # | Movement | Leads to | Joined to the next by |
|---|---|---|---|
| 1 | Arrival | Plan your visit | "There is a place for you here," |
| 2 | Welcome | What a Sunday looks like | the photograph crossing the boundary |
| 3 | Vision | Who we are | the seam changing colour |
| 4 | The Rain is Coming | Conference 2026 | the weather clearing |
| 5 | What is on | Events | the card edge aligning with the next rule |
| 6 | Beyond the room | Outreach | the closing line |
| 7 | EdgedIn | EdgedIn Network | the inverted ground resolving to canvas |
| 8 | Watch and listen | Watch and listen, live | "What happens on a Sunday costs something to make," |
| 9 | Give | Ways to give | "None of it runs itself," |
| 10 | Life at TTE | Life at TTE | the mark appearing |
| 11 | Connect | Connect Hub | the seam settling vertical |
| 12 | Get in touch | Get in touch, prayer | nothing. The page ends here |

Movements 1 and 2, 7 and 8, and 8 and 9 are joined by a sentence that begins in
one movement and finishes as the heading of the next. Read straight down, the
page is a statement rather than a stack of panels.

The last movement is the only one that asks nothing. Everything above it offers
something to do; this offers a person to talk to.

### The drop

The brief asked for something carried from the top of the page to the bottom,
landing on each element, with each element releasing the next.

Continuity was never what was missing. The seam already runs the full length of
the page and is drawn from the gap between the two planes of the mark. What was
missing is **causality**: the sense that one movement produces the next rather
than merely following it.

So the seam is the channel, and a drop travels it. Each movement carries a
waypoint on the trailing edge; the waypoint lights as its movement arrives, and
a short stem reaches down towards the next one. The gap between the stem and the
next waypoint is deliberate: the chain is made of links, not a continuous rule.

**Why the drop is not on the seam path.** The seam is drawn in a 100 by 1000
viewBox with `preserveAspectRatio="none"`, so it stretches to whatever the page
height turns out to be. A circle placed in that coordinate space is flattened
into a horizontal smear on a page this long. Instead the drop is a sticky
element at 46vh and the page travels past it, which is the same relationship
seen from the other side. Only its horizontal position is animated, tracking
`SEAM_DRIFT` in `src/lib/seam-path.mjs`, so the whole device costs one transform
and never touches layout.

Adding a movement means adding one number to that array. The seam and the drop
read the same source, so they cannot drift apart.

**Without scroll-driven animation, or with motion reduced**, every waypoint
renders lit and the drop is not shown at all. The arrived state is the resting
state. Nobody who turns motion off gets a page of grey dots waiting for
something that will never happen.

### What was considered and not chosen

A ribbon, or a line of scripture running the length of the page, were the other
two options on the table.

A second graphic device would compete with the seam, which is already the
brand's own line and already runs the full page. Two continuous devices on one
page is one too many.

Scripture would work, and would work better than the drop, but it needs a verse
this church has actually chosen. Guessing one is the same mistake as guessing a
statement of faith. If a verse is nominated, the drop can travel along it rather
than beside it, and the text becomes the channel.


## The reveal, revised

The first version lit the seam evenly and let the drop do the work. The revised
brief asked for something better: the connecting line should **open out of
obscurity**, brightening as the page is read, dimming in places for effect and
returning.

That is now `SEAM_REVEAL` in `src/lib/seam-path.mjs`. Ten stops, each
`[progress, opacity, width]`, driving the seam's own opacity and stroke weight
off the root scroll timeline. Brightness and weight rise together, so the line
**gathers** rather than merely fading up.

The two dips are placed, not spaced:

- **over the vision**, so the locked words carry that movement on their own
- **over giving**, for the same reason

A line brightening beside copy that matters competes with it. The drawing-back
and returning is also what stops a monotonic fade from reading as a progress bar.

The drop is now the leading point of that light rather than a separate object:
it brightens on the same curve, slightly ahead of the seam behind it.

Without scroll-driven animation, or with motion reduced, the seam is simply
drawn at full strength and the drop is not shown. The arrived state is the
resting state.

### Why this figure

The conference artwork for **RAIN** is light breaking through storm cloud onto
water. The page now does across twelve movements what the poster does in one
frame, and the two arrive in the same place. That was not the plan when the seam
was drawn; the seam came from the gap between the two planes of the mark. It is
a coincidence worth keeping rather than a theme applied on top.

The conference movement sits at the peak of the reveal curve, and it is the
darkest thing on the page. It is the one movement where the light-out-of-
obscurity figure is not a metaphor.

## The conference

Since September 2026 the conference is a Connect event record, the RAIN entry
in `src/data/connect/events.snapshot.json`, and the chapter stages whichever
event the content layer returns as featured; with none upcoming the movement is
omitted. Everything in the record came from the supplied artwork and nothing
was inferred. The teaser gave the name, the tag, the line and the dates
13 to 15 November 2026. The master poster of August 2026 added the session
times (Friday 6pm, Saturday 4pm, Sunday 4pm), the open-air crusade (Saturday
14 November, 4pm), the guest ministers (Min. Nelly Ewelike and Min. Eseosa
Ohenhen), the venue (the church's own address, built from the one address
source), and the fact that changed the call to action: **no registration
required**, printed on the poster in those words. The old holding line, "Tell
me when registration opens", assumed a registration that was coming; the truth
was better, and both the chapter and the card now say so and offer Plan Your
Visit instead.

The staging is still set typographically in the site's own system rather than
as a copy of the poster, whose metallic display face belongs to the poster.
The artwork itself now appears as itself: the master poster lands in the home
chapter as the last arrival of the choreography, on wide screens only (a
poster stacked under the copy on a phone would double the stage and spend the
pin), and the hosts-and-speakers social leads the events card, where the
typographic setting has become what it was always going to be: the caption.


## The chapters, revised again

Reviewed against the brief a third time: the unveiling was present but not
felt. Every reveal was a trigger, not a scrub: a 12px settle that finished by a
third of the element's travel, over before the thumb lifted. Nothing on the
page ever transformed *in place*, and transformation in place, scroll spent on
change rather than on travel, is what separates a scroll-driven page from a
page with scroll effects. The reference given for the revision was the Apple
Vision Pro launch page, whose architecture is exactly that: full-viewport
scenes that pin while the scroll scrubs a staging sequence inside them, hard
dark-to-light chapter cuts, and huge type that yields to the thing it
announced.

The page now has two kinds of movement.

**Flowing movements** scroll past as before, with one change: on the home page
`[data-reveal]` tracks the scroll to 45 per cent of cover instead of 32, so a
reveal follows the finger rather than firing near it. The site-wide default is
untouched; a skimming reader on an inner page never waits.

**Chapters** are full-viewport dark stages that pin. The track is 220svb
(arrival) or 240svb (conference) tall; the stage inside is sticky for the
difference, and those viewport-heights of scroll are spent on choreography:

- **Arrival, the first chapter.** The page opens pre-dawn: the deepest
  neutral, easing to the brand slate at its foot. Who, where, when and one
  action are all above the fold at scroll zero, exactly as the brief requires;
  the pin only decides what scrolling is *for*. The first 120svb of scroll
  scrub a dawn open behind the type, the hero recedes, and "There is a place
  for you here," blooms in its place before the pin releases into the
  porcelain canvas. The handoff sentence now crosses a ground change as well
  as a movement boundary: it begins in the dark and is finished in the light.
- **The conference, the second chapter.** Full bleed now, not a card. The
  bloom gathers while the scene approaches, three shafts of light descend by
  scaleY once it holds, "The Rain is Coming" rises out of a clipped row, and
  the name, dates and action settle in sequence. Everything lands before the
  pin lets go.

Between them, **the vision** unveils clause by clause: the locked statement is
split at its own commas (derived from the constant, asserted byte-identical at
build), and each clause rises out of a clipped row as the scroll reaches it.
The rows read as masks and cost only a transform inside `overflow: clip`.

**The seam gained a halo**: a soft radial field around the travelling drop,
painted once and animating nothing of its own. It inherits the drop's drift
and reveal, so the light swells and dims on the same curve as the seam it
leads and finally reads as light rather than wire. The reveal curve itself was
retuned around the chapters: they paint over the seam while they hold, so the
peak now sits just past the conference chapter's exit, where the seam emerges
as though it carried the chapter's light out with it.

Dark, light, dark, light. The staging is the reveal figure at page scale.

**The same constraints hold.** Chapters are CSS scroll-driven animation only,
driven by named view timelines on the tall tracks; transform and opacity only;
no JavaScript, no observers, no measurement. The resting state is the arrived
state: without `animation-timeline` support, or with motion reduced, each
track collapses to a single viewport of ordinary flow with everything visible,
and the page loses nothing but the journey. The pinned tracks opt out of
`content-visibility: auto`, because deferring a chapter and resolving it
mid-scroll would jump the scrollbar while the reader is inside it.

Incidental fixes made on the way through: `--tracking-widest` was referenced
by the conference card but defined by no token, silently resolving to normal
tracking, and now uses the defined wide step; and the quiet button sank into
the dark conference ground in light scheme, a pairing axe cannot compute over
the gradient weather, so both dark stages restate the quiet and primary button
inks explicitly.


## The strand, continuous

Revised again in August 2026: the client asked for the strand to visibly link
all the elements, animating a smooth transition from one to another. The chain
of separate links became one continuous thread.

Each movement now draws its own span of the line on the trailing edge: a lead
from the movement's top boundary down to its node, the node, and a stem from
the node to the bottom boundary, where the next movement's lead takes over.
Movements sit flush, so the pieces read as one unbroken strand from arrival to
get in touch. Scrolling draws it: the lead arrives as a movement enters, the
node lands as it reaches the middle of the viewport, and the stem reaches
onward once the node has landed. The line is drawn in per-movement pieces
because `content-visibility: auto` brings paint containment and nothing may
paint across a section boundary.

The drop rides the strand. Its old lateral drift turned out to be a quiet
no-op: the translateX percentages resolved against the bead's own eight
pixels, not the viewport, so it had hugged the trailing edge since it shipped.
The accident became the design; the drift was removed rather than fixed, and
each node now lands exactly under the bead as its movement crosses the middle
of the viewport, which is what makes the drop read as being carried from
element to element.

At rest, with motion reduced, or without scroll-driven animation support, the
whole strand renders complete and only the drop is withheld.


## The client's copy revisions, August 2026

Applied after the chapters shipped, by the client's instruction:

- **The first words welcome.** The hero is now "Welcome. You made it home."
  with the accent on the final word. "A church in Penrith. A vision to impact
  nations." is retired from the heading; the eyebrow still says Penrith,
  Sydney, and the nations still arrive in the vision movement.
- **The welcome movement carries the client's copy verbatim**: "This family
  is a congregation of many languages, many ethnicities and many countries.
  That is what the room is made of. Let us know if it is your first day."
- **No reference to Renovate Health or to any therapeutic service** anywhere
  on the site: the family listing in the footer, the pastoral team page, the
  contact page's counselling signpost, the legal pages, and the crisis
  pointer (000, Lifeline, Beyond Blue, 13YARN) on the contact and prayer
  routes. The brief required the crisis pointer, so its removal is recorded
  as a client decision in src/data/church.mjs. The protective line survives:
  pastoral care is still stated as care, not clinical treatment.
- **The corrected mission** replaces the section 2 wording, and retires the
  em-dash the original carried.
- **Sundays and Wednesdays carry equal weight**: the handoffs no longer
  centre Sunday, plan-your-visit offers both days (and both gatherings'
  structured data), what-to-expect notes the Wednesday evening, and "first
  Sunday" phrasing became "first day" except on EdgeKids, which genuinely
  runs on Sundays.
- **Less text everywhere it was thickest**: the welcome movement went from
  two paragraphs to the client's three sentences, and the life and reach
  movements each lost a sentence.
- The "Either" label above the two bank accounts on /give was removed; the
  note above the cards now says both accounts are ours.
