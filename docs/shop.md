# The shop

Clothing and books, sold from the site, paid for through Stripe, managed at
`/admin`.

## What is in it

The RAIN 2026 clothing arrived on 24 October 2026, with the final design: our
mark on the chest and, across the back, RAIN over "The former rain, and the
latter rain" and Joel 2:23 in Roman numerals. Each cut that arrived is its own
product, in the colours and sizes that came, because a product can only mark
sizes available for all its colours at once and the cuts came in different
sizes. Paid for when ordered, ready to collect at the Sunday gathering within a
week. Prices include GST and Stripe's fee: every t-shirt $50 and the hoodie $80,
kids' included, because the suppliers charge one price whatever the size (client,
11 October 2026; they were $35 and $65, with kids' sizes at $25 and $45).

The first designs, the RAIN hooded jumper and t-shirt in forest green, chocolate,
rust and navy, stay on the range marked out of stock (client, 24 October 2026),
so people can still see them. The two books are on the range as coming soon.

Do Not Bow is not sold here. On 9 October 2026 the client asked for it to point
to drmichaelsa.com/book, so its page sends people there and shows no price (see
"Something another site sells" below). Its catalogue entry keeps the $20 the
client confirmed on 5 October, unused while the link is set.

| Product | Kind | Choices | Waiting on |
|---|---|---|---|
| RAIN fleece hoodie | On sale. Oversized fleece hoodie | Navy; S, M, L | Nothing |
| RAIN essential t-shirt | On sale. Cotton crew neck | Navy; XS, S, M, XL | Nothing |
| RAIN oversized t-shirt | On sale. Oversized cotton | Black; 4XL | Nothing |
| RAIN drop-shoulder t-shirt | On sale. Loose, dropped shoulders | Grey apricot; XL | Nothing |
| RAIN seamless t-shirt | On sale. Unisex cotton | Coffee; S, M, L | Its picture: the design came as a coffee hoodie, the stock as coffee t-shirts |
| RAIN kids' t-shirt | On sale. Kids' crew neck, sized by height | Green, Pink; 120, 130, 140 | Nothing |
| RAIN hooded jumper | Out of stock. The first design | Forest green, Chocolate, Rust, Navy | Nothing; kept on the range to be seen |
| RAIN t-shirt | Out of stock. The first design | Forest green, Chocolate, Rust | Nothing; kept on the range to be seen |
| Do Not Bow, Dr Michaels Aibangbee | Book, Ark House Press, ISBN 9781764750790. Sold through drmichaelsa.com/book | None | The cover, for its page here |
| Speak Life, Ps Osas Michaels-Aibangbee and Dr Michaels Aibangbee | Book | None | Everything: description, publisher, date, price, cover |

A pen is in the catalogue as hidden: it has its own page and is listed nowhere.

What arrived, as the client's order listed it on 24 October 2026: hoodie navy
S 2, M 1, L 2; essential t-shirt navy XS 6, S 8, M 10, XL 5; oversized black
4XL 1; drop-shoulder grey apricot XL 5; seamless coffee S 1, M 1, L 1; kids'
green 120 1, 130 1, 140 3; kids' pink 120 1, 130 1, 140 3. The shop has no stock
counts, so untick a size at `/admin` when the last one goes.

The pictures are the client's design mockups of 24 October 2026, one per side,
padded from square to 4:5 on their own white ground and scaled to 800 by 1000
(`src/assets/shop/rain-*.webp`). At the 1400px they came in, the shop page's
first picture was heavy enough to push its largest paint to about 1.9s; at 800
it is about 1.82s, as before.
The first designs' mockups of 5 October are the `.jpg` files. Each says it is a
mockup, under the pictures and in its alt text. Photographs of the garments
replace them, file for file.

### Stripe's fee is in the price

The price on the page is what the buyer pays, and nothing is added at checkout
(client, 11 October 2026). Card surcharges are not an option in any case: Stripe
stopped supporting them in Australia on 1 October 2026. TTE pays Stripe's fee out
of the price.

On Stripe's standard Australian pricing as at October 2026, 1.65% + 30c for an
Australian card and 3.5% + 30c for an overseas one, a sale with one item comes
out like this. The GST is a tenth of the GST-inclusive price, so one eleventh.

| Item | Price | GST in it | Stripe's fee, Australian card | TTE keeps, before the cost of the garment |
|---|---|---|---|---|
| T-shirt, any size | $50.00 | $4.55 | $1.13 | $44.32 |
| Hooded jumper, any size | $80.00 | $7.27 | $1.62 | $71.11 |

The 30c is charged once per payment, not per item, so a basket of several items
pays it once. A charity rate or a negotiated rate on TTE's Stripe account
changes these figures; Stripe shows the fee on each payment.

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
records the items, the colour, fit and size of each, whether it is being
collected or posted, and for a
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
   - **Where it shows**: hidden (its own page only), coming soon (on the shop,
     not for sale), on sale, or out of stock (on the shop with its pictures
     and price, marked out of stock, not for sale). **A few words beside the price** says what a
     coming-soon item is waiting for, such as "Launching 15 November at RAIN 2026".
   - **Colours**, for clothing that comes in more than one: each has a name, a
     swatch colour and its own photographs, and choosing it on the page shows
     them. The name is what the order says, so do not change it once something
     has sold. Up to eight.
   - **Fits**, for clothing in more than one size run, such as Unisex, Women's and
     Kids: each has its own sizes, and a line for the size guide. Up to four.
     Clothing with a single run uses **Sizes** instead.
   - **Sizes**, in either place: list the whole run, including sizes that have
     sold out, and untick rather than delete. The page then says a size has gone
     instead of quietly leaving a gap. Before something goes on sale, untick
     every size that is not actually stocked.
   - **Books** take an author, and a publisher, ISBN and format where known.
   - **Sold elsewhere, the link to buy it** is for something another site sells.
     Leave it empty for anything sold here.
3. Save. That opens a pull request. Somebody else merges it. The site is live about
   ninety seconds later.

A product needs **On sale** and **Price confirmed** both before anybody can buy
it. Until then it has a page that says it is not available yet, which is what
lets you write and photograph something before it goes on the range. A price is
not shown anywhere until it is confirmed: the page says "Price to come".

### Something another site sells

Fill in **Sold elsewhere, the link to buy it** with the full address, starting
`https://`. The product stays on the range, under **Where it shows** as usual,
but its page offers a button to that site instead of a basket, and says the
price and delivery are taken care of there. It shows no price and none of this
shop's terms, collection or gift notes, because none of them apply. The checkout
refuses it even if somebody edits a basket by hand.

Speak Life can go the same way when it is ready: fill in the link, and the price
and **Price confirmed** stop mattering.

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

## Switching payment on

Four things in Stripe and Cloudflare, none of which are code. Until the first is
done, the shop takes orders as far as the basket and the pay button asks people
to call, which is the right failure.

1. **A restricted key from TTE's Stripe account**, set on the Worker, never in
   this repository and never sent to anybody. In Stripe, under **Developers**,
   **API keys**, create a restricted key that can do one thing: write Checkout
   Sessions. Everything else stays at None. If a test payment is refused,
   Stripe's request log for that key names the permission it wanted. Save it in
   Cloudflare under **Workers & Pages**, **the-transedge-website**, **Settings**,
   **Variables and Secrets**, as a secret called `STRIPE_SECRET_KEY`, or with
   ```
   npx wrangler secret put STRIPE_SECRET_KEY
   ```
   Start with a test key (`rk_test_...`) and pay with Stripe's test card,
   4242 4242 4242 4242, any future date, any three digits. Then replace it with
   the live key (`rk_live_...`).
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
4. **The emails.** In Stripe's settings, turn on receipts for successful
   payments, which is how the buyer gets one, and an email to the church for
   every payment, which is the order alert.

The account is TTE's own, the one giving uses (client, 5 and 11 October 2026).
It is not the drmichaelsa.com account, which is Dr Michaels Aibangbee's own and
is where Do Not Bow is sold.

`/shop/terms` is drafted and on the draft register as `awaiting-legal`, alongside
the privacy policy and the terms of use. The client decided on 5 October 2026
that the draft stands as a placeholder and is reviewed later, so the review does
not hold up opening.

The shop and its product pages came off the draft register when it opened on 11
October 2026, and search engines may index them. A product set to hidden still
stays out of search: the register reads hidden products from the catalogue, so
hiding one at `/admin` needs nothing else. `shop/terms` keeps its entry, its
`noindex` and its draft notice until the review is done. The two transactional
entries, `shop/basket` and `shop/order-complete`, stay on the register
permanently.

### When an order is ready

**When an order is ready**, under **Shop**, **Delivery and postage** at `/admin`,
is one sentence: "Ready within a week of your order." It is
said on the shop, on each product that is on sale, in the basket beside "You pay
now, when you order", on the order confirmation, in the terms, and on Stripe's
payment page above the pay button. Change it there and it changes everywhere.

### Speed, on the day something goes on sale

The RAIN fleece hoodie page is in the Lighthouse budget, which allows 2.0s for the
largest paint on a simulated phone connection. CI's runner measures it slower
than a local run with the same settings, by up to about 0.14s, because it often
paints after the page's last requests and Lighthouse then counts them. Putting
something on sale adds the basket and the shop's script to every product page.

On 5 October 2026 the client decided to cut the web fonts to the weights the
site uses, which took about 29KB off every page. Measured locally afterwards,
the jumper page comes to about 1.74 to 1.81s with nothing on sale and 1.81 to
1.83s on sale, against 1.82s and 1.90s before the cut. That leaves room for the
basket when the shop opens. Still, watch the Lighthouse check on the pull
request that opens it.

Four things keep it there, and each has a note where it lives:

- The shop's script is one file that loads nothing else
  (`src/components/shop/ShopScript.astro`; `npm run check:bundles` keeps it
  that way).
- A product page's own styles are written into the page rather than fetched as
  a file (`astro.config.mjs`). Keep that stylesheet under 10kB, or it becomes a
  file again.
- Every product picture but the lead one is fetched at low priority
  (`secondary` in `src/components/Photo.astro`).
- The web fonts carry only the weights the site uses: Inter 400 to 700,
  Fraunces 400 to 600 (`scripts/subset-brand-fonts.mjs`). A design that needs a
  weight outside those widens the range there first.

## What the build refuses to let through

`npm run check:shop`, part of `npm run verify`, fails on:

- a photograph with no alt text, or naming a file that is not there
- a price that is not dollars and cents
- a duplicate slug or stock code
- clothing with no size run, or sizes on anything that is not clothing
- a colour named twice, without a swatch, or more than eight colours; a fit named
  twice, or more than four
- a book with no author, or an ISBN that fails its check digit
- a sold-elsewhere link that is not a full `https://` address
- a product on sale whose price is unconfirmed, or priced at zero, or with no
  colour or no size left to sell
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
