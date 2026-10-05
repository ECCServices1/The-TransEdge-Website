# Cloudflare: deploying the site, and moving the domain from Wix

## How the site deploys now

The site is a Cloudflare **Worker** called `the-transedge-website`, in the
Cloudflare account that owns `michaels-aibangbee.workers.dev`. Every merge to
`main` rebuilds and deploys it in about two minutes, and every pull request gets
its own preview URL.

`wrangler.jsonc` carries everything the deploy needs: where the built site is,
the build command, the asset settings, and the shop's checkout Worker. Nothing
about the build depends on a dashboard field.

| The build log says | It means |
|---|---|
| `Could not detect a directory containing static files` | The build did not run. Check the build log above it |
| `Node version` or `engine` | Add a build variable `NODE_VERSION` set to `22`, retry |
| `Authentication error` | The build token needs redoing. Disconnect and reconnect the repository |

A failed build changes nothing on the live site and costs nothing. Retrying is
safe.

## Moving thetransedge.com from Wix

### What is on the domain today

Read from Wix's own nameservers on 5 October 2026. The domain carries three
things, and only one of them is the website:

1. **The Wix website**, on `www` and the bare domain.
2. **Email for `frontdesk@thetransedge.com`**, through Google Workspace, plus
   the Google custom addresses for mail, calendar and docs, and email signing
   records for Brevo and for Wix's own email marketing (Ascend).
3. **The TTE Connect Hub** at `connect.thetransedge.com`.

The move is safe exactly when (2) and (3) keep working. They will, provided
every record below exists in Cloudflare **before** the nameservers change.

Also confirmed: DNSSEC is not enabled, so there is no signing to switch off
first; there are no CAA records, so nothing restricts who can issue the
certificate; and there is no wildcard record.

### The records

**Proxy status matters.** Everything in this table is **DNS only** (the grey
cloud). Cloudflare's import marks every `A` and `CNAME` record **Proxied**, so
every one has to be switched off by hand before activating. Proxied, the Google
and Connect Hub addresses lose their certificates, and the email signing
records stop answering altogether: a proxied name only returns Cloudflare's own
address, never the TXT record behind it, so DKIM and DMARC fail silently.

| Type | Name | Content | Priority | Why |
|---|---|---|---|---|
| MX | `@` | `aspmx.l.google.com` | 10 | Email |
| MX | `@` | `alt1.aspmx.l.google.com` | 20 | Email |
| MX | `@` | `alt2.aspmx.l.google.com` | 30 | Email |
| MX | `@` | `aspmx2.googlemail.com` | 40 | Email |
| MX | `@` | `aspmx3.googlemail.com` | 50 | Email |
| TXT | `@` | `brevo-code:c946bc48e6ae4f44745f660d029edc24` | | Brevo verification |
| TXT | `@` | `openai-domain-verification=dv-O8H4PPOUgF9l3QgqBIe8LOjc` | | OpenAI verification |
| CNAME | `_dmarc` | `_dmarc.wixemails.com` | | Email reporting, hosted by Wix |
| CNAME | `brevo1._domainkey` | `b1.thetransedge-com.dkim.brevo.com` | | Brevo email signing |
| CNAME | `brevo2._domainkey` | `b2.thetransedge-com.dkim.brevo.com` | | Brevo email signing |
| CNAME | `s1._domainkey` | `s1._domainkey.thetransedge.com.s013.ascendbywix.com` | | Wix email marketing signing |
| CNAME | `s2._domainkey` | `s2._domainkey.thetransedge.com.s013.ascendbywix.com` | | Wix email marketing signing |
| A | `connect` | `185.158.133.1` | | The Connect Hub |
| CNAME | `mail` | `ghs.google.com` | | Google Workspace |
| CNAME | `calendar` | `ghs.google.com` | | Google Workspace |
| CNAME | `docs` | `ghs.google.com` | | Google Workspace |
| A | `@` | `185.230.63.171`, `185.230.63.107`, `185.230.63.186` | | The Wix site, **until launch** |
| CNAME | `www` | `cdn3.wixdns.net` | | The Wix site, **until launch** |

`m` (a CNAME to `www48.wixdns.net`) is Wix's old mobile site and can be left
behind.

The signing and reporting records are CNAMEs, not TXT records: Brevo and Wix
host the keys themselves and can rotate them without anyone touching this
domain. Copy them as CNAMEs. A copy of the key text as a TXT record would work
on the day and then break, without warning, the first time either provider
rotated its key.

Cloudflare's quick scan on 5 October 2026 found every record above, including
the `brevo1` and `brevo2` records a by-hand inventory had missed.

This list was gathered by asking for every likely name. A record on a name
nobody would guess cannot be found that way, so check it against the full list
on the Wix DNS records page before switching.

### Where the domain is actually registered

`thetransedge.com` is registered at **Hover**, not with Wix, and renewal is
paid until **23 July 2036** (confirmed by the client, 5 October 2026). Hover is
the retail brand of Tucows, which also owns Enom, the wholesale registrar
behind it; that is why Cloudflare's onboarding names Enom. Wix's own domains
page lists the domain as "Managed by third party, Connected by DNS". At some point, probably
when the Wix site was set up (the Wix DNS zone dates from April 2017), the
nameservers were pointed at Wix at the registrar. That is how Wix came to host
the DNS, and it is why Wix's DNS page shows the nameservers as not editable:
they are not Wix's to edit.

So the nameservers are changed **at the registrar**. No transfer is needed to
move the DNS.

**Do not click "Transfer to Wix"** on the Wix domains page. It would move the
registration into Wix, and Wix does not let a domain it has registered use
another provider's nameservers. That would turn a ten-minute change into a
week-long transfer back out.

The steps, kept apart so that if email stops, the cause is obvious:

0. **Find the account that holds the registration.**
1. **Point the nameservers at Cloudflare, in that account.** Cloudflare already
   holds every record, so nothing visible changes. If anything does break, it
   can only be a DNS record, and the table above says which.
2. **Point `www` at the new site.** This is the launch, and the launch checklist
   governs it.

### Step 0: find the account that holds the registration

**Done, 5 October 2026: Hover.** Kept here in case the account ever has to be
found again. Any of these will name it:

- **ICANN Lookup** at `lookup.icann.org`: enter the domain. It shows the
  registrar, and for a domain sold through a reseller it often names the
  reseller too.
- **Renewal reminders.** Registrars must email the registrant before each
  expiry, so a search of the likely inboxes for the domain name with "renewal"
  or "expiry" usually finds the company and the account.
- **Bank or card statements**, for an annual charge of a few tens of dollars.
- **Whoever set up the Wix site** in 2017.

If the account belongs to someone outside the church, such as a former
volunteer or designer, bring it under the church's control now: either they
change the account's owner and contact details, or they obtain the transfer
authorisation code and the domain moves into a registrar account the church
owns, which takes three to five days. Either way the registrant should be The
Transformation Edge Ltd, with a church email address.

### Step 1: nameservers to Cloudflare

1. In Cloudflare, **Onboard a domain** (it was called **Add a domain**),
   `thetransedge.com`, on the **Free** plan. Use the same account that holds the
   `the-transedge-website` Worker, or the Worker cannot be attached later.
2. Cloudflare scans the current records and imports what it finds. Go through
   the import against the table above:
   - add anything missing (on 5 October 2026 nothing was)
   - switch **every** record to **DNS only**, including `@` and `www`, so they
     keep pointing at Wix exactly as they do now; the import marks them all
     Proxied
   - delete `m`

   Cloudflare will warn that nothing is protected. That is correct until the
   launch; choose to do it later.
3. Cloudflare assigns two nameservers. For `thetransedge.com` they are
   `cloe.ns.cloudflare.com` and `rodrigo.ns.cloudflare.com`.

   Steps 1 to 3 were done on 5 October 2026. Cloudflare's two nameservers were
   then queried directly, before anything changed at Wix, and gave the same
   answer as Wix's for every record in the table.

   Step 4 was done the same day. The `.com` registry was delegating to
   Cloudflare by 06:56 UTC, and at that moment Cloudflare's nameservers, Wix's,
   and the public resolvers of Cloudflare, Google and Quad9 all gave identical
   answers for email, Connect, the Google addresses, the signing records and
   the website.
4. **In Hover, not Wix**: sign in, click `thetransedge.com` to open its
   **Overview** page, find **Nameservers** on the left and choose **Edit**.
   Remove both `wixdns.net` entries, enter Cloudflare's two, and **Save
   nameservers**. All of a domain's nameservers must belong to one provider, so
   leave no Wix entry behind. Then, in Cloudflare, choose **I updated my
   nameservers**.
5. Wait for Cloudflare to report the domain **Active**. Usually under an hour.
   For up to a day afterwards some of the internet still asks Wix: the `.com`
   registry tells resolvers to remember nameservers for 6 hours, and Wix's own
   copy of them says a day (both measured 5 October 2026). **Leave the domain
   completely alone in Wix for two days**, to be safe: do not disconnect it,
   remove it, or change how it is connected. Nothing breaks while both answer,
   because the records match.
6. Check, in this order: send an email to `frontdesk@thetransedge.com` from an
   outside address and reply to it; open `connect.thetransedge.com` and sign in;
   open `www.thetransedge.com`.

**The old Wix site after the switch.** With the nameservers no longer pointing
at Wix, Wix may treat the domain as disconnected. If, after the two days, the
old site stops appearing, either change the domain's connection method in Wix
to pointing and set the records Wix shows in Cloudflare, as DNS only, or treat
it as the moment to launch. Email and Connect do not depend on this either
way.

### Step 2: the new site on the domain

Only when the launch checklist says so.

1. In Cloudflare, **Workers & Pages**, `the-transedge-website`, **Settings**,
   **Domains & Routes**, **Add**, **Custom domain**: `www.thetransedge.com`.
   If Cloudflare refuses because a record already exists, delete the `www`
   record that points at Wix, and add the custom domain again. Cloudflare
   creates the replacement record and the certificate itself.
2. Add `thetransedge.com` (no `www`) as a second custom domain the same way,
   deleting the three Wix `A` records first if asked.
3. **Rules**, **Redirect Rules**, create from the template **Redirect from root
   to WWW**. The bare domain then sends everyone to `www`, which is the
   canonical address the whole site is built around.
4. Check `https://www.thetransedge.com` loads the new site,
   `https://thetransedge.com/give` lands on `https://www.thetransedge.com/give`,
   and an old Wix address such as `/product-page/anything` redirects rather than
   showing a 404.
5. Re-run the checks in the launch checklist's "On the day" list.

If anything is wrong, removing the two custom domains and putting the Wix
records back returns the old site within minutes. That is the whole rollback.

### Later: the registration itself

Nothing to do. The registration is paid until 23 July 2036 and Hover lets the
nameservers point anywhere. Moving it to Cloudflare Registrar would put the
domain and the site in one account, but the registration is already close to
the ten-year maximum, so the year a transfer normally adds could not be added.
It is not worth the bother before about 2034.

Cloudflare's onboarding warns that Wix does not allow transfers to Cloudflare.
That warning is triggered by the Wix nameservers and applies only to domains
Wix registered itself. This one is not one of them.

While in Hover, check the domain's contact details name The Transformation Edge
Ltd and a church email address, so renewal notices in 2036 reach someone who
will still be there.

**Do not cancel the Wix plan until the new site has been live for thirty days**,
per the launch checklist. Three records also lean on Wix. `_dmarc` points at
`wixemails.com`: before leaving Wix entirely, replace it with a DMARC TXT record
of your own, which is one line. `s1` and `s2` sign mail sent through Wix's email
marketing: if that is no longer used, delete them; if it is, it stops when the
Wix plan does anyway.

### Found while taking the inventory: email authentication

Not caused by the move, and not to be fixed on the same day as it, but worth
knowing. The domain publishes **no SPF record**, and **no Google DKIM key**.
Mail from `frontdesk@thetransedge.com` is therefore unauthenticated as far as
Gmail, Outlook and Yahoo are concerned, which since 2024 is a common reason for
legitimate mail to land in spam.

The fix is two records in Cloudflare once the move has settled: an SPF record
naming Google and any other service that sends as `@thetransedge.com` (Brevo,
if it does), and the DKIM key that Google Workspace generates under **Apps**,
**Gmail**, **Authenticate email**. An SPF record that forgets a sender is worse
than none for that sender, so list every service that sends before publishing
it.
