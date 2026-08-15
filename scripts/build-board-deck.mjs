#!/usr/bin/env node
/**
 * Builds the board approval deck.
 *
 * Fonts are Office-safe deliberately. Fraunces and Inter are the brand faces but
 * they are not installed on a typical Office machine, so a deck set in them
 * would substitute unpredictably on the projector. Cambria carries the serif
 * voice and Calibri the sans, which is the closest honest stand-in.
 *
 * Run: node scripts/build-board-deck.mjs <assetDir> <outputFile>
 */
import PptxGenJS from 'pptxgenjs';
import { join } from 'node:path';

const [assets, out] = process.argv.slice(2);
if (!assets || !out) {
  console.error('Usage: node scripts/build-board-deck.mjs <assetDir> <outputFile>');
  process.exit(1);
}

const SLATE = '303847';
const INK = '171D24';
const PORCELAIN = 'F6F5F2';
const WHITE = 'FFFFFF';
const EMBER = 'E46F3C';
const EMBER_TEXT = 'A94722';
const MUTED = '5C5A56';
const RULE = 'D8D5CF';
const MUTED_ON_DARK = 'C7C3BC';

const SERIF = 'Cambria';
const SANS = 'Calibri';

const img = (n) => join(assets, n);

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.3 x 7.5
pres.author = 'The Transformation Edge';
pres.title = 'Brand and website: board approval';

const W = 13.3;
const M = 0.85; // margin

/** Dark slide ground. */
function dark(slide) {
  slide.background = { color: SLATE };
}
function light(slide) {
  slide.background = { color: PORCELAIN };
}

/** The recurring motif: the threshold mark, small, top right. */
function motif(slide, onDark = false) {
  slide.addImage({
    path: img(onDark ? 'mark-light.png' : 'mark-slate.png'),
    x: W - M - 0.42,
    y: 0.45,
    w: 0.42,
    h: 0.42,
    transparency: onDark ? 25 : 40,
  });
}

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: M,
    y: opts.y ?? 0.62,
    w: opts.w ?? W - M * 2 - 0.7,
    h: opts.h ?? 1.0,
    fontFace: SERIF,
    fontSize: opts.size ?? 34,
    bold: true,
    color: opts.color ?? INK,
    align: 'left',
    valign: 'top',
    margin: 0,
  });
}

function kicker(slide, text, color = MUTED) {
  slide.addText(text.toUpperCase(), {
    x: M,
    y: 0.3,
    w: 8,
    h: 0.3,
    fontFace: SANS,
    fontSize: 11,
    bold: true,
    charSpacing: 1.6,
    color,
    margin: 0,
  });
}

/* ---------------------------------------------------------------- 1 title */
{
  const s = pres.addSlide();
  dark(s);
  s.addImage({ path: img('mark-light.png'), x: M, y: 1.55, w: 1.0, h: 1.0 });
  s.addText('A new mark, a new voice,\na new website.', {
    x: M, y: 2.85, w: 9.6, h: 1.9,
    fontFace: SERIF, fontSize: 40, bold: true, color: PORCELAIN, lineSpacing: 48, margin: 0,
  });
  s.addText('The Transformation Edge  ·  for board approval', {
    x: M, y: 4.85, w: 9.6, h: 0.4,
    fontFace: SANS, fontSize: 15, color: MUTED_ON_DARK, margin: 0,
  });
  s.addText('Presented by Dr Michaels Aibangbee and Pastor Osas Aibangbee', {
    x: M, y: 6.4, w: 9.6, h: 0.35,
    fontFace: SANS, fontSize: 12, color: MUTED_ON_DARK, margin: 0,
  });
  s.addNotes(
    'We are asking the board to approve three things tonight: the new symbol, the typography, and the new website before it replaces the Wix site. Everything you will see has been built and measured, not mocked up.'
  );
}

/* -------------------------------------------------------- 2 the three asks */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'What we are asking for');
  title(s, 'Three approvals');

  const asks = [
    ['The symbol', 'A2 Architectural Threshold, and the masterbrand it belongs to.'],
    ['The typography', 'Fraunces for headings, Inter for everything else. Both open licence.'],
    ['The website', 'Approval to move off Wix and go live on the new site.'],
  ];
  asks.forEach(([h, b], i) => {
    const y = 2.1 + i * 1.45;
    s.addShape(pres.ShapeType.ellipse, {
      x: M, y, w: 0.62, h: 0.62, fill: { color: SLATE },
    });
    s.addText(String(i + 1), {
      x: M, y, w: 0.62, h: 0.62,
      fontFace: SANS, fontSize: 20, bold: true, color: PORCELAIN, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(h, {
      x: M + 1.0, y: y - 0.04, w: 9.5, h: 0.4,
      fontFace: SERIF, fontSize: 21, bold: true, color: INK, margin: 0,
    });
    s.addText(b, {
      x: M + 1.0, y: y + 0.42, w: 10.2, h: 0.55,
      fontFace: SANS, fontSize: 14, color: MUTED, margin: 0,
    });
  });
  s.addNotes('Three separate decisions. The board can approve all three, or approve the brand and hold the website until the outstanding items on slide 12 are closed.');
}

/* ------------------------------------------------------------ 3 why change */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'Why change');
  title(s, 'What was wrong with the old mark');

  s.addImage({ path: img('mark-old.png'), x: M, y: 2.15, w: 2.5, h: 2.5 });
  s.addText('The old mark', {
    x: M, y: 4.8, w: 2.5, h: 0.3,
    fontFace: SANS, fontSize: 11, bold: true, charSpacing: 1.2, color: MUTED, align: 'center', margin: 0,
  });

  const faults = [
    'The circle was decoration. It added no meaning and shrank everything inside it.',
    'The monogram read EGDE left to right. English readers read left to right first.',
    'Five elements competed, and none could stand alone as an icon.',
    'The palette was cool and flat, reading corporate rather than warm.',
    'There was no reversed, single-colour, dark-mode or app-icon version.',
  ];
  faults.forEach((f, i) => {
    const y = 2.2 + i * 0.72;
    s.addShape(pres.ShapeType.ellipse, { x: 4.15, y: y + 0.06, w: 0.2, h: 0.2, fill: { color: EMBER } });
    s.addText(f, {
      x: 4.6, y, w: 7.9, h: 0.62,
      fontFace: SANS, fontSize: 14, color: INK, margin: 0, valign: 'top',
    });
  });
  s.addNotes('These are not matters of taste. The EGDE reading is a defect in a mark that has to carry a family of organisations, and the missing variants meant every new use needed a workaround.');
}

/* ------------------------------------------------------------- 4 the symbol */
{
  const s = pres.addSlide();
  dark(s);
  kicker(s, 'The symbol', MUTED_ON_DARK);
  title(s, 'A2 Architectural Threshold', { color: PORCELAIN });

  s.addImage({ path: img('mark-light.png'), x: 8.4, y: 2.2, w: 3.4, h: 3.4 });
  s.addText(
    'Two planes standing apart, with the way through between them.',
    { x: M, y: 2.15, w: 7.0, h: 0.9, fontFace: SERIF, fontSize: 22, color: PORCELAIN, margin: 0 }
  );
  const points = [
    'No letterform, so it cannot be misread.',
    'No containing circle, so it never shrinks inside its own frame.',
    'One colour, always. Deep Slate on light, porcelain reversed on dark.',
    'The gap is the threshold. It is never closed up to look tidier.',
  ];
  s.addText(
    points.map((p, i) => ({ text: p, options: { bullet: true, breakLine: i < points.length - 1 } })),
    { x: M, y: 3.35, w: 7.0, h: 2.4, fontFace: SANS, fontSize: 14, color: MUTED_ON_DARK, paraSpaceAfter: 10, margin: 0 }
  );
  s.addNotes('The name comes from the supplied masterbrand suite. The idea is a threshold: the way through is already open. That is the vision and the tagline in one form, without stating either.');
}

/* --------------------------------------------------------- 5 works at size */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'It works everywhere');
  title(s, 'Legible at every size');

  const sizes = [
    [0.22, '16px'],
    [0.34, '24px'],
    [0.5, '32px'],
    [0.8, '48px'],
    [1.4, '96px'],
    [2.2, '144px'],
  ];
  let x = M;
  sizes.forEach(([w, label]) => {
    s.addImage({ path: img('mark-slate.png'), x, y: 3.4 - w / 2, w, h: w });
    s.addText(label, {
      x: x - 0.25, y: 4.75, w: w + 0.5, h: 0.28,
      fontFace: SANS, fontSize: 10, color: MUTED, align: 'center', margin: 0,
    });
    x += w + 0.75;
  });

  s.addText(
    'The old lockup was illegible below about 90px. This holds at 16px, which is the size of a browser tab.',
    { x: M, y: 5.5, w: 10.5, h: 0.6, fontFace: SANS, fontSize: 14, color: MUTED, margin: 0 }
  );
  s.addNotes('The build refuses to render the mark below 16px, so it cannot be set too small by accident.');
}

/* ---------------------------------------------------------------- 6 palette */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'Colour');
  title(s, 'Warmth the old palette did not have');

  const swatches = [
    [SLATE, 'Deep Slate', '#303847', 'The identity', PORCELAIN],
    ['4B576E', 'Heritage Slate', '#4B576E', 'Carried forward', PORCELAIN],
    [EMBER, 'Ember', '#E46F3C', 'Accent, never text', INK],
    [EMBER_TEXT, 'Ember Accessible', '#A94722', 'Accent when it is text', PORCELAIN],
    [PORCELAIN, 'Porcelain', '#F6F5F2', 'The page ground', INK],
    [INK, 'Ink', '#171D24', 'Body text', PORCELAIN],
  ];
  swatches.forEach(([hex, name, code, use, fg], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * 3.95;
    const y = 2.05 + row * 2.2;
    s.addShape(pres.ShapeType.rect, { x, y, w: 3.5, h: 1.85, fill: { color: hex },
      line: hex === PORCELAIN ? { color: RULE, width: 1 } : undefined });
    s.addText(name, { x: x + 0.22, y: y + 1.0, w: 3.1, h: 0.3, fontFace: SANS, fontSize: 13, bold: true, color: fg, margin: 0 });
    s.addText(code, { x: x + 0.22, y: y + 1.3, w: 3.1, h: 0.25, fontFace: 'Courier New', fontSize: 10, color: fg, margin: 0 });
    s.addText(use, { x: x + 0.22, y: y + 1.53, w: 3.1, h: 0.25, fontFace: SANS, fontSize: 10, color: fg, margin: 0 });
  });
  s.addNotes('Ember is the one people will want to overuse. It fails contrast as text, so there is a second, darker cut for words. The rule is that ember stays under five per cent of any composition.');
}

/* ------------------------------------------------------------- 7 typography */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'Typography');
  title(s, 'A serif that sounds like a congregation');

  s.addText('A vision to impact nations.', {
    x: M, y: 2.15, w: 11.0, h: 1.1,
    fontFace: SERIF, fontSize: 40, bold: true, color: INK, margin: 0,
  });
  s.addText('Fraunces  ·  headings only', {
    x: M, y: 3.25, w: 5, h: 0.3, fontFace: SANS, fontSize: 11, color: MUTED, margin: 0,
  });

  s.addText('The welcome desk is just inside the main entrance. Tell them it is your first Sunday and someone will walk you in.', {
    x: M, y: 4.0, w: 7.2, h: 1.0,
    fontFace: SANS, fontSize: 16, color: INK, margin: 0,
  });
  s.addText('Inter  ·  body, navigation, buttons, labels, legal', {
    x: M, y: 5.05, w: 6, h: 0.3, fontFace: SANS, fontSize: 11, color: MUTED, margin: 0,
  });

  s.addShape(pres.ShapeType.rect, { x: 8.6, y: 3.95, w: 3.85, h: 1.95, fill: { color: WHITE }, line: { color: RULE, width: 1 } });
  s.addText('Minimum sizes', { x: 8.85, y: 4.12, w: 3.4, h: 0.3, fontFace: SANS, fontSize: 11, bold: true, charSpacing: 1.2, color: MUTED, margin: 0 });
  s.addText(
    [
      { text: 'Navigation  14px', options: { breakLine: true } },
      { text: 'Body  16px', options: { breakLine: true } },
      { text: '12px  labels only, never for safeguarding, privacy or giving', options: {} },
    ],
    { x: 8.85, y: 4.5, w: 3.4, h: 1.3, fontFace: SANS, fontSize: 12, color: INK, paraSpaceAfter: 6, margin: 0 }
  );

  s.addText('Both typefaces are open licence. No fee, no renewal, no per-domain licence to track.', {
    x: M, y: 6.1, w: 11.0, h: 0.4, fontFace: SANS, fontSize: 13, italic: true, color: MUTED, margin: 0,
  });
  s.addNotes('The 12px rule came out of the typography review and it changed real pages: the crisis support numbers, the privacy notices and the giving page were all set too small and have been raised.');
}

/* ------------------------------------------------------------- 8 the site */
{
  const s = pres.addSlide();
  dark(s);
  kicker(s, 'The website', MUTED_ON_DARK);
  title(s, 'One page, one job', { color: PORCELAIN });
  s.addImage({ path: img('C-desktop.png'), x: M, y: 1.95, w: 8.3, h: 4.93 });
  const notes = [
    'Who, where, when and one action, above the fold.',
    'No carousel, no autoplay, no pop-up.',
    'A first-time visitor can answer "should I come" in under a minute.',
  ];
  s.addText(
    notes.map((n, i) => ({ text: n, options: { bullet: true, breakLine: i < notes.length - 1 } })),
    { x: 9.6, y: 2.4, w: 2.9, h: 3.0, fontFace: SANS, fontSize: 13, color: MUTED_ON_DARK, paraSpaceAfter: 12, margin: 0 }
  );
  s.addNotes('This is the built site, not a mock-up. Every screenshot in this deck is a real page rendered from the real code.');
}

/* --------------------------------------------------------- 9 the key pages */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'The website');
  title(s, 'The pages that do the work');

  const shots = [
    ['shot-visit.png', 'Plan your visit', 'Four steps to a calendar invite and a name to look for.'],
    ['shot-give.png', 'Give', 'Two methods. Receipts explained honestly.'],
    ['shot-mobile.png', 'On a phone', 'Built for a mid-range Android on mobile data.'],
  ];
  shots.forEach(([file, h, b], i) => {
    const x = M + i * 3.95;
    s.addImage({ path: img(file), x, y: 2.0, w: 3.5, h: file === 'shot-mobile.png' ? 2.4 : 2.46, sizing: { type: 'cover', w: 3.5, h: 2.4 } });
    s.addText(h, { x, y: 4.55, w: 3.5, h: 0.32, fontFace: SERIF, fontSize: 17, bold: true, color: INK, margin: 0 });
    s.addText(b, { x, y: 4.92, w: 3.5, h: 0.85, fontFace: SANS, fontSize: 12.5, color: MUTED, margin: 0 });
  });
  s.addNotes('Plan your visit and Give are the two pages that carry the most weight. Giving is deliberately plain: no urgency, no guilt, and it states clearly that church giving is not tax deductible.');
}

/* ------------------------------------------------------------ 10 languages */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'Our community');
  title(s, 'Seven languages, including Arabic');

  s.addImage({ path: img('shot-arabic.png'), x: 6.9, y: 2.0, w: 5.55, h: 3.9 });
  const langs = 'English · 简体中文 · العربية · हिन्दी · Kiswahili · 日本語 · 한국어';
  s.addText(langs, {
    x: M, y: 2.1, w: 5.6, h: 0.9, fontFace: SANS, fontSize: 17, color: INK, margin: 0,
  });
  const pts = [
    'Arabic reads right to left, so the entire layout mirrors. The mark does not.',
    'Each language loads only its own typeface.',
    'Nothing machine-translated is published. A language stays unlisted until a member of the congregation has reviewed it.',
  ];
  s.addText(
    pts.map((p, i) => ({ text: p, options: { bullet: true, breakLine: i < pts.length - 1 } })),
    { x: M, y: 3.2, w: 5.6, h: 2.6, fontFace: SANS, fontSize: 13, color: MUTED, paraSpaceAfter: 12, margin: 0 }
  );
  s.addNotes('We need one named reviewer per language. That is the only thing standing between us and publishing them, and it is a job for people already in the congregation.');
}

/* ---------------------------------------------------------- 11 the numbers */
{
  const s = pres.addSlide();
  dark(s);
  kicker(s, 'Measured, not claimed', MUTED_ON_DARK);
  title(s, 'How it performs', { color: PORCELAIN });

  const stats = [
    ['100', 'Accessibility score', 'Including the Arabic page'],
    ['1.8s', 'Load time on 4G', 'Budget was 2.0s'],
    ['52', 'Colour pairs tested', 'All pass WCAG 2.2 AA'],
    ['<$25', 'Hosting per month', 'Down from the Wix plan'],
  ];
  stats.forEach(([n, label, sub], i) => {
    const x = M + i * 2.95;
    s.addText(n, { x, y: 2.4, w: 2.7, h: 1.0, fontFace: SERIF, fontSize: 50, bold: true, color: PORCELAIN, margin: 0 });
    s.addText(label, { x, y: 3.5, w: 2.7, h: 0.35, fontFace: SANS, fontSize: 13, bold: true, color: PORCELAIN, margin: 0 });
    s.addText(sub, { x, y: 3.85, w: 2.7, h: 0.6, fontFace: SANS, fontSize: 11.5, color: MUTED_ON_DARK, margin: 0 });
  });

  s.addText(
    'These are checked automatically every time anyone changes the site. If a change breaks accessibility or slows the page past budget, it cannot be published.',
    { x: M, y: 5.3, w: 11.0, h: 0.8, fontFace: SANS, fontSize: 14, color: MUTED_ON_DARK, margin: 0 }
  );
  s.addNotes('The point is not the numbers themselves, it is that they are enforced. Standards that are not enforced last about six weeks.');
}

/* ------------------------------------------------------- 12 what is not done */
{
  const s = pres.addSlide();
  light(s);
  motif(s);
  kicker(s, 'Being straight with you');
  title(s, 'What is not finished');

  const open = [
    ['Decisions we need from you', 'Bank details for the Give page. A reviewer for each language. Who approves the weekly notice. Where photo consent records are kept.'],
    ['Waiting on Connect', 'Events and sermons come from the Connect Hub. Until its data feed exists, they are entered by hand. The site works either way.'],
    ['Photography', 'Every image is a real photograph of this congregation, or it is not published. None have been taken yet. A shot list is ready for one Sunday.'],
    ['Before we switch the domain', 'Every old Wix address has to redirect. That list needs exporting from the current site.'],
  ];
  open.forEach(([h, b], i) => {
    const y = 1.95 + i * 1.2;
    s.addShape(pres.ShapeType.rect, { x: M, y, w: 11.6, h: 1.02, fill: { color: WHITE }, line: { color: RULE, width: 1 } });
    s.addText(h, { x: M + 0.28, y: y + 0.12, w: 3.6, h: 0.3, fontFace: SANS, fontSize: 13, bold: true, color: EMBER_TEXT, margin: 0 });
    s.addText(b, { x: M + 4.0, y: y + 0.1, w: 7.4, h: 0.82, fontFace: SANS, fontSize: 12.5, color: MUTED, margin: 0, valign: 'top' });
  });
  s.addNotes('None of these block approving the brand. The bank details and the redirect list are the two that block going live.');
}

/* ------------------------------------------------------------- 13 the ask */
{
  const s = pres.addSlide();
  dark(s);
  s.addImage({ path: img('mark-light.png'), x: M, y: 1.3, w: 0.85, h: 0.85 });
  s.addText('What we are asking the board to approve', {
    x: M, y: 2.5, w: 10.5, h: 1.0,
    fontFace: SERIF, fontSize: 32, bold: true, color: PORCELAIN, margin: 0,
  });
  const asks = [
    'The A2 Architectural Threshold symbol and the masterbrand around it.',
    'Fraunces and Inter as the typefaces, both open licence.',
    'Moving the website off Wix, subject to the four items on the previous slide.',
  ];
  s.addText(
    asks.map((a, i) => ({ text: a, options: { bullet: true, breakLine: i < asks.length - 1 } })),
    { x: M, y: 3.7, w: 10.5, h: 1.9, fontFace: SANS, fontSize: 16, color: PORCELAIN, paraSpaceAfter: 14, margin: 0 }
  );
  s.addText('A Change is Inevitable', {
    x: M, y: 6.1, w: 8, h: 0.5,
    fontFace: SERIF, fontSize: 17, italic: true, color: MUTED_ON_DARK, margin: 0,
  });
  s.addNotes('If the board approves tonight, the brand is final and the remaining work is operational. We would aim to switch the domain once the redirect list and the bank details are confirmed.');
}

await pres.writeFile({ fileName: out });
console.log(`wrote ${out}`);
