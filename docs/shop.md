# The shop

Clothing and books, sold from the site, paid for through Square, managed at
`/admin`.

Payment moved from Stripe to Square on 25 October 2026, by the client's
decision, because Square costs less on the items most orders are made of. Giving
is not part of this: it runs through Stripe inside Connect, as it always has.

## What is in it

The RAIN 2026 clothing arrived on 24 October 2026, with the final design: our
mark on the chest and, across the back, RAIN over "The former rain, and the
latter rain" and Joel 2:23 in Roman numerals. Each cut that arrived is its own
product, in the colours and sizes that came, because a product can only mark
sizes available for all its colours at once and the cuts came in different
sizes. Paid for when ordered, ready to collect at the Sunday gathering within a
week.

It sells from stock only (client, 24 October 2026): only the sizes that came are
listed, and **Most one person can order at once** is set to the largest number
in hand of any one size, so one order cannot take more than there is (one each
for the black and the coffee t-shirts, two for the hoodie). The shop keeps no
running count, so untick a size at `/admin` when its last one goes.

Prices, set on 24 October 2026: every adult t-shirt $28, kids' t-shirts $25, and
the hoodie $65. Square's fee is inside the price, and no GST is charged on
anything in the shop (client, 24 October 2026). Before that they were $50 and
$80 (11 October), and $35 and $65 with kids' sizes at $25 and $45 (5 October).

The first designs, the RAIN hooded jumper and t-shirt in forest green, chocolate,
rust and navy, stay on the range marked out of stock (client, 24 October 2026),
so people can still see them. The two books are on the range as coming soon.

Do Not Bow is not sold here. Its page sends people to the sale page at
drmichaelsa.com/shop and shows its price there, $22.99 (client, 24 October 2026;
it pointed to drmichaelsa.com/book from 9 October). See "Something another site
sells" below. Its front and back covers, sent by the author on 25 October 2026,
are on its card and page, each centred on white in the shop's 4:5 frame.

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
| Do Not Bow, Dr Michaels Aibangbee | Book, Ark House Press, ISBN 9781764750790. Sold through drmichaelsa.com/shop; also on Kindle and Amazon | None | The Kindle and Amazon links, to make those names links |
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

### Square's fee is in the price

The price on the page is what the buyer pays, and nothing is added at checkout
(client, 11 October 2026). Card surcharges are not an option in any case: they
ended in Australia on 1 October 2026. TTE pays Square's fee out of the price.

Square's published rate for online payments in Australia, as at October 2026, is
2.2% with no fixed fee per payment. A sale with one item comes out like this, with
Stripe's 1.65% + 30c alongside for comparison. No GST is charged.

| Item | Price | Square's fee | TTE keeps, before the cost of the garment | Stripe's fee would have been |
|---|---|---|---|---|
| T-shirt | $28.00 | $0.62 | $27.38 | $0.76 |
| Kids' t-shirt | $25.00 | $0.55 | $24.45 | $0.71 |
| Hoodie | $65.00 | $1.43 | $63.57 | $1.37 |

Square takes the same share of every dollar, so it costs less on any payment under
about $55 and slightly more above it. Most orders here are a t-shirt or two, so it
comes out ahead. Afterpay is switched off at checkout, because Square charges
several times the card rate for it. Square shows the fee on each payment, and its
pricing page has the current rates, including for overseas cards.

## How it fits together

```
/admin  ->  src/data/shop/products.json  ->  pull request  ->  merge  ->  deploy
                          |
            +-------------+-------------+
            |                           |
      the /shop pages            the checkout Worker
   (what a visitor reads)      (what Square is told to charge)
                                         |
                              Square's payment page
                                         |
                       Square Dashboard is the order book
```

Two things are worth knowing before anything else.

**A price lives in one place.** Nothing is set up in Square. There are no items
in Square's catalogue to keep in step with the site, because the Worker builds
each line item from the same catalogue file the pages were built from. The
figure you type at `/admin` is the figure on the page and the figure Square
charges. They cannot drift apart, because there is only one of them.

**There is no orders database.** Square holds the order. It records the items,
with the colour, fit and size of each in its name, whether it is being collected
or posted, and for a posted order the address. That is the packing list. A second copy
here would be one more place for somebody's address to live and one more thing to
keep in step.

## Adding a product

1. Go to `/admin` and open **Shop**, then **Products**.
2. Add an entry. The fields that matter most:
   - **Price** is dollars and cents, always two decimal places: what the buyer
     pays. No GST is charged in the shop. `45.00`, not `45`.
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
but its card goes straight to that address, in a new tab, and its page offers a
button there instead of a basket and says ordering and delivery are taken care
of there. The page is still built, for anybody who finds it from a search. It shows the price entered here, as the
other site charges it, with "at" and the site's name; keep the two in step. It
shows none of this shop's terms, collection or gift notes, because none of them
apply. The checkout refuses it even if somebody edits a basket by hand.

Speak Life can go the same way when it is ready: fill in the link and its price
there.

**Also available on** names other places it can be bought, under the price on
its page and on its card: Do Not Bow is also on Kindle and Amazon (client, 25
October 2026). Add a store's link and its name on the page becomes a link to it.
The card does not link it, because the whole card is already a link.

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

One check first, in the sandbox: make a posted test order and see whether
Square's payment page asks for a phone number as well as the address. The
carrier needs one, and the terms and privacy policy say a posted order collects
one. When it was set up with Stripe, Stripe was told to ask; Square was not
tested for it before postage was needed.

## Reading and packing an order

Orders are in the Square Dashboard, with the payments. Each one shows:

- the items, with the colour and size in each name
- the payment note, which starts with how it is being fulfilled ("Collect at our
  Sunday gathering" or the postage option) and then lists what to pack
- the delivery address, for a posted order only
- the buyer's email, which is where Square sent the receipt
- a reference such as `TTE-1A2B3C4D`, which is also in the address the buyer
  came back to the site on

Turn on Square's email notifications for online payments, so the church hears
about each order. That is the whole order alert system and it needs nothing
built.

A collection order has no address on it. That is deliberate, not a fault: we do not
ask for an address we have no use for.

## Refunds

Refund in the Square Dashboard, on the payment. It goes back to the card or account
that paid. Nothing on the site needs changing. If the item is coming back into
stock, tick the size back on at `/admin`.

## Switching payment on

Three settings on the Worker and one check in Square, none of which are code.
Until the token and location are set, the shop takes orders as far as the basket
and the pay button asks people to call, which is the right failure.

1. **An application in Square's Developer Console.** Sign in at
   developer.squareup.com with TTE's Square account (not a personal one) and
   create an application, called something like "TTE website". Its
   **Credentials** page has an access token for the sandbox (Square's test
   system) and one for production. Its **Locations** page has the location ID
   for each.
2. **The token and location, set on the Worker**, never in this repository and
   never sent to anybody. In Cloudflare, under **Workers & Pages**,
   **the-transedge-website**, **Settings**, **Variables and Secrets**, add:

   | Name | Type | Value |
   |---|---|---|
   | `SQUARE_ACCESS_TOKEN` | Secret | the access token |
   | `SQUARE_LOCATION_ID` | Secret | the location ID |
   | `SQUARE_ENVIRONMENT` | Secret | `sandbox` while testing; `production` to go live |

   All three as **Secret**, even the two that are not sensitive. A plain-text
   variable added in the dashboard is removed the next time the site deploys
   from GitHub, because `wrangler.jsonc` does not ask Wrangler to keep them.
   Secrets are kept. From a terminal instead, `npx wrangler secret put
   SQUARE_ACCESS_TOKEN` and the same for the other two.

   Saving a secret redeploys the live site with it, which is harmless before
   this change is merged. A preview built before the secrets existed does not
   have them, and Cloudflare offers no retry for a build that succeeded, so the
   preview picks them up from the next push to its branch. Ask for one if
   nothing else is due to change.

   Unlike Stripe, Square has no restricted key: this token can do anything in
   the Square account. That is why it lives only as a Worker secret. If it is
   ever exposed, replace it on the same Credentials page and the old one stops
   working.
3. **A test purchase.** With the sandbox token, sandbox location and
   `SQUARE_ENVIRONMENT=sandbox`, buy something on the preview and pay with one
   of the test cards on Square's "Sandbox payments" page. Check that the payment
   page shows the right items and total, that it returns to the "Thank you" page
   with an empty basket, and that the order appears in the sandbox Square
   Dashboard with the payment note. Then swap in the production token and
   location and set `SQUARE_ENVIRONMENT` to `production`.
4. **The emails.** Check that the buyer's receipt arrives on the test purchase,
   and turn on Square's email notifications for online payments, which is the
   order alert.

The Square account is TTE's own. Do Not Bow is sold on drmichaelsa.com, which is
Dr Michaels Aibangbee's own site and nothing to do with this one.

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
now, when you order", on the order confirmation and in the terms. Square's
payment page has no place for a line of our own, so the basket says it under
"Getting it to you", before the pay button. Change it there and it changes everywhere.

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
- Card details never touch this site. Square's hosted page collects them, which is
  also what keeps us at the simplest PCI obligation there is.
- The Square token has full access to the account, because Square has no
  restricted keys. It is a Worker secret and nowhere else.
- Cloudflare's rate limiting should be pointed at `/api/checkout` before the shop
  opens. It is a dashboard rule, not code.

## Things deliberately not built

- **Live stock counts.** The client chose an editor tick over counts that fall as
  items sell. Counts need a database and order processing on top of Square, and a
  range this size does not earn it.
- **An order database.** See above. Square is the order book.
- **A Square webhook.** Nothing here depends on knowing about a payment after the
  fact. If orders ever need to land in Connect automatically, that is where it
  would go.
- **`/api/contact`.** The Worker now exists, so the contact and prayer forms could
  finally be delivered somewhere. Open question 5 in `docs/open-questions.md` has
  not been answered, so where they should be delivered is still undecided and
  nothing was guessed. Those forms behave exactly as they did before.
