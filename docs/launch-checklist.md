# Launch checklist and 30-day measurement plan

Section 23 is the definition of done. This is that, as a list someone can work
through, with the current state marked honestly.

Legend: **done** / **partial** / **blocked** / **not started**

## Gates that have not been passed

These come first because everything downstream depends on them.

| Gate | State | On whom |
|---|---|---|
| Brand direction chosen from the three at `/brand` | **blocked** | Client |
| Connect read API available, or the decision to launch on static content | **blocked** | Connect team |
| Native-speaker reviewer named per language | **blocked** | Client |
| Nominated approver for weekly content | **blocked** | Client |
| Bank account details for the Give page | **blocked** | Client |
| Photo consent register location | **blocked** | Client |

No high-fidelity screen design proceeds before the first of these. That is the
brief's own constraint, section 6.

## Definition of done, item by item

### Every budget in section 21 met and evidenced

**partial.** Measured on the built site, simulated 4G with a 4x CPU slowdown and
a 360px mobile viewport:

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 1.00 | 1.00 | 1.00 | 1.00 | 1822ms | 0.000 | 0ms |
| Plan your visit | 1.00 | 1.00 | 1.00 | 1.00 | 1816ms | 0.000 | 0ms |
| Give | 1.00 | 1.00 | 1.00 | 1.00 | 1813ms | 0.000 | 0ms |
| Get in touch | 1.00 | 1.00 | 1.00 | 1.00 | 1809ms | 0.000 | 0ms |
| Events | 1.00 | 1.00 | 1.00 | 1.00 | 1805ms | 0.000 | 0ms |
| EdgedIn | 1.00 | 1.00 | 1.00 | 1.00 | 1806ms | 0.000 | 0ms |
| Arabic, plan your visit | 1.00 | 1.00 | 1.00 | 0.63 | 1809ms | 0.000 | 0ms |

All four categories at 100, LCP under the 2.0s budget, CLS at zero, no blocking
time. The Arabic page's SEO score is low because it is deliberately `noindex`
until a native speaker reviews it, so SEO is asserted as a warning for that
page only; its accessibility and performance are asserted identically to
English and score identically.

Still outstanding: these are lab numbers against the built output. They need
re-running against the deployed site on a real connection, and field data needs
thirty days to arrive.

### Service time, place and what to expect within two taps from any page

**done.** Header on every page reaches New Here in one tap and Plan Your Visit in
two. The footer carries times and address on every page directly. Both hold in
the mobile drawer with no JavaScript.

### A gift initiated on mobile in under 45 seconds

**partial.** The Give page is one tap from the header and the primary action
hands straight to Connect. It cannot be timed end to end until the Connect
giving flow exists and the bank details are real.

### The home canvas reads as one composition at 320, 768, 1024 and 1440, light and dark, with motion reduced and JavaScript disabled

**partial.** Built to hold at all four, in both schemes, and the motion and no-JS
paths are implemented as the brief specifies. It has not been reviewed in a
browser by a person at each width. That review needs eyes, not a test.

### The mark is legible at 16px and in one colour

**done** for all three directions. Rendered and checked at 16, 24, 32, 48, 96 and
160px, one colour, on paper, reversed, on accent and on a busy ground. Visible at
`/brand`.

### The Arabic build passes the same accessibility and layout checks as English

**partial.** Arabic renders `dir="rtl"`, loads its own typeface, mirrors the seam
and the directional icons, and is in the Lighthouse assertion set. Logical
properties are used throughout, with no physical direction property anywhere in
the codebase. It has not been read by an Arabic speaker.

### Style guide live and matching the built components

**not started.** The tokens, the contrast evidence and the component set exist.
The live style guide page does not. This is the largest single gap in the build.

### A non-technical person completes three real content tasks unaided

**partial.** The three tasks are built as three CMS collections: publish a weekly
notice, add an event, correct a service time. The CMS needs its OAuth Worker
deployed, and then the test needs a real person who has not seen it before.

### Every Wix, portal and Elvanto route redirects, no orphan pages, no broken links

**blocked.** 86 rules cover the route families and Wix's conventions. The live
Wix route list has not been enumerated, because egress to the current site was
blocked from the build environment. Procedure and verification script in
`docs/sitemap-and-redirects.md`, about ten minutes with access.

## Before the DNS switch

- [ ] Bank details real, and the linter's placeholder warning gone
- [ ] Turnstile keys set, and the contact and prayer Workers deployed
- [ ] `CONNECT_API_URL` and token set, or the static-content decision recorded
- [ ] CMS OAuth Worker deployed and an editor has logged in successfully
- [ ] Wix route list extracted and every route mapped
- [ ] Redirect verification loop returns clean
- [ ] Privacy policy and terms written and linked
- [ ] Child safe policy and complaints pathway linked, consistent with NSW Child
      Safe Standards and existing Safer Churches obligations
- [ ] Uptime monitoring pointed at the site, alerting to a nominated address
- [ ] Search Console and Bing Webmaster Tools verified, sitemap submitted
- [ ] Analytics live, with the section 21 events firing
- [ ] A real screen reader pass, with the tool named in the report
- [ ] Someone who has never seen the site finds the service time in under a minute

## On the day

1. Deploy to production, DNS still on Wix.
2. Run the redirect verification loop against the Pages URL.
3. Switch `www` and the apex to Cloudflare.
4. Confirm TLS, HSTS and the security headers are live.
5. Re-run Lighthouse against the live domain.
6. Watch the uptime monitor and the Cloudflare analytics for the first hour.
7. Do not remove the Wix site for thirty days.

## 30-day measurement plan

Privacy-respecting analytics, no third-party trackers before consent.

### Events

| Event | Question it answers |
|---|---|
| `visit_planned` | Is the primary action working? |
| `event_registered` | Does the Connect handoff survive? |
| `gift_started` | Does the Give page convert, and which method? |
| `invite_shared` | Is 1B2GaS being used at all? |
| `prayer_submitted` | Is the private route being found? |
| `media_played_50` | Does anyone finish half an episode? |
| `connect_opened` | Are members finding Connect without Elvanto? |
| `locale_switched` | Which languages are actually wanted? |

### Week 1: is anything broken

- 404 rate. Anything above 1 per cent of sessions is a redirect that was missed.
- Search Console coverage errors.
- Core Web Vitals from real users, not the lab.
- Form submission success rate. A silent failure looks exactly like nobody
  writing in.

### Weeks 2 to 4: is it working

- **Visit planned per new visitor.** The headline number. This site has one job.
- **Time to service time.** How long before a first-time visitor sees when we
  gather. The target is under sixty seconds from any entry point.
- **Give completion**, split between bank transfer and Connect card.
- **Connect opened**, against the Elvanto baseline if there is one.
- **Locale switches.** Which of the six are used tells you where the second round
  of translation should go, rather than guessing.
- **Mobile share, and mobile performance separately.** The design assumes a
  mid-range Android on mobile data. Check that assumption held.

### At day 30

One page. What worked, what did not, and the single change most likely to
improve the headline number. Then do that one thing rather than twelve.
