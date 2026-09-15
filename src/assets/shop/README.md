# Product photography

Photographs of merchandise. One or more per product, referenced from
`src/data/shop/products.json` by file name without the extension, so
`hoodie-navy-front.jpg` is written as `hoodie-navy-front`.

`jpg`, `png` and `webp` are picked up. Astro generates the responsive set, so
supply the largest good version you have rather than something pre-shrunk.

Every photograph needs alt text on its entry in the catalogue. The build fails
without it, which is the same rule the rest of the site's images follow.

Shoot them flat, on a plain ground, with the item filling the frame. A product
with no photograph yet renders a reserved frame at the right shape, so adding the
file later moves nothing on the page.

Nothing in here should show a person's face unless the usual consent rules in
`docs/photography-shot-list.md` have been followed for it.
