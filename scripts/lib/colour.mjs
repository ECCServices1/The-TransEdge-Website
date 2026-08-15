/**
 * Minimal colour maths for the token system: sRGB, OKLab, OKLCh and WCAG
 * contrast. No dependency, so it runs in CI with nothing installed.
 *
 * OKLab conversion follows Björn Ottosson's published matrices.
 */

/** @param {number} x */
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** sRGB gamma encode. @param {number} c linear channel 0..1 */
function gammaEncode(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** sRGB gamma decode. @param {number} c encoded channel 0..1 */
function gammaDecode(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** @param {string} hex */
export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

/** @param {{r:number,g:number,b:number}} rgb */
export function rgbToHex({ r, g, b }) {
  const to = (c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** @param {{r:number,g:number,b:number}} rgb encoded sRGB 0..1 */
export function rgbToOklab({ r, g, b }) {
  const lr = gammaDecode(r);
  const lg = gammaDecode(g);
  const lb = gammaDecode(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** @param {{L:number,a:number,b:number}} lab */
export function oklabToRgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: gammaEncode(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: gammaEncode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: gammaEncode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** @param {{L:number,C:number,H:number}} lch H in degrees */
export function oklchToRgb({ L, C, H }) {
  const rad = (H * Math.PI) / 180;
  return oklabToRgb({ L, a: C * Math.cos(rad), b: C * Math.sin(rad) });
}

/** @param {string} hex */
export function hexToOklch(hex) {
  const { L, a, b } = rgbToOklab(hexToRgb(hex));
  const H = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.sqrt(a * a + b * b), H: H < 0 ? H + 360 : H };
}

/** True when an OKLCh colour falls inside the sRGB gamut. */
export function inGamut({ L, C, H }) {
  const { r, g, b } = oklchToRgb({ L, C, H });
  const eps = 1e-4;
  return [r, g, b].every((c) => c >= -eps && c <= 1 + eps);
}

/**
 * Reduces chroma until the colour fits sRGB, preserving lightness and hue.
 * This is what keeps a generated ramp from clipping to a flat, muddy step.
 */
export function toGamut({ L, C, H }) {
  if (inGamut({ L, C, H })) return oklchToRgb({ L, C, H });
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut({ L, C: mid, H })) lo = mid;
    else hi = mid;
  }
  return oklchToRgb({ L, C: lo, H });
}

/** @param {string} hex */
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * gammaDecode(r) + 0.7152 * gammaDecode(g) + 0.0722 * gammaDecode(b);
}

/**
 * WCAG 2.2 contrast ratio, 1 to 21.
 * @param {string} a
 * @param {string} b
 */
export function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** @param {number} ratio */
export function grade(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA large';
  return 'fail';
}
