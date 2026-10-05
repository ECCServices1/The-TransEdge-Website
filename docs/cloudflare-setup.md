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
   the Google custom addresses for mail, calendar and docs, and email
   authentication records for a second sender (the `s1` and `s2` keys) and for
   Brevo.
3. **The TTE Connect Hub** at `connect.thetransedge.com`.

The move is safe exactly when (2) and (3) keep working. They will, provided
every record below exists in Cloudflare **before** the nameservers change.

Also confirmed: DNSSEC is not enabled, so there is no signing to switch off
first; there are no CAA records, so nothing restricts who can issue the
certificate; and there is no wildcard record.

### The records

**Proxy status matters.** Everything in this table is **DNS only** (the grey
cloud). Google's and the Connect Hub's certificates are issued against their own
servers, and putting Cloudflare's proxy in front of them breaks those
certificates.

| Type | Name | Content | Priority | Why |
|---|---|---|---|---|
| MX | `@` | `aspmx.l.google.com` | 10 | Email |
| MX | `@` | `alt1.aspmx.l.google.com` | 20 | Email |
| MX | `@` | `alt2.aspmx.l.google.com` | 30 | Email |
| MX | `@` | `aspmx2.googlemail.com` | 40 | Email |
| MX | `@` | `aspmx3.googlemail.com` | 50 | Email |
| TXT | `@` | `brevo-code:c946bc48e6ae4f44745f660d029edc24` | | Brevo verification |
| TXT | `@` | `openai-domain-verification=dv-O8H4PPOUgF9l3QgqBIe8LOjc` | | OpenAI verification |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc_agg@vali.email` | | Email reporting |
| TXT | `s1._domainkey` | see below | | Email signing |
| TXT | `s2._domainkey` | see below | | Email signing |
| A | `connect` | `185.158.133.1` | | The Connect Hub |
| CNAME | `mail` | `ghs.google.com` | | Google Workspace |
| CNAME | `calendar` | `ghs.google.com` | | Google Workspace |
| CNAME | `docs` | `ghs.google.com` | | Google Workspace |
| A | `@` | `185.230.63.171`, `185.230.63.107`, `185.230.63.186` | | The Wix site, **until launch** |
| CNAME | `www` | `cdn3.wixdns.net` | | The Wix site, **until launch** |

`m` (a CNAME to `www48.wixdns.net`) is Wix's old mobile site and can be left
behind.

The two signing keys, in full. Cloudflare's import scan does not look for these
names, so they almost certainly have to be added by hand:

```
s1._domainkey   k=rsa; t=s; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+7IaD0RZFvYvsC8tLmEHinATEHm0CSCVyb/lpHy8RbX10GvSjuhs2MZORP1QY8F//yo2vQGmlRTx5kFegrAMeMavHK/yEokEMUXei46VHk1f9Nfq97HWaR5EV5rijMUBEP6P4iru3Vw/lv4AxwkF0CsEWsTcoT2CF5aHE2v/lHwIDAQAB

s2._domainkey   k=rsa; t=s; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDB4KCzhrXVAphOcfaZ9jpO6iKn4af3csRFT8kptBLJkMuS0Sxf1OW+4O0NYizTmo1IDegB9K0/zHz52xO5qX3NAxVoJCyzZqS/IZp3GI36DhfRWFr6PQCjyIl4IH/X5wZgZ9dF2Ww5Dt+8C1rOlYOYbAEvmHE2ETyrmwz3Ntq4NwIDAQAB
```

This list was gathered by asking for every likely name. A record on a name
nobody would guess cannot be found that way, so check it against the full list
on the Wix DNS records page before switching.

### Two moves, not one

The safe way to do this is two separate changes, days apart if you like:

1. **Move the DNS to Cloudflare, with everything pointing exactly where it
   points today.** Nothing visible changes. The Wix site keeps serving, email
   keeps arriving, Connect keeps working. If anything does break, it can only be
   a DNS record, and the table above says which.
2. **Point `www` at the new site.** This is the launch, and the launch checklist
   governs it.

Doing both at once means that if email stops on the day, nobody can tell
whether the cause is the DNS move or the launch.

### Move 1: DNS to Cloudflare

1. In Cloudflare, **Add a domain**, `thetransedge.com`, on the **Free** plan.
   Use the same account that holds the `the-transedge-website` Worker, or the
   Worker cannot be attached to the domain later.
2. Cloudflare scans the current records and imports what it finds. Go through
   the import against the table above:
   - add anything missing, in particular the two `_domainkey` records
   - set **every** record to **DNS only**, including `@` and `www`, so they
     keep pointing at Wix exactly as they do now
   - delete `m`
3. Cloudflare gives you two nameservers, names like `ada.ns.cloudflare.com`.
4. In Wix: **Domains**, then `thetransedge.com`, then the name servers setting
   (under **Advanced**). Replace Wix's two nameservers with Cloudflare's two.
   If Wix does not offer to change them, the domain has to be transferred out of
   Wix instead; stop and ask before going down that route.
5. Wait for Cloudflare to report the domain **Active**. Usually under an hour,
   occasionally up to two days. Nothing breaks while you wait, because Wix and
   Cloudflare are serving the same records.
6. Check, in this order: send an email to `frontdesk@thetransedge.com` from an
   outside address and reply to it; open `connect.thetransedge.com` and sign in;
   open `www.thetransedge.com` and see the old Wix site, which is correct at
   this stage.

### Move 2: the new site on the domain

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

Moving the nameservers does not move the registration. The domain stays
registered, and billed, at Wix. That is fine, and it is all the move needs.

When the domain is added, Cloudflare recognises it as a Wix domain and offers
"transfer options". **Close that and carry on adding the site.** The pop-up is
about moving the registration, which is a separate and optional job.

Moving the registration to Cloudflare Registrar later would mean renewals at
cost with no markup, and the domain and the site in one account. But Cloudflare
does not accept transfers directly from Wix (confirmed in Cloudflare's own
onboarding, 5 October 2026). The route is Wix to another registrar first, then a
60-day wait the registry imposes after any transfer, then Cloudflare. Each
transfer adds a year to the registration, so nothing is lost, but it is two
moves and two months. Worth doing only if the Wix renewal price is a real
annoyance; leaving the registration at Wix costs nothing in function.

**Do not cancel the Wix plan until the domain's renewal is safely somewhere
other than a plan you are cancelling.** Check the renewal date in Wix
**Domains** before doing anything with the plan.

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
