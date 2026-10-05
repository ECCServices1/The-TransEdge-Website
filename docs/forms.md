# The website's forms

Three forms, each delivered by email and kept nowhere else.

| Form | Page | Delivers to |
|---|---|---|
| Contact | `/get-in-touch` | `frontdesk@thetransedge.com` |
| Life-Link finder | `/life-at-tte` | `frontdesk@thetransedge.com` |
| Prayer request | `/get-in-touch/prayer` | `admin@thetransedge.com` |

Destinations are the client's decision of 5 October 2026: everything to the front
desk unless specified, and prayer requests to admin@.

## How it works

A visitor fills in an ordinary HTML form. Their browser checks the required
fields and the lengths, then posts it to the site's own Worker
(`worker/forms.js`), at `/api/contact` or, for prayer, `/api/prayer`.

The Worker:

1. refuses anything not posted from this site, anything oversized, and anything
   in the wrong format
2. quietly discards anything that filled in the hidden honeypot field
3. checks every field against the limits in `src/data/forms.mjs`
4. asks Cloudflare Turnstile whether the spam-check token is genuine, unused, and
   was earned on this site
5. emails the submission, as plain text, through Cloudflare's own email
   service, from `website@thetransedge.com`, with replies going straight to the
   visitor where they left an email address
6. sends the visitor to a thank-you page, or to a "did not go through" page if
   any step failed

Nothing is stored: no database, and no log line containing anything a visitor
wrote. The Worker logs only which form failed and why ("spam check", "missing
field"). The email in the inbox is the only copy.

**Prayer requests are kept apart by construction.** They have their own address,
and a prayer form posted to the general address is refused rather than
delivered. Their subject line is always "Prayer request from the website", with
nothing personal in it, because subjects show on lock screens.

**The Worker can only email two addresses.** Its email permission in
`wrangler.jsonc` is locked to `frontdesk@` and `admin@`, so not even a bug in
the code could make it email anyone else. `npm run check:forms` fails the build
if that lock and `src/data/forms.mjs` ever disagree.

**Why Cloudflare sends the email.** The forms were designed so that personal
information never passes through a third-party form service. Cloudflare already
carries every visit to this site and Google already holds the church's email,
so this adds no new company to the path. Sending to addresses verified in the
church's own Cloudflare account is free on every plan.

## Switching it on

Three things, all in the Cloudflare dashboard, account `michaels-aibangbee`.
Until all three are done, every form sends visitors to the "did not go through"
page, which gives the phone number. Nothing is lost silently.

### 1. Turnstile, the spam check

1. **Turnstile**, **Add widget**. Name it "TTE website forms".
2. Hostnames: `thetransedge.com`, and `michaels-aibangbee.workers.dev` so that
   preview links can be tested too.
3. Widget mode: **Managed**. Create.
4. Cloudflare shows a **site key** and a **secret key**.
   - The **site key** is public by design. It goes in
     `src/data/forms.mjs` as `TURNSTILE_SITE_KEY`, through a pull request.
   - The **secret key** never goes in the repository. In **Workers & Pages**,
     `the-transedge-website`, **Settings**, **Variables and Secrets**, **Add**:
     type **Secret**, name `TURNSTILE_SECRET_KEY`, value the secret key.

### 2. Let Cloudflare send email for the domain

1. **Email Service** (under **Compute** or **Email**, depending on the
   dashboard's current layout), **Email Sending**, **Onboard domain**:
   `thetransedge.com`.
2. Cloudflare adds its sending records under `cf-bounce.thetransedge.com`. It
   does not touch the domain's own mail records, which belong to Google.

**If anything asks to change or replace the MX records of `thetransedge.com`
itself, stop.** That is Cloudflare's inbound Email Routing, which would take the
church's mail away from Google Workspace. Sending does not need it.

### 3. Verify the two inboxes

1. In Email Service, under **destination addresses**, add
   `frontdesk@thetransedge.com` and `admin@thetransedge.com`.
2. Cloudflare emails each a verification link. Open each inbox and click it.

Cloudflare will send to verified addresses only. Free plan accounts can send to
nothing else, which suits this exactly.

### Then test

Send each form once from the live site and check it arrives where the table
above says, and that pressing Reply addresses the visitor rather than the
website. If a form lands on the "did not go through" page instead, the
Worker's log in Cloudflare (**Workers & Pages**, `the-transedge-website`,
**Observability**) names the step that failed.

## Changing where a form delivers

1. Change the address in `src/data/forms.mjs`.
2. Change the same address in `allowed_destination_addresses` in
   `wrangler.jsonc`. The build refuses one without the other.
3. Verify the new address in Cloudflare, as in step 3 above, before merging.
   An unverified address receives nothing.

## Lengths

| Field | Most characters |
|---|---|
| Name | 100 |
| Email, or email or phone | 254 |
| Suburb | 80 |
| Message, or prayer request | 5,000 |

Set in `src/data/forms.mjs`, enforced by both the browser and the Worker.
