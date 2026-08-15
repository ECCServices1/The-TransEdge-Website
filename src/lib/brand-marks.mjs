/**
 * The Edge symbol: three directions, one construction grid.
 *
 * Geometry is defined once here and consumed by the Astro component, the
 * review page and scripts/export-brand.mjs, so the SVG shipped to a printer is
 * the same geometry the site renders. There is no second copy to drift.
 *
 * CONSTRUCTION GRID
 *   32 x 32 units. A 4-unit margin on every side gives a 24-unit live area,
 *   which is what holds the mark's weight steady from favicon to banner.
 *   All coordinates are whole or half units, so the mark lands on pixel
 *   boundaries at 16px and 32px rather than blurring across them.
 *
 * WHY THESE THREE
 *   The brief asks for the edge itself: a threshold, a fold, two planes
 *   meeting, a horizon about to be crossed. Each direction takes one of those
 *   readings literally and commits to it. None contains a letterform, so none
 *   can be misread the way the current EDGE monogram reads EGDE, and none uses
 *   a containing circle, so none shrinks inside its own frame.
 */

/**
 * @typedef {object} Mark
 * @property {string} name
 * @property {string} reading      what the form is
 * @property {string} rationale    why it answers the brief
 * @property {string} risk         the honest argument against it
 * @property {string[]} paths      solid paths, one colour
 * @property {string} [fillRule]
 */

/** @type {Record<string, Mark>} */
export const MARKS = {
  fold: {
    name: 'The Fold',
    reading: 'One plane folded along a diagonal, the two faces offset so the seam reads as a gap of light.',
    rationale:
      'The most literal reading of an edge: the line where a surface changes direction. Asymmetric, so it carries movement without any added device, and the diagonal gives the mark an obvious relationship to a seam running down a page. Reads as a single confident diagonal at 16px.',
    risk: 'A diagonally divided square is a common construction. Its distinctiveness rests entirely on the offset, so the offset must never be reduced.',
    paths: [
      // Upper-left plane. Corners eased by 1.5 units on the outer square only,
      // leaving the fold edge sharp, which is where the meaning sits.
      'M5.5 4 H26 L4 26 V5.5 A1.5 1.5 0 0 1 5.5 4 Z',
      // Lower-right plane, translated 2 units along both axes.
      'M28 6.5 V26.5 A1.5 1.5 0 0 1 26.5 28 H6 Z',
    ],
  },

  threshold: {
    name: 'The Threshold',
    reading: 'Two planes standing apart, the opening between them widening as it rises.',
    rationale:
      'A doorway read as pure geometry. The widening gap does the work the tagline states, without stating it: the way through is already open and it opens further ahead of you. Two heavy verticals hold at very small sizes, and the negative space is the mark, which is what gives it a genuine reversed form rather than an inverted one.',
    risk: 'Doorway marks are well populated in church identity. The lean and the asymmetric widening are what separate it, so both must survive the refinement.',
    paths: [
      // Left plane: outer edge vertical, inner edge leaning in toward the base.
      'M4 5.5 A1.5 1.5 0 0 1 5.5 4 H12.5 L15 28 H4 Z',
      // Right plane: mirrored lean, set wider at the top so the opening flares.
      'M19.5 4 H26.5 A1.5 1.5 0 0 1 28 5.5 V28 H17 Z',
    ],
  },

  crossing: {
    name: 'The Crossing',
    reading: 'A disc that has met an edge and shifted across it. Two half-discs, sheared apart along the line they crossed.',
    rationale:
      'Answers the vision rather than the tagline: a whole form, nations, meeting a threshold and moving through it changed. The circle is load-bearing here, which is the direct answer to the audit finding that the present circle is decorative. The shear reads instantly at 16px as one form broken by a bright line.',
    risk: 'The most conceptually loaded of the three, so it needs the most explanation. It is also the least neutral if the family later has to stretch to organisations with no crossing story.',
    paths: [
      // Upper half-disc, centre (14.5, 14.25), radius 10.5.
      'M4 14.25 A10.5 10.5 0 0 1 25 14.25 Z',
      // Lower half-disc, centre (17.5, 17.75): shifted 3 units along the edge
      // and 3.5 units below it, so the gap is a constant band of light.
      'M7 17.75 A10.5 10.5 0 0 0 28 17.75 Z',
    ],
  },
};

export const MARK_KEYS = /** @type {const} */ (['fold', 'threshold', 'crossing']);

/**
 * The direction the site renders while the choice is open.
 *
 * PROVISIONAL. Section 6 requires three directions to be presented before one
 * is refined, and no high-fidelity screen design before a brand direction is
 * approved. This constant exists so the site can be built and reviewed at all,
 * not because the decision is made. Change this one value once the gate closes,
 * then run `node scripts/export-brand.mjs <key>` to cut the asset set down to
 * the approved direction.
 *
 * @type {keyof typeof MARKS}
 */
export const ACTIVE_MARK = 'crossing';

/**
 * The Edge family. One construction grid, one type system, differentiated by
 * accent and descriptor, per section 7. The symbol itself does not change
 * between organisations: that is what shows the Edge in ECCS is the Edge in TTE.
 *
 * ECCS is legally separate and DGR-endorsed, so its accent is the most
 * distinct of the set. Shared identity, visibly separate entity.
 */
export const FAMILY = [
  {
    key: 'tte',
    name: 'The Transformation Edge',
    descriptor: 'Church',
    accent: 'var(--color-ember-600)',
    accentDark: 'var(--color-ember-400)',
    note: 'The parent. Ember is the family accent.',
  },
  {
    key: 'eccs',
    name: 'Edge Community Care Services',
    descriptor: 'Community care',
    accent: 'var(--color-slate-600)',
    accentDark: 'var(--color-slate-300)',
    note: 'Sister organisation, legally separate, DGR-endorsed. Anchor slate carries the shared grid while reading as its own entity.',
  },
  {
    key: 'edgedin',
    name: 'EdgedIn Network',
    descriptor: 'Media and publishing',
    accent: 'var(--color-ember-800)',
    accentDark: 'var(--color-ember-200)',
    note: 'Media and publishing arm. The deepest ember in the ramp, which is what lets the editorial pages run expressive without leaving the family.',
  },
];

/**
 * Renders a mark to a complete standalone SVG document.
 * @param {keyof typeof MARKS} key
 * @param {{ size?: number, colour?: string, title?: string, id?: string }} [options]
 */
export function markToSvg(key, options = {}) {
  const mark = MARKS[key];
  const { size = 32, colour = 'currentColor', title = `${mark.name}, The Transformation Edge` } = options;
  const paths = mark.paths.map((d) => `  <path d="${d}" />`).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" fill="${colour}" role="img" aria-label="${title}">
  <title>${title}</title>
${paths}
</svg>
`;
}
