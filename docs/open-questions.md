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

**Blocks:** the form endpoints.

**Built in the meantime:** both forms exist, ask the minimum, and post to a
Cloudflare Worker path. The Worker is not written, because where it delivers
depends on this answer.

**The recommendation:** prayer requests on the site, delivered to a pastoral
inbox and never stored. Newcomer capture into Connect, because Connect is the
system of record and a newcomer who is captured twice is a newcomer who gets
contacted twice.

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

**Blocks:** the definition of done, which requires every Wix, portal and Elvanto
route to redirect with no orphan pages and no broken links.

The redirect map covers the route families and Wix's own conventions, which is
86 rules. It is not the same as the actual list. The extraction procedure is in
`docs/sitemap-and-redirects.md` and takes about ten minutes with access to the
current site.

### 9. Bank account details for the Give page

The Give page shows a holding message instead of details while `GIVING.bank` is
still `TBC`. The copy linter warns on every run until they are real. Card giving
through Connect works regardless.

### 10. The ECCS domain

`https://www.edgecommunitycare.org.au` is used in `FAMILY_ORGS`. It has not been
confirmed and needs checking before launch, because it is linked from the footer
of every page.
