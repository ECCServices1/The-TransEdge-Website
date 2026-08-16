/**
 * The Edge seam, in one place.
 *
 * The seam and the drop that travels down it have to agree about where the line
 * is. When the path lived only inside Seam.astro there was nothing to agree
 * with; now that a second element rides it, the coordinates are shared so the
 * two cannot drift apart.
 *
 * Seam space is 100 wide by 1000 tall, drawn with preserveAspectRatio="none" so
 * it stretches to whatever the page turns out to be. The path stays in the
 * trailing third, between x 68 and 88, because the prose column ends around 62
 * per cent on a wide screen and a line drawn through a headline is a mistake,
 * not a device.
 */

/**
 * Each vertex sits at a movement boundary, which is what makes the change of
 * angle read as a handoff rather than a wobble.
 */
export const SEAM_PATH = [
  'M 88 -20',
  'C 88 60, 82 120, 79 180',
  'C 76 250, 84 280, 86 330',
  'C 88 400, 72 450, 70 520',
  'C 68 600, 78 650, 80 700',
  'C 82 770, 74 820, 72 880',
  'C 71 940, 71 980, 71 1020',
].join(' ');

/**
 * The seam's lateral drift, sampled at eleven points, as a percentage of the
 * viewport width from the inline end.
 *
 * The drop does not ride the SVG path directly, and this is why: the seam is
 * stretched non-uniformly to the page height, so a circle placed in that
 * coordinate space would be flattened into a horizontal smear on a long page.
 * Instead the drop is a sticky DOM element that stays at eye level while the
 * page travels past it, and only its horizontal position is animated, tracking
 * these samples.
 *
 * That inversion is also what makes it cheap: the drop never animates anything
 * but a transform, so it stays on the compositor, and there is no page-height
 * measurement anywhere in the CSS.
 *
 * Values are the seam's x at each tenth of the path, converted from seam space
 * (68 to 88) into a distance from the trailing edge.
 */
export const SEAM_DRIFT = [12, 15, 20, 16, 14, 26, 30, 24, 20, 26, 29];

/**
 * The reveal.
 *
 * The seam is not a line that happens to be lit. It starts obscured and opens
 * as the page is read, so scrolling is the act of revealing it, and the further
 * down you go the more of it there is to see.
 *
 * Each stop is [progress, opacity, width]. Progress is the fraction of the page
 * scrolled; opacity and width are the seam's own, so brightness and weight rise
 * together and the line reads as gathering rather than merely fading up.
 *
 * Two of the page's movements are chapters: full-bleed dark stages that paint
 * over the seam while they hold the viewport. The curve is written around them.
 * The arrival chapter hides the seam's entry, so the first stop hardly matters
 * visually and is kept low anyway for the browsers that show a sliver of it.
 * The conference chapter hides the seam through the middle of the page, and the
 * peak sits just past its exit: the chapter fills its stage with light, and the
 * seam emerges from behind it at its brightest, as though it took the light
 * with it. Retuned by eye against the built page, not by arithmetic.
 *
 * The two dips are deliberate and are placed rather than spaced. The first sits
 * over the vision, the second over giving: in both, the copy is the thing to
 * look at, and a line brightening beside it competes. The seam drawing back and
 * returning is also what stops a monotonic fade from reading as a loading bar.
 *
 * This is the same figure as the conference artwork, which is light breaking
 * through cloud onto water. The page does over twelve movements what the poster
 * does in one frame, and both arrive at the same place: the light wins.
 */
export const SEAM_REVEAL = [
  /* Arrival. Behind the dark stage; barely there where it does show. */
  [0.0, 0.14, 0.8],
  /* Welcome. The first opening, as the dark lifts. */
  [0.2, 0.5, 1.2],
  /* Vision. Draws back, so the locked words carry the movement alone. */
  [0.3, 0.24, 0.9],
  /* The conference chapter covers this span; the seam passes behind it. */
  [0.45, 0.6, 1.5],
  /* Chapter exit. The peak: the seam comes out carrying the chapter's light. */
  [0.58, 0.95, 2.2],
  /* Events, outreach, EdgedIn. Settles and holds. */
  [0.7, 0.62, 1.5],
  /* Give. The second dip. */
  [0.82, 0.32, 1.0],
  /* Life at TTE. */
  [0.9, 0.75, 1.8],
  /* Connect. */
  [0.95, 0.88, 2.0],
  /* Get in touch. Fully open. */
  [1.0, 1.0, 2.4],
];
