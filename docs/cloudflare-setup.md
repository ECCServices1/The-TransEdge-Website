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

### Wix will not let go of the nameservers

**A domain registered with Wix cannot use anyone else's nameservers.** Wix's
own help centre files changing them as an unfulfilled feature request, and
Cloudflare's documentation says the same of Wix, Shopify and Block. Wix lets
you edit individual records, but Cloudflare can only attach a Worker to a
domain whose DNS it runs, so editing records at Wix cannot put the new site on
the domain.

So the registration has to leave Wix first. That makes three steps:

0. **Move the registration from Wix to another registrar.** Three to five days.
   Nothing visible changes while it runs.
1. **Point the nameservers at Cloudflare, at the new registrar.** Cloudflare
   already holds every record, so again nothing visible changes. If anything
   does break, it can only be a DNS record, and the table above says which.
2. **Point `www` at the new site.** This is the launch, and the launch checklist
   governs it.

Keep them apart. If email stops on the day, the step that caused it should be
obvious.

### Step 0: take the registration out of Wix

**Before starting, in Wix, under Domains and `thetransedge.com`:**

- Check the **registrant contact email**. Wix sends the transfer code there, so
  it has to be an inbox somebody can open today.
- Turn **Private Registration** off. Wix recommends this before a transfer, so
  the confirmation emails are not swallowed by the privacy service.
- **Do not change the registrant's name or email at Wix first.** A contact
  change can lock the domain against transfer for 60 days. Correct the details
  at the new registrar afterwards, and while there, make sure the registrant is
  The Transformation Edge Ltd with a church address, not an individual.

Wix shows the mailbox on its DNS page as "OTHER", which means Google Workspace
was not bought through Wix. The transfer does not touch it.

**Choose the new registrar.** Any mainstream registrar that lets you change
nameservers will do: Namecheap and Porkbun are inexpensive and make it a
one-screen change, and VentraIP is an Australian company with local support.
During the transfer, if the new registrar asks about nameservers or DNS,
**keep the current ones**. Never let it move the domain onto its own empty DNS:
that is the one choice in this whole process that would stop email at once.

**Then:**

1. In Wix: **Domains**, the **Domain Actions** menu (the three dots) beside
   `thetransedge.com`, **Transfer away from Wix**, **Transfer Domain**, **I Still
   Want to Transfer**. Wix emails the authorisation code to the registrant
   contact.
2. At the new registrar, start a transfer of `thetransedge.com`, paste the code
   and pay. The price includes a year's renewal, added to the current expiry, so
   nothing is lost.
3. Approve any confirmation emails, from either side. The transfer then takes
   three to five days. Email, Connect and the Wix site carry on as normal
   throughout, because Wix keeps answering for the domain until it has gone.
4. **The moment the new registrar confirms the transfer is complete, do Step 1.**
   Once the domain has left Wix, Wix may stop answering for it, and every hour
   between then and the nameserver change is an hour in which the domain could
   go quiet. Mail sent in a short gap is normally held and retried by the
   sender rather than lost, but the aim is minutes, not hours.

**The old Wix site may drop off the domain when it leaves Wix.** Wix serves a
domain registered elsewhere only once it has been connected to the site by
"pointing". If the old site stops appearing, either reconnect it in Wix, which
shows the exact records to set, or treat it as the moment to launch the new one.
Email and Connect do not depend on this either way.

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
4. **At the new registrar, not Wix**, replace the nameservers with Cloudflare's
   two. Cloudflare's page names Enom as the registrar; Enom is the wholesaler
   behind Wix's domains, and nobody needs an Enom account.
5. Wait for Cloudflare to report the domain **Active**. Usually under an hour,
   occasionally up to two days. Nothing breaks while you wait, provided the
   records match.
6. Check, in this order: send an email to `frontdesk@thetransedge.com` from an
   outside address and reply to it; open `connect.thetransedge.com` and sign in;
   open `www.thetransedge.com`.

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

### Later: Cloudflare Registrar, if wanted

Once the domain has sat at the new registrar for 60 days, which the registry
requires after any transfer, it can move again to Cloudflare Registrar: renewal
at cost with no markup, and the domain and the site in one account. Optional.
Cloudflare could not take it straight from Wix only because Cloudflare insists
on running a domain's nameservers before accepting its registration, and Wix
would not allow that.

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
