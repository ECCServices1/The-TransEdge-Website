#!/usr/bin/env node
/**
 * Builds the self-contained A/B typography preview.
 *
 * The page has to be judged on real type, not on descriptions of type, so both
 * faces are inlined as data URIs and the hero specimens are live HTML. The full
 * page renders are inlined too, because the decision is partly about how the
 * setting behaves in a real composition rather than in a specimen.
 *
 * Everything is embedded: the artifact CSP blocks external fonts and images.
 *
 * Run: node scripts/build-typography-preview.mjs <outputFile>
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2];
if (!out) {
  console.error('Usage: node scripts/build-typography-preview.mjs <outputFile>');
  process.exit(1);
}

const SCRATCH = dirname(out);

/** @param {string} path @param {string} mime */
async function dataUri(path, mime) {
  const buffer = await readFile(path);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

const [fraunces, interVar, interDisplay, aDesk, bDesk, aNarrow, bNarrow] = await Promise.all([
  dataUri(join(SCRATCH, 'fonts-A', 'fraunces-latin-0-1.woff2'), 'font/woff2'),
  dataUri(join(root, 'public', 'fonts', 'inter-latin.woff2'), 'font/woff2'),
  dataUri(join(root, 'public', 'fonts', 'inter-display-700-latin.woff2'), 'font/woff2'),
  dataUri(join(SCRATCH, 'A-desktop.png'), 'image/png'),
  dataUri(join(SCRATCH, 'B-desktop.png'), 'image/png'),
  dataUri(join(SCRATCH, 'A-narrow.png'), 'image/png'),
  dataUri(join(SCRATCH, 'B-narrow.png'), 'image/png'),
]);

const changes = [
  ['Display face', 'Fraunces, variable serif', 'Inter Display, grotesque'],
  ['Voices on the page', 'Two: serif display, sans body', 'One: Inter Display and Inter'],
  ['Hero copy', 'A church in Penrith with a vision that reaches nations.', 'A church in Penrith. A vision to impact nations.'],
  ['Display size, desktop', '76.8px', '82px'],
  ['Display tracking', '-0.02em', '-0.038em'],
  ['Display weight', '600 semibold', '700 bold'],
  ['Nav minimum', '13.3px', '14px'],
  ['Micro floor', 'none defined', '12px, supporting labels only'],
  ['Reassurance copy', 'Your kids are looked after', 'Your children are cared for'],
];

const html = `<title>Serif or One Voice</title>
<style>
  @font-face {
    font-family: 'Fraunces';
    src: url('${fraunces}') format('woff2');
    font-weight: 100 900;
    font-display: block;
  }
  @font-face {
    font-family: 'Inter';
    src: url('${interVar}') format('woff2');
    font-weight: 100 900;
    font-display: block;
  }
  @font-face {
    font-family: 'Inter Display';
    src: url('${interDisplay}') format('woff2');
    font-weight: 700;
    font-display: block;
  }

  /* The TTE masterbrand palette. This page is about their brand, so it is set
     in their brand rather than in a house style of mine. */
  :root {
    --ground: #f6f5f2;
    --raised: #ffffff;
    --ink: #171d24;
    --slate: #303847;
    --muted: #5c5a56;
    --rule: #d8d5cf;
    --accent: #a94722;
    --ember: #e46f3c;
    --shade: rgba(23, 29, 36, 0.06);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --ground: #171d24;
      --raised: #303847;
      --ink: #f6f5f2;
      --slate: #d8d5cf;
      --muted: #c7c3bc;
      --rule: #383a3d;
      --accent: #f6895b;
      --ember: #f6895b;
      --shade: rgba(0, 0, 0, 0.35);
    }
  }

  :root[data-theme='dark'] {
    --ground: #171d24;
    --raised: #303847;
    --ink: #f6f5f2;
    --slate: #d8d5cf;
    --muted: #c7c3bc;
    --rule: #383a3d;
    --accent: #f6895b;
    --ember: #f6895b;
    --shade: rgba(0, 0, 0, 0.35);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 1rem;
    line-height: 1.625;
    font-weight: 450;
    -webkit-font-smoothing: antialiased;
  }

  .shell {
    max-width: 68rem;
    margin-inline: auto;
    padding: clamp(1.5rem, 1rem + 3vw, 4rem) clamp(1.25rem, 0.75rem + 2.5vw, 3rem) 6rem;
    display: flex;
    flex-direction: column;
    gap: clamp(3rem, 2rem + 4vw, 5rem);
  }

  .eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 0.75rem;
  }

  h1 {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: clamp(2rem, 1.4rem + 2.6vw, 3rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0 0 1rem;
    text-wrap: balance;
  }

  .lede {
    max-width: 44rem;
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--muted);
    margin: 0;
  }

  h2 {
    font-size: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin: 0 0 1.25rem;
  }

  section { margin: 0; }

  /* --- the two options, as a spine ------------------------------------- */

  .options {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 60rem) {
    .options { grid-template-columns: 1fr 1fr; }
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--raised);
    border: 1px solid var(--rule);
    border-radius: 4px;
  }

  .option__tag {
    display: inline-flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 650;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }

  .option__tag b {
    font-size: 0.875rem;
    color: var(--ink);
  }

  .option--new { border-color: var(--accent); }

  /* Live specimens. Each renders in the face it is arguing for. */
  .specimen {
    margin: 0;
    padding: 1.25rem 0;
    border-block: 1px solid var(--rule);
  }

  .specimen p { margin: 0; }

  .specimen--serif p {
    font-family: 'Fraunces', Georgia, serif;
    font-size: clamp(1.5rem, 1rem + 2.4vw, 2.35rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.12;
  }

  .specimen--grotesque p {
    font-family: 'Inter Display', 'Inter', sans-serif;
    font-size: clamp(1.5rem, 1rem + 2.4vw, 2.35rem);
    font-weight: 700;
    letter-spacing: -0.038em;
    line-height: 1.07;
  }

  .specimen em {
    font-style: normal;
    color: var(--accent);
  }

  .traits {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9375rem;
    color: var(--muted);
  }

  .traits li {
    padding-inline-start: 1.125rem;
    position: relative;
  }

  .traits li::before {
    content: '';
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0.68em;
    width: 0.5rem;
    height: 2px;
    background: var(--accent);
  }

  figure { margin: 0; }

  figure img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--rule);
    border-radius: 3px;
    background: var(--ground);
  }

  figcaption {
    margin-top: 0.625rem;
    font-size: 0.8125rem;
    color: var(--muted);
  }

  /* --- change table ----------------------------------------------------- */

  .table-scroll { overflow-x: auto; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
    min-width: 40rem;
  }

  th, td {
    text-align: start;
    padding: 0.75rem 1rem 0.75rem 0;
    border-bottom: 1px solid var(--rule);
    vertical-align: top;
  }

  th {
    font-size: 0.75rem;
    font-weight: 650;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }

  tbody th { font-size: 0.9375rem; letter-spacing: 0; text-transform: none; color: var(--ink); font-weight: 600; }

  td.is-new { color: var(--ink); font-weight: 500; }
  td.is-old { color: var(--muted); }

  /* --- flag ------------------------------------------------------------- */

  .flag {
    padding: 1.5rem;
    background: var(--raised);
    border: 1px solid var(--rule);
    border-inline-start: 3px solid var(--accent);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .flag p { margin: 0; max-width: 46rem; }

  .ratio {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ratio li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-variant-numeric: tabular-nums;
  }

  .ratio b {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ratio span { font-size: 0.8125rem; color: var(--muted); }

  .swatch-row { display: flex; gap: 0.5rem; align-items: center; }
  .swatch { width: 1.75rem; height: 1.75rem; border-radius: 3px; border: 1px solid var(--rule); }

  .verdict {
    font-size: 1.0625rem;
    max-width: 46rem;
    margin: 0;
  }

  .verdict strong { font-weight: 650; }

  footer {
    font-size: 0.8125rem;
    color: var(--muted);
    border-top: 1px solid var(--rule);
    padding-top: 1.5rem;
  }

  a { color: var(--accent); }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
</style>

<div class="shell">
  <header>
    <p class="eyebrow">The Transformation Edge &middot; typography direction</p>
    <h1>Serif or one voice</h1>
    <p class="lede">
      The typography handover replaces the serif display face with Inter Display, so the site
      speaks in one voice instead of two. This is what both look like in the real page, and
      what else changes if the new direction is approved.
    </p>
  </header>

  <section aria-labelledby="opts">
    <h2 id="opts">The two directions</h2>
    <div class="options">
      <div class="option">
        <p class="option__tag">Option A <b>Current build</b></p>
        <div class="specimen specimen--serif">
          <p>A church in Penrith with a vision that reaches <em>nations</em>.</p>
        </div>
        <ul class="traits">
          <li>Fraunces for display, Inter for everything else.</li>
          <li>Warm and editorial. Reads as a considered publication.</li>
          <li>Two voices on the page: a serif masthead over a grotesque body.</li>
          <li>The serif has no relationship to the mark, which is drawn from flat planes.</li>
        </ul>
      </div>

      <div class="option option--new">
        <p class="option__tag">Option B <b>Supplied handover</b></p>
        <div class="specimen specimen--grotesque">
          <p>A church in Penrith. A vision to impact <em>nations.</em></p>
        </div>
        <ul class="traits">
          <li>Inter Display for display, Inter for everything else.</li>
          <li>Direct and architectural. Reads as signage rather than as a publication.</li>
          <li>One voice. The handover's stated reason: a serif "would create a second and competing masterbrand voice".</li>
          <li>Matches the A2 threshold mark, which is built from flat planes and right angles.</li>
        </ul>
      </div>
    </div>
  </section>

  <section aria-labelledby="pages">
    <h2 id="pages">In the real page</h2>
    <div class="options">
      <figure>
        <img src="${aDesk}" alt="Option A home page at desktop width, headline set in the Fraunces serif." />
        <figcaption>A &middot; desktop, 1280px</figcaption>
      </figure>
      <figure>
        <img src="${bDesk}" alt="Option B home page at desktop width, headline set in Inter Display across two authored lines." />
        <figcaption>B &middot; desktop, 1280px</figcaption>
      </figure>
      <figure>
        <img src="${aNarrow}" alt="Option A home page at narrow width." />
        <figcaption>A &middot; narrow, 520px</figcaption>
      </figure>
      <figure>
        <img src="${bNarrow}" alt="Option B home page at narrow width." />
        <figcaption>B &middot; narrow, 520px</figcaption>
      </figure>
    </div>
  </section>

  <section aria-labelledby="diff">
    <h2 id="diff">What else changes</h2>
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th scope="col">&nbsp;</th><th scope="col">A, current</th><th scope="col">B, supplied</th></tr>
        </thead>
        <tbody>
          ${changes
            .map(
              ([label, a, b]) =>
                `<tr><th scope="row">${label}</th><td class="is-old">${a}</td><td class="is-new">${b}</td></tr>`
            )
            .join('\n          ')}
        </tbody>
      </table>
    </div>
  </section>

  <section aria-labelledby="flag">
    <h2 id="flag">One conflict, and how it is currently resolved</h2>
    <div class="flag">
      <p>
        The handover asks for the bright ember <code>#E46F3C</code> on the word
        <em>nations.</em> Measured against the porcelain surface that is <strong>2.90:1</strong>,
        which fails WCAG 2.2 even at the 3:1 threshold that applies to large text. Section 21 of
        the brief makes AA the floor, so the build uses the accessible cut of ember that the
        masterbrand's own token file supplies for text.
      </p>
      <ul class="ratio">
        <li>
          <div class="swatch-row"><span class="swatch" style="background:#e46f3c"></span><b>2.90:1</b></div>
          <span>#E46F3C as specified &middot; fails</span>
        </li>
        <li>
          <div class="swatch-row"><span class="swatch" style="background:#a94722"></span><b>5.33:1</b></div>
          <span>#A94722 as built &middot; passes AA</span>
        </li>
      </ul>
      <p>
        The screenshots above show the accessible cut. If you would rather have the brighter
        ember and accept the failure, it is a one-line change and should be recorded as a
        deliberate trade.
      </p>
    </div>
  </section>

  <section aria-labelledby="rec">
    <h2 id="rec">Recommendation</h2>
    <p class="verdict">
      <strong>Take B.</strong> The argument in the handover is the right one: two display voices
      on one page is a brand problem, not a taste problem, and the grotesque is the better match
      for a mark built from flat planes. B also raises three accessibility floors that A did not
      have, which is worth more than the warmth A gives up. The one thing A did better is the
      vision statement set at length, where the serif read more like scripture and less like
      signage. That is worth revisiting for that block alone once B is approved.
    </p>
  </section>

  <footer>
    Rendered from the built site at 1280px and 520px. Specimens are live text in the actual
    faces, not images. Both faces are SIL Open Font Licence 1.1.
  </footer>
</div>
`;

await writeFile(out, html, 'utf8');
const { size } = await import('node:fs').then((fs) => fs.promises.stat(out));
console.log(`wrote ${out} (${(size / 1024 / 1024).toFixed(2)} MB)`);
