# Brand audit and three directions

Section 6 of the brief. See the three directions rendered at every size, on every
ground, at **`/brand`**. This document is the argument; that page is the evidence.

## The current mark

A circular lockup holding a four-square monogram, a three-line all-caps wordmark
and the tagline. Palette slate `#4B576E`, cool grey `#A1AAAF`, near-black text.

### What is wrong with it

**The circle is decorative.** It adds no meaning and forces everything inside it
to shrink. A containing circle costs roughly 30 per cent of the available area
before the mark has said anything. At favicon size, nothing inside survives.

**The monogram is ambiguous.** It spells EDGE read column by column and EGDE read
left to right. English readers read left to right first. For a mark that has to
carry a family of organisations, a coin-flip reading is not a quirk, it is a
defect.

**Five elements compete.** Circle, monogram, wordmark, tagline and the implied
grid. None can stand alone as an icon, which means there is no icon.

**The palette reads corporate.** Measured, the slate is OKLCh lightness 0.456,
chroma 0.041, hue 263. That chroma is very low. The cool grey is lower again at
0.012. Low chroma plus cool hue is the palette of a professional services firm,
and it is not warm.

**The wordmark fights its context.** Heavily tracked across three lines, so it
never sits comfortably in a horizontal header, which is where a wordmark spends
most of its life.

**There are no variants.** No single-colour, no reversed, no dark mode, no app
icon. Every one of those is needed the week a site goes live.

## What was kept

**The slate.** It holds equity and it measures well: 7.27:1 on white, which is
AAA. It is carried forward at step 700 of the new ramp as `#4b576e`, the same
value, not an approximation. Everything else in the slate ramp is built around
it in OKLCh so each step is a perceptually even move.

**The tagline.** "A Change is Inevitable", with a defined relationship to the
mark: it sits below the wordmark in the stacked lockup, in the display face,
italic, in the accent. It never sits inside the symbol.

## What was added

**Ember**, a warm accent at hue 42 with chroma up to 0.168. It sits almost
opposite the slate, which is what gives the pairing its charge, and it is the
warmth the audit found missing. `ember-600` is `#be4f1b` and clears 4.5:1 on
both white and the page canvas.

**A nine-step warm neutral ramp** at hue 70, chroma under 0.012, so paper reads
warm rather than clinical.

Every guaranteed pairing is measured, in both schemes, in
`docs/colour-contrast-evidence.md`. The check found two real failures during
build: a button outline and a control border, both below the 3:1 that SC 1.4.11
requires. Both were fixed before anything shipped.

## The three directions

All three are single symbols on one 32 unit construction grid with a 4 unit
margin. None contains a letterform, so none can be misread. None sits inside a
containing circle. All three hold at 16px in one colour.

### The Fold

One plane folded along a diagonal, the two faces offset so the seam reads as a
gap of light.

The most literal reading of an edge: the line where a surface changes direction.
Asymmetric, so it carries movement with no added device, and the diagonal gives
it an obvious relationship to a seam running down a page.

*Against it:* a diagonally divided square is a common construction. Its
distinctiveness rests entirely on the offset, so the offset must never be
reduced.

### The Threshold

Two planes standing apart, the opening between them widening as it rises.

A doorway read as pure geometry. The widening gap does the work the tagline
states without stating it: the way through is already open, and it opens further
ahead of you. The negative space is the mark, which gives it a genuine reversed
form rather than an inverted one.

*Against it:* doorway marks are well populated in church identity. The lean and
the asymmetric widening are what separate it, so both must survive refinement.

### The Crossing

A disc that has met an edge and shifted across it. Two half-discs, sheared apart
along the line they crossed.

This answers the vision rather than the tagline: a whole form, nations, meeting a
threshold and moving through it changed. The circle is load-bearing here, which
is the direct answer to the finding that the present circle is decorative.

*Against it:* the most conceptually loaded of the three, so it needs the most
explanation, and the least neutral if the family later has to stretch to
organisations with no crossing story.

## The Edge family

One construction grid, one type system. The symbol does not change between
organisations, which is what shows the Edge in ECCS is the Edge in TTE. Accent
and descriptor do the differentiating.

| Organisation | Accent | Descriptor |
|---|---|---|
| The Transformation Edge | `ember-600` | Church |
| Edge Community Care Services | `slate-600` | Community care |
| EdgedIn Network | `ember-800` | Media and publishing |

ECCS is legally separate and DGR-endorsed, so it keeps its own giving flow,
receipting, privacy notice and complaints pathway. The shared mark shows the
relationship; it does not merge the entities.

## Clear space, minimum sizes, misuse

Written now so they are not invented later under deadline. They apply to
whichever direction is chosen.

**Clear space.** One quarter of the symbol's height on all four sides. Nothing
enters it, including the wordmark in a lockup.

**Minimum sizes.**

| Use | Minimum |
|---|---|
| Symbol, screen | 16px |
| Symbol, print | 6mm |
| Horizontal lockup, screen | 120px wide |
| Horizontal lockup, print | 30mm wide |
| Stacked lockup, print | 22mm wide |

**Never:**

- redraw, restretch or rotate the symbol
- add a containing circle, box or drop shadow
- recolour outside the palette, or use a gradient inside the symbol
- place it on a busy photograph without the reversed form and adequate contrast
- outline it, or set it in an unapproved typeface
- reduce the offset, the lean or the shear that gives the chosen direction its
  meaning
- use the tagline as a substitute for the mark

## Producing PDF and EPS

The SVG set is generated from one geometry source by `npm run brand:export`, so
there is no second copy to drift. PDF and EPS are converted from those files:

```bash
# from public/brand/
inkscape crossing-symbol-mono.svg --export-type=pdf --export-filename=crossing-symbol-mono.pdf
inkscape crossing-symbol-mono.svg --export-type=eps --export-filename=crossing-symbol-mono.eps
```

Check the output for three things: the paths are paths and not a raster; the
fill rule survived; and the document is one colour where it should be.

## What happens after the gate

1. One direction is chosen. The other two are set aside, not blended.
2. Set `ACTIVE_MARK` in `src/lib/brand-marks.mjs`, run
   `npm run brand:export <key>`, and delete the other directions' files.
3. The chosen symbol is refined against the construction grid: optical
   alignment, not mathematical.
4. The wordmark is drawn and outlined. This is the step that turns the lockups
   from live text into portable vector.
5. PDF and EPS are cut, and the asset set is handed over.
6. High-fidelity screen design begins. Not before.
