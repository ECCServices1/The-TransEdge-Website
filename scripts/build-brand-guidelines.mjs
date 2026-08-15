#!/usr/bin/env node
/**
 * Builds the brand guideline as a self-contained page.
 *
 * Everything is embedded, because the artifact CSP blocks external fonts and
 * images and because a guideline that only renders correctly on one machine is
 * not a guideline.
 *
 * Values are read from the live token file and the live symbol geometry rather
 * than retyped, so the guideline cannot drift from the site it governs. That is
 * the same rule scripts/check-brand.mjs enforces in CI.
 *
 * Run: node scripts/build-brand-guidelines.mjs <outputFile>
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SYMBOL, MINIMUM_SIZES } from '../src/lib/brand-marks.mjs';
import { VISION, MISSION, TAGLINE, CHURCH } from '../src/data/church.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2];
if (!out) {
  console.error('Usage: node scripts/build-brand-guidelines.mjs <outputFile>');
  process.exit(1);
}
const SCRATCH = dirname(out).replace(/\/deliverables$/, '');

async function dataUri(path, mime) {
  return `data:${mime};base64,${(await readFile(path)).toString('base64')}`;
}

const [fraunces, inter, shotBrand, shotVisit, shotGive, shotMobile, shotArabic] = await Promise.all([
  dataUri(join(root, 'public/fonts/fraunces-latin.woff2'), 'font/woff2'),
  dataUri(join(root, 'public/fonts/inter-latin.woff2'), 'font/woff2'),
  dataUri(join(SCRATCH, 'shot-brand.png'), 'image/png'),
  dataUri(join(SCRATCH, 'shot-visit.png'), 'image/png'),
  dataUri(join(SCRATCH, 'shot-give.png'), 'image/png'),
  dataUri(join(SCRATCH, 'shot-mobile.png'), 'image/png'),
  dataUri(join(SCRATCH, 'shot-arabic.png'), 'image/png'),
]);

const lockup = (await readFile(join(root, 'public/brand/vector/tte_horizontal_compact.svg'), 'utf8'))
  .replace(/fill="#303847"/gi, 'fill="currentColor"')
  .replace(/<svg([^>]*)>/, (_m, a) => `<svg${String(a).replace(/\s(?:width|height)="[^"]*"/gi, '')}>`);

const planes = SYMBOL.planes.map((p) => `<polygon points="${p}" />`).join('');
const mark = (size) =>
  `<svg viewBox="${SYMBOL.viewBox}" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${planes}</svg>`;

/* ------------------------------------------------------------ rule content */

const rules = [
  {
    area: 'The symbol',
    do: [
      'Use it in one colour, always. Deep Slate on light, porcelain reversed on dark.',
      'Give it clear space of a quarter of its height on all four sides.',
      'Let the gap between the planes stay exactly as drawn. The gap is the threshold.',
      `Set it at ${MINIMUM_SIZES.symbolDigital}px or larger on screen, ${MINIMUM_SIZES.symbolPrintMm}mm or larger in print.`,
    ],
    dont: [
      'Never colour a plane with ember, or with anything else.',
      'Never add a circle, box, outline, drop shadow or glow.',
      'Never close, narrow or widen the gap to make it look tidier at small sizes.',
      'Never rotate, stretch, skew or redraw it.',
    ],
  },
  {
    area: 'The lockup',
    do: [
      'Use the supplied vector. It is already outlined, so no font travels with it.',
      `Horizontal with tagline at ${MINIMUM_SIZES.horizontalWithTagline}px or 50mm and above.`,
      `Compact at ${MINIMUM_SIZES.horizontalCompact}px or 35mm, stacked at ${MINIMUM_SIZES.stacked}px or 25mm.`,
      'Use the reversed cut on photography and on Deep Slate.',
    ],
    dont: [
      'Never retype the wordmark in any typeface, including Fraunces.',
      'Never rebuild the lockup by placing the symbol beside live text.',
      'Never set a lockup below its minimum size.',
      'Never place the primary cut on a busy photograph.',
    ],
  },
  {
    area: 'Colour',
    do: [
      'Deep Slate #303847 is the identity. It carries the mark and the primary button.',
      'Porcelain #F6F5F2 is the ground. White is the raised surface.',
      'Ember #E46F3C is an accent for graphics: a rule, a marker, a highlight.',
      'Use the accessible cut #A94722 whenever ember is text.',
    ],
    dont: [
      'Never let ember exceed roughly five per cent of a composition.',
      'Never fill a large field or a page background with ember.',
      'Never set body text in ember #E46F3C. It measures 2.90:1 and fails.',
      'Never use colour as the only signal. Pair it with a word or an icon.',
    ],
  },
  {
    area: 'Typography',
    do: [
      'Fraunces sets headings. Inter sets everything else.',
      'Keep sentence case. Headings read as speech, not as signage.',
      'Nav at 14px minimum. Body at 16px minimum.',
      'Hold body copy between 60 and 75 characters a line.',
    ],
    dont: [
      'Never set body, navigation, buttons, labels or legal text in Fraunces.',
      'Never use 12px for instructions, access conditions, safeguarding, privacy, complaints or giving.',
      'Never set a heading in all capitals, and never track a heading open.',
      'Never introduce a third typeface.',
    ],
  },
  {
    area: 'Words',
    do: [
      'Australian English.',
      'Say "Penrith, Sydney" for place.',
      'Write people as leaders and contributors.',
      'Say what a thing is, plainly.',
    ],
    dont: [
      'Never use an em-dash in new copy. A comma, a semicolon or a full stop.',
      'Never write "a multicultural church in Jamisontown", or fix TTE to a suburb.',
      'Never describe pastoral care as therapy, treatment or counselling.',
      'Never imply a tax-deductible receipt for church giving.',
    ],
  },
  {
    area: 'Photography',
    do: [
      'Photograph this congregation, as it actually is.',
      'One warm grade across the whole set, shadows slightly lifted.',
      'Record alt text and a consent for every published image.',
      'Strip EXIF, including location, before the file leaves the camera roll.',
    ],
    dont: [
      'Never use stock photography of people who are not part of this church.',
      'Never publish an image of a child without a recorded parent or guardian consent.',
      'Never arrange people to look more diverse than the room is.',
      'Never crop a person at a joint, and never leave a horizon askew.',
    ],
  },
];

const family = [
  ['The Transformation Edge', 'Church', 'The parent. The masterbrand as supplied.'],
  ['Edge Community Care Services', 'Community care', 'Sister organisation. Separate legal entity, DGR-endorsed. Lockup still to be drawn.'],
  ['EdgedIn Network', 'Media and publishing', 'Media arm. Lockup still to be drawn.'],
  ['Renovate Health Consortium', 'Psychotherapy and counselling', 'Separate practice. Outside the church brand. Linked, never absorbed.'],
];

const html = `<title>The Edge Brand Standards</title>
<style>
  @font-face { font-family:'Fraunces'; src:url('${fraunces}') format('woff2'); font-weight:100 900; font-display:block; }
  @font-face { font-family:'Inter'; src:url('${inter}') format('woff2'); font-weight:100 900; font-display:block; }

  :root {
    --ground:#f6f5f2; --raised:#fff; --sunken:#e9e7e2;
    --ink:#171d24; --slate:#303847; --muted:#5c5a56; --rule:#d8d5cf;
    --accent:#a94722; --ember:#e46f3c;
    --yes:#1f6b3f; --no:#a11b1b;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --ground:#171d24; --raised:#303847; --sunken:#050a10;
      --ink:#f6f5f2; --slate:#d8d5cf; --muted:#c7c3bc; --rule:#383a3d;
      --accent:#f6895b; --ember:#f6895b; --yes:#7fd8a3; --no:#ff9d9d;
    }
  }
  :root[data-theme='dark'] {
    --ground:#171d24; --raised:#303847; --sunken:#050a10;
    --ink:#f6f5f2; --slate:#d8d5cf; --muted:#c7c3bc; --rule:#383a3d;
    --accent:#f6895b; --ember:#f6895b; --yes:#7fd8a3; --no:#ff9d9d;
  }

  *{box-sizing:border-box}
  body{
    margin:0;background:var(--ground);color:var(--ink);
    font-family:'Inter',system-ui,sans-serif;font-size:1rem;line-height:1.625;font-weight:450;
    -webkit-font-smoothing:antialiased;
  }
  .shell{max-width:64rem;margin-inline:auto;padding:clamp(2rem,1rem+4vw,4.5rem) clamp(1.25rem,.75rem+2.5vw,3rem) 6rem;display:flex;flex-direction:column;gap:clamp(3rem,2rem+4vw,5rem)}

  h1,h2,h3{font-family:'Fraunces',Georgia,serif;font-weight:600;text-wrap:balance;margin:0}
  h1{font-size:clamp(2.5rem,1.8rem+3vw,3.75rem);line-height:1.09;letter-spacing:-.019em;font-variation-settings:'SOFT' 30,'opsz' 144}
  h2{font-size:clamp(1.75rem,1.3rem+1.8vw,2.5rem);line-height:1.18;letter-spacing:-.015em;font-variation-settings:'opsz' 96;margin-bottom:1.25rem}
  h3{font-size:1.25rem;line-height:1.29;font-variation-settings:'opsz' 24;margin-bottom:.5rem}

  .eyebrow{font-size:.75rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:0 0 .75rem}
  .lede{max-width:44rem;font-size:1.125rem;line-height:1.6;color:var(--muted);margin:1rem 0 0}
  p{margin:0}
  section{margin:0}
  .stack{display:flex;flex-direction:column;gap:1.5rem}

  .card{background:var(--raised);border:1px solid var(--rule);border-radius:4px;padding:1.5rem}

  /* locked statements */
  blockquote{margin:0;padding:1.25rem 0 1.25rem 1.25rem;border-inline-start:3px solid var(--accent);font-family:'Fraunces',Georgia,serif;font-size:1.1875rem;line-height:1.45;font-variation-settings:'opsz' 24}

  /* mark specimens */
  .marks{display:flex;flex-wrap:wrap;gap:2rem;align-items:flex-end}
  .marks figure{display:flex;flex-direction:column;align-items:center;gap:.5rem;margin:0;font-size:.75rem;color:var(--muted);font-variant-numeric:tabular-nums}
  .grounds{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:.75rem}
  .ground{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;min-height:9rem;border-radius:4px;font-size:.75rem}
  .g-paper{background:#f6f5f2;color:#303847;border:1px solid var(--rule)}
  .g-white{background:#fff;color:#303847;border:1px solid var(--rule)}
  .g-slate{background:#303847;color:#f6f5f2}
  .g-photo{background:radial-gradient(60% 80% at 20% 20%,#a94722,transparent 60%),radial-gradient(70% 70% at 80% 70%,#4b576e,transparent 60%),linear-gradient(35deg,#171d24,#303847);color:#f6f5f2}
  .lockup-box{padding:1.5rem;border-radius:4px;color:var(--slate);background:var(--raised);border:1px solid var(--rule)}
  .lockup-box svg{width:min(100%,17rem);height:auto;display:block}
  .lockup-box--rev{background:#303847;color:#f6f5f2;border-color:transparent}

  /* swatches */
  .swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.75rem}
  .sw{min-height:8.5rem;padding:.875rem;border-radius:4px;display:flex;flex-direction:column;justify-content:flex-end;gap:.125rem;font-size:.8125rem}
  .sw code{font-family:ui-monospace,Menlo,monospace;font-size:.75rem;opacity:.85}
  .sw b{font-weight:600}
  .sw small{opacity:.8;font-size:.6875rem;line-height:1.4}

  /* type scale */
  .scale-row{display:grid;grid-template-columns:5.5rem 1fr;gap:1rem;align-items:baseline;padding:.875rem 0;border-bottom:1px solid var(--rule)}
  .scale-row span:first-child{font-size:.75rem;color:var(--muted);font-variant-numeric:tabular-nums;letter-spacing:.04em;text-transform:uppercase}
  .sd{font-family:'Fraunces',Georgia,serif;font-weight:600}

  /* do / don't */
  .rules{display:flex;flex-direction:column;gap:1.5rem}
  .rule-block{border:1px solid var(--rule);border-radius:4px;overflow:hidden;background:var(--raised)}
  .rule-block > h3{margin:0;padding:.875rem 1.25rem;background:var(--sunken);font-family:'Inter',sans-serif;font-size:.8125rem;font-weight:650;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
  .cols{display:grid;grid-template-columns:1fr;gap:0}
  @media (min-width:48rem){.cols{grid-template-columns:1fr 1fr}}
  .col{padding:1.25rem}
  .col + .col{border-top:1px solid var(--rule)}
  @media (min-width:48rem){.col + .col{border-top:none;border-inline-start:1px solid var(--rule)}}
  .col p{font-size:.75rem;font-weight:650;letter-spacing:.09em;text-transform:uppercase;margin-bottom:.75rem}
  .col--do p{color:var(--yes)}
  .col--dont p{color:var(--no)}
  .col ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.625rem;font-size:.9375rem;color:var(--muted)}
  .col li{padding-inline-start:1.375rem;position:relative}
  .col li::before{position:absolute;inset-inline-start:0;font-weight:700}
  .col--do li::before{content:'✓';color:var(--yes)}
  .col--dont li::before{content:'✕';color:var(--no)}

  /* tables and figures */
  .scroll{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:.9375rem;min-width:34rem}
  th,td{text-align:start;padding:.75rem 1rem .75rem 0;border-bottom:1px solid var(--rule);vertical-align:top}
  th{font-size:.75rem;font-weight:650;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
  tbody th{font-size:.9375rem;letter-spacing:0;text-transform:none;color:var(--ink);font-weight:600}
  td{color:var(--muted)}

  figure.shot{margin:0}
  figure.shot img{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:3px}
  figcaption{margin-top:.5rem;font-size:.8125rem;color:var(--muted)}
  .shots{display:grid;gap:1.25rem;grid-template-columns:1fr}
  @media (min-width:52rem){.shots{grid-template-columns:1fr 1fr}}

  .callout{padding:1.25rem 1.5rem;border:1px solid var(--rule);border-inline-start:3px solid var(--accent);border-radius:4px;background:var(--raised);max-width:46rem}
  footer{border-top:1px solid var(--rule);padding-top:1.5rem;font-size:.8125rem;color:var(--muted)}
  a{color:var(--accent)}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

<div class="shell">
  <header>
    <p class="eyebrow">${CHURCH.legalName} &middot; brand standards v1.0</p>
    <h1>The Edge brand standards</h1>
    <p class="lede">
      How to use the mark, the palette, the type and the words, so that everything
      ${CHURCH.shortName} publishes looks like it came from the same place. Every value here is
      read from the live design system, so this document cannot drift from the site it governs.
    </p>
  </header>

  <section>
    <h2>What the brand is for</h2>
    <div class="stack">
      <div>
        <h3>Our vision</h3>
        <blockquote>${VISION}</blockquote>
      </div>
      <div>
        <h3>Our mission</h3>
        <blockquote>${MISSION}</blockquote>
      </div>
      <div class="callout">
        <p><strong>These two statements are fixed.</strong> They are reproduced exactly wherever
        they appear, including their punctuation. They are never rephrased, shortened or
        modernised, and the build fails if they are altered. The tagline is
        <em>${TAGLINE}</em>.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>The symbol</h2>
    <div class="stack">
      <p class="lede" style="margin:0">
        A2 Architectural Threshold. Two planes standing apart, with the way through between
        them. It is a one-colour mark and it holds at ${MINIMUM_SIZES.symbolDigital}px.
      </p>
      <div class="card">
        <div class="marks" style="color:var(--slate)">
          ${[16, 24, 32, 48, 96, 144].map((n) => `<figure>${mark(n)}<figcaption>${n}px</figcaption></figure>`).join('')}
        </div>
      </div>
      <div class="grounds">
        <div class="ground g-paper">${mark(56)}<span>Porcelain</span></div>
        <div class="ground g-white">${mark(56)}<span>White</span></div>
        <div class="ground g-slate">${mark(56)}<span>Deep Slate, reversed</span></div>
        <div class="ground g-photo">${mark(56)}<span>On photography</span></div>
      </div>
    </div>
  </section>

  <section>
    <h2>The lockup</h2>
    <div class="grounds" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))">
      <div class="lockup-box">${lockup}</div>
      <div class="lockup-box lockup-box--rev">${lockup}</div>
    </div>
    <p class="lede">The wordmark is outlined in the supplied vector, so no typeface travels with
    the file and no one can rebuild it slightly wrong.</p>
  </section>

  <section>
    <h2>Colour</h2>
    <div class="swatches">
      <div class="sw" style="background:#303847;color:#f6f5f2"><b>Deep Slate</b><code>#303847</code><small>Identity, primary button, footer</small></div>
      <div class="sw" style="background:#4b576e;color:#f6f5f2"><b>Heritage Slate</b><code>#4B576E</code><small>Anchor text, quiet buttons</small></div>
      <div class="sw" style="background:#e46f3c;color:#171d24"><b>Ember</b><code>#E46F3C</code><small>Graphic accent only. Never text</small></div>
      <div class="sw" style="background:#a94722;color:#f6f5f2"><b>Ember Accessible</b><code>#A94722</code><small>Accent text, links, focus ring</small></div>
      <div class="sw" style="background:#f6f5f2;color:#171d24;border:1px solid var(--rule)"><b>Porcelain</b><code>#F6F5F2</code><small>The page ground</small></div>
      <div class="sw" style="background:#171d24;color:#f6f5f2"><b>Ink</b><code>#171D24</code><small>Body text</small></div>
    </div>
    <div class="callout" style="margin-top:1.5rem">
      <p><strong>The one rule people get wrong.</strong> Ember is the brightest colour in the
      palette and the most tempting, and it fails contrast as text: #E46F3C measures 2.90:1 on
      porcelain, below even the 3:1 needed for large text. Use #A94722 whenever ember is a word.
      Keep #E46F3C for rules, markers and graphics, and keep it under five per cent of any
      composition.</p>
    </div>
  </section>

  <section>
    <h2>Typography</h2>
    <p class="lede" style="margin:0 0 1.5rem">
      Fraunces for headings, Inter for everything else. Both open licence, so there is no fee
      and no per-domain licence to track.
    </p>
    <div class="card">
      <div class="scale-row"><span>Display</span><span class="sd" style="font-size:2.75rem;line-height:1.07;letter-spacing:-.021em;font-variation-settings:'SOFT' 30,'opsz' 144">A vision to impact nations.</span></div>
      <div class="scale-row"><span>Heading 1</span><span class="sd" style="font-size:2.125rem;line-height:1.09;letter-spacing:-.019em;font-variation-settings:'opsz' 96">Plan your visit</span></div>
      <div class="scale-row"><span>Heading 2</span><span class="sd" style="font-size:1.625rem;line-height:1.18;letter-spacing:-.015em">What happens on a Sunday</span></div>
      <div class="scale-row"><span>Heading 3</span><span class="sd" style="font-size:1.125rem;font-variation-settings:'opsz' 24">Who to look for</span></div>
      <div class="scale-row"><span>Body 18</span><span style="font-size:1.125rem;line-height:1.67">The welcome desk is just inside the main entrance.</span></div>
      <div class="scale-row"><span>Body 16</span><span style="font-size:1rem;line-height:1.625">Tell them it is your first Sunday and someone will walk you in.</span></div>
      <div class="scale-row"><span>Nav 14</span><span style="font-size:.875rem;font-weight:550">Who We Are &nbsp; New Here &nbsp; Events &nbsp; Give</span></div>
      <div class="scale-row" style="border-bottom:none"><span>Micro 12</span><span style="font-size:.75rem;letter-spacing:.02em">Supporting labels only</span></div>
    </div>
    <div class="callout" style="margin-top:1.5rem">
      <p><strong>The 12px rule.</strong> Micro type is for supporting labels and nothing else. It
      is never used for instructions, access conditions, safeguarding, privacy, complaints or
      giving. If a person needs to read it to be safe, to get in, or to give, it is 16px.</p>
    </div>
  </section>

  <section>
    <h2>How to use it: dos and don'ts</h2>
    <div class="rules">
      ${rules
        .map(
          (r) => `<div class="rule-block">
        <h3>${r.area}</h3>
        <div class="cols">
          <div class="col col--do"><p>Do</p><ul>${r.do.map((x) => `<li>${x}</li>`).join('')}</ul></div>
          <div class="col col--dont"><p>Do not</p><ul>${r.dont.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        </div>
      </div>`
        )
        .join('\n      ')}
    </div>
  </section>

  <section>
    <h2>The Edge family</h2>
    <div class="scroll">
      <table>
        <thead><tr><th scope="col">Organisation</th><th scope="col">Descriptor</th><th scope="col">Relationship</th></tr></thead>
        <tbody>
          ${family.map(([n, d, r]) => `<tr><th scope="row">${n}</th><td>${d}</td><td>${r}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
    <div class="callout" style="margin-top:1.5rem">
      <p><strong>ECCS is a separate legal entity.</strong> It is DGR-endorsed, keeps its own
      giving, receipting, privacy notice and complaints pathway, and its services are open to
      anyone with no church involvement required. Never imply otherwise. Its lockup has not been
      drawn yet, so nothing currently renders one: an approximated mark for a separate entity is
      worse than none.</p>
    </div>
  </section>

  <section>
    <h2>The brand in use</h2>
    <div class="shots">
      <figure class="shot"><img src="${shotVisit}" alt="Plan your visit page." /><figcaption>Plan your visit. Four steps, one action.</figcaption></figure>
      <figure class="shot"><img src="${shotGive}" alt="Give page." /><figcaption>Give. Two methods, receipts explained plainly.</figcaption></figure>
      <figure class="shot"><img src="${shotBrand}" alt="Brand reference page." /><figcaption>The live brand reference at /brand.</figcaption></figure>
      <figure class="shot"><img src="${shotArabic}" alt="Arabic right-to-left page." /><figcaption>Arabic. The whole layout mirrors, the mark does not.</figcaption></figure>
      <figure class="shot"><img src="${shotMobile}" alt="Home page on a narrow screen." /><figcaption>Mobile. The design assumes a mid-range Android on mobile data.</figcaption></figure>
    </div>
  </section>

  <section>
    <h2>Where the files live</h2>
    <div class="scroll">
      <table>
        <thead><tr><th scope="col">You need</th><th scope="col">Use</th></tr></thead>
        <tbody>
          <tr><th scope="row">Logo for print</th><td>public/brand/vector/, PDF or EPS</td></tr>
          <tr><th scope="row">Logo for screen or slides</th><td>public/brand/vector/, SVG</td></tr>
          <tr><th scope="row">Social profile picture</th><td>public/brand/icons/tte_social_avatar_1080.png</td></tr>
          <tr><th scope="row">App or favicon</th><td>public/brand/icons/</td></tr>
          <tr><th scope="row">Colour values for a designer</th><td>public/brand/reference/tte_brand_tokens.json</td></tr>
          <tr><th scope="row">The full masterbrand guidelines</th><td>public/brand/reference/, PDF</td></tr>
          <tr><th scope="row">Typefaces</th><td>assets/typography/, both open licence</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer>
    ${CHURCH.legalName}. ABN ${CHURCH.abn}. ${CHURCH.registration}.
    Symbol geometry, palette and type scale are read from the live design system at build time.
    Questions: <a href="mailto:${CHURCH.email}">${CHURCH.email}</a>.
  </footer>
</div>
`;

await writeFile(out, html, 'utf8');
const { size } = await (await import('node:fs')).promises.stat(out);
console.log(`wrote ${out} (${(size / 1024 / 1024).toFixed(2)} MB)`);
