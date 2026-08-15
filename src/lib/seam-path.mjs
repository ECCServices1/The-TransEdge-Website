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
