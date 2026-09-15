# The shop

Merchandise, sold from the site, paid for through Stripe, managed at `/admin`.

## How it fits together

```
/admin  ->  src/data/shop/products.json  ->  pull request  ->  merge  ->  deploy
                          |
            +-------------+-------------+
            |                           |
      the /shop pages            the checkout Worker
   (what a visitor reads)      (what Stripe is told to charge)
                                         |
                                checkout.stripe.com
                                         |
                       Stripe Dashboard is the order book
```

Two things are worth knowing before anything else.

**A price lives in one place.** Nothing is set up in Stripe. There are no Stripe
Products and no Stripe Prices to keep in step with the site, because the Worker
builds each line item from the same catalogue file the pages were built from. The
figure you type at `/admin` is the figure on the page and the figure Stripe
charges. They cannot drift apart, because there is only one of them.

**There is no orders database.** Stripe holds the order. The Checkout Session
records the items, the size, whether it is being collected or posted, and for a
posted order the address and phone number. That is the packing list. A second copy
here would be one more place for somebody's address to live and one more thing to
keep in step.

## Adding a product

1. Go to `/admin` and open **Shop**, then **Products**.
2. Add an entry. The fields that matter most:
   - **Price** is dollars and cents, always two decimal places, GST included. We
     are registered for GST, so do not add it on top. `45.00`, not `45` and not
     `40.91`.
   - **Price confirmed** stays unticked until somebody has actually checked the
     figure. Nothing can go on sale without it and the build will refuse.
   - **Stock code** never changes once something has been sold. Baskets match on
     it.
   - **Photographs** need the file to already be in `src/assets/shop/`, named
     without its extension, and every one of them needs alt text. The build fails
     without it, on purpose.
   - **Sizes**: list the whole run, including sizes that have sold out, and untick
     rather than delete. The page then says a size has gone instead of quietly
     leaving a gap.
3. Save. That opens a pull request. Somebody else merges it. The site is live about
   ninety seconds later.

A product needs **On sale** and **Price confirmed** both ticked before anybody can
buy it. Until then it has a page that says it is not available yet, which is what
lets you write and photograph something before it goes on the range.

### Photographs

Product photography goes in `src/assets/shop/` and is added by whoever manages the
site, not through `/admin`. Flat, plain ground, the garment or the object filling
the frame. A product with no photograph yet shows a reserved frame at the right
shape, so the page is already laid out and dropping the file in later moves
nothing.

## Turning postage on

Posting is off until it is deliberately switched on, and until then the shop offers
collection only, including for anybody who tries to ask for posting.

In `/admin`, **Shop**, **Delivery and postage**: set the flat rate, tick
**Postage rate confirmed**, save, merge. That is the whole switch.

## Reading and packing an order

Orders are in the Stripe Dashboard under **Payments**. Each one shows:

- the items, with the size in the product name
- `fulfilment` in the metadata: `collect` or `post`
- the delivery address and phone, for a posted order only
- the buyer's email, which is where Stripe sent the receipt

Set Stripe to email you on every successful payment, under
**Settings**, **Business**, **Email notifications**. That is the whole order alert
system and it needs nothing built.

A collection order has no address on it. That is deliberate, not a fault: we do not
ask for an address we have no use for.

## Refunds

Refund in the Stripe Dashboard, on the payment. It goes back to the card or account
that paid. Nothing on the site needs changing. If the item is coming back into
stock, tick the size back on at `/admin`.

## What has to be set up before the shop opens

Four things, none of which are code.

1. **The Stripe secret key**, set on the Worker, never in this repository:
   ```
   npx wrangler secret put STRIPE_SECRET_KEY
   ```
   Use the live key when the shop opens and a test key before that. Until it is
   set, the checkout endpoint replies with a polite message telling people to call,
   which is the right failure.
2. **The GST tax rate.** Create a Tax Rate in Stripe: 10 per cent, **inclusive**,
   display name GST, country Australia. Take its `txr_...` id and set it as a plain
   variable on the Worker:
   ```
   npx wrangler secret put STRIPE_GST_TAX_RATE
   ```
   It is not secret, but putting it beside the key keeps both in one place. Without
   it the shop still works; the receipt simply carries no GST breakdown, which for
   a registered entity is not good enough to open with.
3. **The tax invoice.** Stripe's receipt shows the GST once the rate above is
   applied. A compliant Australian tax invoice also wants the words "tax invoice"
   and the ABN on it, which is Stripe receipt configuration. The accountant should
   look at a real receipt before the first sale rather than after.
4. **Legal review of `/shop/terms`.** It is drafted and on the draft register as
   `awaiting-legal`, alongside the privacy policy and the terms of use. The shop
   should not open to the public until somebody has read it.

Then remove `shop`, `shop/*`, `shop/terms` from `src/data/draft-pages.mjs`, take
`noindex` off those pages, and add Shop to the primary navigation in
`Header.astro`. The two transactional entries, `shop/basket` and
`shop/order-complete`, stay on the register permanently.

## What the build refuses to let through

`npm run check:shop`, part of `npm run verify`, fails on:

- a photograph with no alt text, or naming a file that is not there
- a price that is not dollars and cents
- a duplicate slug or stock code
- clothing with no size run
- a product on sale whose price is unconfirmed, or priced at zero, or whose every
  size is sold out
- a postage rate left at its placeholder

Every one of those is something that looks fine on a finished-looking page and
costs real money or real trust. That is why they are build failures rather than
items on a checklist.

## Security notes

- Nothing sent by the browser is trusted. The request names a stock code, a size
  and a quantity. Every price, name and availability decision is made again inside
  the Worker from its own copy of the catalogue. A basket edited in a browser
  console gets the real price or an error.
- Quantities are clamped to the per-product limit, and a whole basket is capped, so
  a malformed request cannot open a session for a fortune.
- The checkout endpoint is same-origin only and sends no CORS headers, so another
  site cannot call it or read its reply.
- Card details never touch this site. Stripe's hosted page collects them, which is
  also what keeps us at the simplest PCI obligation there is.
- Cloudflare's rate limiting should be pointed at `/api/checkout` before the shop
  opens. It is a dashboard rule, not code.

## Things deliberately not built

- **Live stock counts.** The client chose an editor tick over counts that fall as
  items sell. Counts need a database and order processing on top of Stripe, and a
  range this size does not earn it.
- **An order database.** See above. Stripe is the order book.
- **A Stripe webhook.** Nothing here depends on knowing about a payment after the
  fact. If orders ever need to land in Connect automatically, that is where it
  would go.
- **`/api/contact`.** The Worker now exists, so the contact and prayer forms could
  finally be delivered somewhere. Open question 5 in `docs/open-questions.md` has
  not been answered, so where they should be delivered is still undecided and
  nothing was guessed. Those forms behave exactly as they did before.
