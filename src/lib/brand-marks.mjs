/**
 * The approved Edge symbol: A2 Architectural Threshold.
 *
 * Source: TTE Masterbrand Production Suite v1.0, supplied by the client.
 * The vector masters live in public/brand/vector/ and are the files to hand to
 * a printer. The geometry is restated here only so the symbol can be inlined
 * and inherit currentColor, which is what lets one definition serve the light
 * header, the Deep Slate footer and a reversed placement over photography
 * without three separate files.
 *
 * The coordinates below are transcribed verbatim from
 * 01_Vector_Masters/tte_symbol_primary.svg on the supplied 96 unit grid.
 * scripts/check-brand.mjs re-reads that file and fails the build if this copy
 * ever drifts from it, so there is no way for the inline mark and the shipped
 * vector to disagree.
 *
 * ============================== BRAND RULES ================================
 * Two rules from the supplied README are load-bearing:
 *
 *   "Primary identity: Deep Slate one-colour mark."
 *   "Ember is a controlled supporting accent only and must never colour a
 *    plane in the core symbol."
 *
 * So the symbol is rendered in one colour, always, inheriting from its
 * context. There is no ember variant of the symbol and there must not be one.
 * The accent appears only as the small rule device in the supplied lockups and
 * icons, which is why those are used as supplied rather than reconstructed.
 * ===========================================================================
 */

/**
 * The two planes of the threshold, as polygon points on the 96 unit grid.
 * They read as two surfaces receding toward a gap: the threshold itself is the
 * negative space between them, which is why the gap is never closed up to make
 * the mark "tidier" at small sizes.
 */
export const SYMBOL = {
  name: 'A2 Architectural Threshold',
  viewBox: '0 0 96 96',
  planes: [
    '8,16 44,28 44,84 8,72',
    '52,28 88,16 88,72 52,84',
  ],
};

/**
 * Minimum sizes, from 03_Guidelines_and_Tokens/tte_brand_tokens.json.
 * Reproduced so a component can assert against them rather than a designer
 * having to remember them.
 */
export const MINIMUM_SIZES = {
  symbolDigital: 16,
  symbolPrintMm: 5,
  horizontalWithTagline: 200,
  horizontalCompact: 140,
  stacked: 96,
};

/** The supplied asset set, by role. Paths are public URLs. */
export const ASSETS = {
  symbol: {
    primary: '/brand/vector/tte_symbol_primary.svg',
    reversed: '/brand/vector/tte_symbol_reversed.svg',
    tonal: '/brand/vector/tte_symbol_tonal.svg',
  },
  horizontal: {
    primary: '/brand/vector/tte_horizontal_primary.svg',
    reversed: '/brand/vector/tte_horizontal_reversed.svg',
    mono: '/brand/vector/tte_horizontal_mono.svg',
    compact: '/brand/vector/tte_horizontal_compact.svg',
  },
  stacked: {
    primary: '/brand/vector/tte_stacked_primary.svg',
    reversed: '/brand/vector/tte_stacked_reversed.svg',
    mono: '/brand/vector/tte_stacked_mono.svg',
  },
  icons: {
    favicon: '/favicon.svg',
    appIcon: '/brand/icons/tte_app_icon.svg',
    socialAvatar: '/brand/icons/tte_social_avatar.svg',
    socialAvatarPng: '/brand/icons/tte_social_avatar_1080.png',
  },
  reference: {
    guidelines: '/brand/reference/TTE_Masterbrand_Guidelines_v1.0.pdf',
    tokens: '/brand/reference/tte_brand_tokens.json',
  },
};

/**
 * The Edge family, section 7.
 *
 * The supplied README is explicit that the family lockups are not yet drawn:
 * "The exact organisation family names and descriptors referenced in section 7
 * were not supplied. The masterbrand and descriptor construction rule are
 * complete; named family lockups remain to be generated when those names are
 * confirmed."
 *
 * The names below are the confirmed ones from the brief, so they are what the
 * lockups should be generated from. Until those lockups exist, nothing on this
 * site renders a family mark: an approximated ECCS lockup would be worse than
 * none, because ECCS is a separate legal entity and its mark is not ours to
 * improvise.
 */
export const FAMILY_PENDING = [
  {
    key: 'tte',
    name: 'The Transformation Edge',
    descriptor: 'Church',
    status: 'masterbrand, supplied',
  },
  {
    key: 'eccs',
    name: 'Edge Community Care Services Ltd',
    descriptor: 'Community care',
    status: 'lockup to be generated. Separate legal entity, DGR-endorsed.',
  },
  {
    key: 'edgedin',
    name: 'EdgedIn Network',
    descriptor: 'Media and publishing',
    status: 'lockup to be generated',
  },
];

/**
 * Renders the symbol to a standalone one-colour SVG document.
 * @param {{ size?: number, colour?: string, title?: string }} [options]
 */
export function symbolToSvg(options = {}) {
  const {
    size = 96,
    colour = 'currentColor',
    title = 'The Transformation Edge',
  } = options;
  const planes = SYMBOL.planes.map((points) => `  <polygon points="${points}" />`).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SYMBOL.viewBox}" width="${size}" height="${size}" fill="${colour}" role="img" aria-label="${title}">
  <title>${title}</title>
${planes}
</svg>
`;
}
