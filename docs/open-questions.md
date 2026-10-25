# Open questions

Part E of the brief, plus what has come up in build. Each one says what has been
built in the meantime, so nothing is waiting on an answer that did not have to
wait.

## 1. Does Connect expose a read API for events, sermons and EdgedIn, and what is the authentication model?

**Blocks:** the hard dependency in Part C. Connect must expose its read API
before week 2 begins, or events and EdgedIn ship as static content.

**Built in the meantime:** the whole content layer, against the contract in
`docs/connect-api-contract.md`. It reads from `CONNECT_API_URL` when that is
set and from the committed snapshots when it is not, with no code change between
the two. Editors add events through the CMS either way and do not need to know
which mode is live.

**What is needed:** the base URL, the authentication model, and confirmation of
the field names in the contract. If the field names differ, the mapping changes
in one function.

## 2. Does ECCS DGR giving run on its own Stripe account, separate from the church account?

**Blocks:** wiring anything on the ECCS giving flow.

**Built in the meantime:** the Give page keeps the two flows visibly apart and
states plainly that church giving is not deductible and that ECCS is separately
endorsed with its own receipting. It links out to ECCS rather than handling the
ECCS flow, so nothing is wired to the wrong account.

**Why it matters more than it looks:** a deductible receipt issued against the
wrong entity is an ACNC and ATO problem, not a website problem.

## 3. Who is the native-speaker reviewer for each of the six languages?

**Decided: leave the locales in place and review afterwards.** No locale has been
dropped.

**Blocks:** publishing any non-English page. Nothing else.

**Built in the meantime:** all seven locales route, switch, load the right
typeface and handle direction. The six non-English ones render English and are
marked `noindex`, so nobody arrives from a search result expecting their own
language and finds English. `TRANSLATION_STATUS` in `src/i18n/ui.mjs` has a
required reviewer field, so recording the reviewer is what publishes the locale.

**What is needed:** a name per language. Mandarin, Arabic, Hindi, Swahili,
Japanese, Korean.

## 4. Where are photo consent records held, particularly for children?

**Blocks:** publishing any photograph.

**Built in the meantime:** `PhotoSlot` reserves each image's space at its final
aspect ratio and states the shot, so the composition is complete and dropping
the real photograph in later costs no layout shift. The consent register
template is in `docs/photography-shot-list.md`.

**What is needed:** a decision on where the register lives. It must not live in
this repository, because it holds personal information about children and this
repository is public.

## 5. Do newcomer capture and prayer requests live on the site or inside Connect?

**Answered, 5 October 2026.** On the site, delivered by email: everything to
`frontdesk@thetransedge.com` unless specified, and prayer requests to
`admin@thetransedge.com`. Nothing is stored on the site. Built in
`worker/forms.js`, sent through Cloudflare's own email service, with setup
steps in `docs/forms.md`. Newcomer capture into Connect can follow once
Connect has an API to write to.

## 6. Who is the nominated approver for the weekly content pull requests?

**Blocks:** turning the content pipeline on.

**Built in the meantime:** the pipeline, the pull request template with its
review checklist, and the `approvedBy` field on every notice, which is required
by the schema, so an unapproved notice cannot build.

**What is needed:** a name, and a second name for when the first is away. A
pipeline with one approver stops the first week they are on holiday.

## 7. Is there a budget line for typeface licences, or should the system be built on open-licence families?

**Answered by default, reversibly.** Built on open licence, because the cost
target is under AUD 25 per month and section 15 requires coverage of Latin,
Arabic, Devanagari, Simplified Chinese, Japanese and Korean.

- **Display:** Fraunces, SIL Open Font Licence 1.1
- **Text:** Inter, SIL Open Font Licence 1.1
- **Non-Latin:** the Noto families, SIL Open Font Licence 1.1

No licence to track, no per-domain fee, and full multi-script coverage. If a
licensed display face is wanted later, it replaces Fraunces in one token and the
Noto fallback stack is unaffected.

---

## Raised during build, not in Part E

### 8. The live Wix route list has not been enumerated

Resolved by decision. The client ruled on 3 September 2026 that this is a clean
build and the old Wix address list is not needed. The redirect map keeps its
route-family rules (member area, Elvanto, Wix conventions) as a courtesy net for
printed bulletins and QR codes; nothing further is extracted, and the launch
checklist no longer waits on it.

### 9. The bank account name on the Give page

Resolved. The client confirmed on 3 September 2026 that both accounts are held
under the name "The Transformation Edge" (no "Ltd"), and that online giving
runs through Stripe at https://connect.thetransedge.com/giving. Both are set in
`GIVING` and `accountNameConfirmed` is true.

### 10. The ECCS domain

Resolved. The client confirmed `https://www.edgecommunitycareservices.org.au`
on 3 September 2026 and it is set in `FAMILY_ORGS`, from which the footer, the
Outreach page and the giving hand-off all read.

### 11. Content the pastoral team has to write

Two pages are built and marked draft for content. Each carries a visible
notice naming what is missing and is `noindex` until it is signed off. Removing
the `DraftNotice` component from a page is the act of approving it, so approval
is a line in a diff with a name against it.

| Page | What is needed |
|---|---|
| `/new-here/what-to-expect` | Confirmation of the order of a Sunday and how long the message runs |
| `/life-at-tte` | When Life-Link groups meet. Life-Link and Champions (September 2026) and 1B2GaS (5 October 2026) are supplied and on the page |

Not public, by decision:

- `/who-we-are/safeguarding`. On 9 October 2026 the client decided the page
  should not be public: the church has its own internal safeguarding processes,
  and the board decides what, if anything, goes on the website. The page is not
  built, its addresses lead to Get in touch, and nothing links to it. When the
  board decides, it still needs the name and direct contact of the person who
  receives a concern, a link to the policy document, and who a complaint
  escalates to if it concerns a pastor. How to bring it back is at the top of
  `src/pages/who-we-are/_safeguarding.astro`.

Signed off, with the date the notice came off:

- `/who-we-are/pastoral-team`, 16 August 2026, when the biographies arrived.
- `/who-we-are/what-we-believe` and `/who-we-are/core-course`, 3 September 2026.
- `/new-here/edgekids`, 5 October 2026, by Dr Michaels Aibangbee. One thing it
  leaves to write down: the page invites children to bring a friend, so who
  signs a visiting friend in, and with what permission from that child's parent
  or carer.

Two more need a non-pastoral decision:

- `/privacy-policy` needs a legal review, retention periods for each kind of
  record, and a named privacy contact.
- `/terms-of-use` needs a legal review. It is deliberately short.

### 12. Only English has the whole site

The navigation on a translated page now falls back to the English page for any
route that language does not have, rather than linking to a page that was never
built. The locale switcher does the same and says "Visitor pages only" against
the languages it applies to.

That is honest but it is not finished. The decision to make is whether the
visitor-essential set stays at five pages at launch, or whether Find Us, the FAQ
and Give are added to it, since those are the three a first-time visitor reaches
for next.

### 13. The shop, taking payment

The shop opened for orders on 11 October 2026, by the client's decision. The
RAIN 2026 clothing arrived on 24 October 2026 and is on sale in the cuts,
colours and sizes that came, ready to collect at the Sunday gathering within a
week of ordering, from stock only; the first designs stay on the range marked
out of stock. Speak Life is listed as coming soon and Do Not Bow is sold through
drmichaelsa.com/shop at $22.99. Three things remain, and none of them are code.
They are set out in full in `docs/shop.md`; in short:

- **Photographs of the real merchandise**, and Speak Life's cover. The RAIN
  clothing shows the client's design mockups and the coffee t-shirt has no
  picture yet. Do Not Bow has its covers (25 October 2026); Speak Life still
  shows "Cover to come". Prices were
  set on 24 October 2026: adult t-shirts $28, kids' t-shirts $25 and the hoodie
  $65, the payment fee included and no GST. Speak Life has no price yet, and a
  product cannot go on sale until somebody ticks that its price has been
  checked, which the build enforces.
- **The flat postage rate**, or a decision to stay collection-only. Posting is off
  until the rate is set and confirmed, and a request to post falls back to
  collection rather than charging a rate nobody checked.
- **A Square access token and location ID** from TTE's own Square account,
  set on the Worker by the client. Payment moved from Stripe to Square on 25
  October 2026, by the client's decision, because it costs less. The token goes
  nowhere near this repository. Until it is set the pay button replies with a
  message asking people to call, which is the right way to fail. No GST is
  charged in the shop (client, 24 October 2026), so there is no tax rate to set
  up.

`/shop/terms` stands as a placeholder: the client decided on 5 October 2026
that its legal review comes later and does not hold up opening.

**Payment account, decided:** merchandise runs through TTE's own Square account
from 25 October 2026, and giving stays on Stripe inside Connect. That also keeps
trading income and giving in separate payout streams, which whoever keeps the
books will find easier.
