# Editing the site, and the weekly content pipeline

Section 16. Weekly content is not currently maintained by hand, so the update
path is built in rather than assumed.

## Two ways in, one gate

| Who | How | Gate |
|---|---|---|
| A person | `/admin` | Editorial workflow, then a human merge |
| Claude | A branch and a pull request | A human merge |

Both produce a commit. Neither can publish without a merge. That is the whole
design: there is no path to the live site that skips a person.

## The editor at /admin

Sveltia CMS, authenticating against GitHub. Editors see a form, never the
repository.

Three collections, chosen to be exactly the three tasks in the definition of
done:

1. **Weekly notice.** The collection the pipeline drafts into.
2. **Events.** While Connect has no read API this is the site's event source.
   Once Connect is wired, the build reads from Connect and this becomes the
   fallback. Editors do not need to know which mode is live.
3. **Church details.** Service times. Changing a time here changes it
   everywhere at once, including the calendar files and the search listings.

### Standing it up

Sveltia needs a GitHub OAuth handler. It is not on Netlify, so Netlify's shared
service is not used.

1. Register a GitHub OAuth app. Callback
   `https://auth.thetransedge.com/callback`.
2. Deploy [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) as a
   Cloudflare Worker, with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as
   encrypted variables. The Worker holds the secret; `config.yml` is public and
   holds nothing sensitive.
3. Route `auth.thetransedge.com` to it.
4. Add editors as repository collaborators with write access.

## The Claude pipeline

**Flow:** Claude drafts on a branch and opens a pull request. A nominated human
reviews and merges. Cloudflare Pages deploys. Nothing publishes without a merge.

### In scope for drafting

- the weekly service notice
- event summaries drawn from Connect
- EdgedIn episode notes
- devotional posts
- social copy for the 1B2GaS invite

### Out of scope, absolutely

- anything about a named person
- anything doctrinal
- anything touching the vision or the mission
- anything involving a child
- all translated content

These are not preferences. A draft that touches one of them is closed, not
edited.

### Access

A scoped machine account with commit rights to `src/content/` only. Not the
whole repository. It cannot change the build, the tokens, the redirect map or
`src/data/church.mjs`, and it cannot merge its own pull request.

Enforce with a branch protection rule requiring one approving review, and a
`CODEOWNERS` entry putting everything outside `src/content/` behind a human.

### The operating procedure

**Monday.** The draft opens as a pull request with the template checklist.

**By Wednesday.** The nominated approver reviews. What they are checking is on
the checklist, and the four that matter most:

- Australian English, no em-dashes
- no clinical claim for pastoral care
- nothing about a named person or a child that has not been agreed
- the vision, mission and tagline untouched

**On merge.** Cloudflare Pages deploys. The notice is live in about ninety
seconds.

**If nobody reviews.** The draft sits. It does not publish. A stale pull request
is a much smaller problem than an unreviewed one going live.

`approvedBy` is a required field on every notice, so the schema rejects a notice
with no named approver. The record of approval lives in the content itself, not
in a chat log.

### Rolling back

**A content mistake:** revert the pull request on GitHub. Pages redeploys the
previous build automatically. About two minutes.

**A bad deploy:** roll back to the previous deployment in the Cloudflare Pages
dashboard. Instant, and it does not need a git operation.

**Something that must come down now:** roll back the deployment first, then work
out what happened. The dashboard rollback is the fastest control there is, and
using it early is not an overreaction.

## What the machine checks before a human sees it

CI runs on every pull request, including the pipeline's:

- `check:copy`, the section 22 do-not-ship rules and the positioning rule
- `tokens:contrast`, every colour pairing in both schemes
- `astro check`, types
- the build
- the redirect map is in step with its source
- Lighthouse budgets, including the Arabic build

A draft that trips any of these does not reach the reviewer clean, which keeps
review attention on judgement rather than on proofreading.
