# VENNIX storefront → vennixstore-theme migration

Source: `kellyraydev/vennix-storefront` (`shopify-theme/`, commit `f72dd03`).
Target: this repository. The theme lives at the repository root, with no nested `shopify-theme/` folder.

This theme is Shopify-native Liquid and OS 2.0 only. It has no Hydrogen, no Node server and no external backend. Shopify stays the source of truth for products, variants, prices, inventory, collections, cart, checkout and customers. Nothing from the catalog is hard-coded.

## Approach

The target theme was already a more complete Dawn-based OS 2.0 theme with VENNIX branding. It had a header group, a cart drawer, facets, predictive search, quick add and customer pages. So the migration **merged** the source features into the existing canonical implementations rather than copying files over them. There is still one of each:

- header
- footer
- cart drawer
- product card (`card-product`)
- CSS system
- JS system
- settings schema

## New files

| File | Purpose |
|---|---|
| `assets/vennix-storefront.js` | Global behaviours, all built as progressive enhancements. Covers:<br>• wishlist, header count and wishlist grid<br>• toasts and count-up stats<br>• announcement rotation and dismiss<br>• scroll progress, collection load-more, cart gift note and discount<br>• delivery estimate, back-in-stock and background-video pause |
| `assets/vennix-storefront.css` | Styles for the global UI above |
| `assets/vennix-product-extras.js` / `component-vennix-product-extras.css` | Monogram and size finder, plus the product-page styles for delivery estimate, back in stock and wishlist |
| `assets/section-vennix-editorial.css` | Styles for testimonials, journal, lookbook and store pulse |
| `assets/icon-linkedin.svg`, `assets/vennix-favicon.svg` | LinkedIn social icon, and the fallback favicon used when no favicon is set |
| `sections/vennix-store-pulse.liquid` | Stats band. Each value is typed in or read live: product count, collection count or free-shipping threshold |
| `sections/vennix-testimonials.liquid` | Real quotes only. It has no sample reviews and stays hidden until a quote is added |
| `sections/vennix-journal.liquid` | Blog teaser. Falls back to the `news` blog and is hidden when there are no articles |
| `sections/vennix-lookbook.liquid` | Social/UGC grid ("Worn in the wild") that uses the Social media theme settings |
| `sections/vennix-wishlist.liquid` + `templates/page.wishlist.json` | Wishlist page |
| `sections/vennix-product-card.liquid` | Section Rendering endpoint used by the wishlist. It has no preset, so it can't be added in the editor |
| `snippets/vennix-wishlist-button.liquid` | Heart toggle, in icon and labelled styles |
| `snippets/vennix-monogram.liquid` | Monogramming block |
| `snippets/vennix-size-finder.liquid` | "What's my size?" dialog |
| `snippets/vennix-delivery-estimate.liquid` | Business-day delivery window with a same-day cutoff countdown |
| `snippets/vennix-back-in-stock.liquid` | Shopify contact form tagged `back-in-stock` |
| `snippets/vennix-cart-extras.liquid` | Gift message (cart attribute) and discount code |
| `snippets/vennix-collection-jsonld.liquid` | `CollectionPage` + `ItemList` structured data |
| `templates/page.faq.json` | FAQ page using the existing `faq` section, which outputs FAQPage JSON-LD |

## Merged into existing files (not overwritten)

| File | Change |
|---|---|
| `config/settings_schema.json` | New settings:<br>• scroll progress<br>• LinkedIn link<br>• cart gift note and discount code toggles<br>• a **Wishlist** group: enable, card hearts, header icon, wishlist page |
| `locales/en.default.json` | `vennix.*` strings for every new feature, plus `general.social.links.linkedin` |
| `layout/theme.liquid` | Adds:<br>• global CSS and JS<br>• `window.vennixStrings` for translated JS messages<br>• the scroll-progress element<br>• the SVG favicon fallback |
| `sections/header.liquid` | Wishlist icon with count, and LinkedIn in the Organization `sameAs` |
| `snippets/card-product.liquid` | Wishlist heart, plus `badge: <text>` product tags for custom badges (used only when no built-in badge applies) |
| `snippets/social-icons.liquid` | LinkedIn |
| `sections/main-product.liquid` | New blocks: `wishlist`, `size_finder`, `monogram`, `delivery_estimate`, `back_in_stock` |
| `templates/product.json` | Adds those blocks. The delivery estimate starts **disabled** until you set your real shipping window |
| `sections/main-collection-product-grid.liquid` | Pagination type (numbered or load more) and collection JSON-LD |
| `snippets/cart-drawer.liquid`, `sections/main-cart-footer.liquid` | Cart extras |
| `sections/vennix-announcement-bar.liquid` | New options:<br>• layout: inline, or rotate one message at a time<br>• a working rotation speed<br>• optional dismiss<br>• per-message links |
| `sections/vennix-hero.liquid` | Optional Shopify-hosted background video with a pause button. The image stays as the poster and the reduced-motion fallback |
| `sections/vennix-brand-story.liquid` | Up to 4 count-up `stat` blocks |
| `sections/vennix-newsletter.liquid` | Extra customer tag for segmenting sign-ups |
| `sections/contact-form.liquid` | Order-number field, support hours and address |
| `assets/vennix-brand.css` | Removed the rules that hid announcement messages 2 and 3 on mobile. Rotation now shows every message |

## Conflicts resolved

- **Header, footer, cart drawer, product card, and CSS/JS.** The source's single `theme.css`/`theme.js` and its static header, footer and cart drawer were not copied. The existing Dawn and VENNIX versions are more complete (groups, facets, predictive search, quick add, pub/sub cart). The source *behaviours* were rebuilt on top of them.
- **Testimonial sample quotes.** Dropped, because publishing invented reviews misleads shoppers. There are no Review JSON-LD entries for hand-entered quotes.
- **Monogram fee.** The source's `monogram_price` fallback was dropped because it would advertise a fee that is never charged. The architecture is preserved:
  - **Variant mode** is used when the product has a variant whose title contains "monogram". The price is then real and set in Shopify.
  - **Line-item-property mode** is used otherwise.
  - The feature is tag-scoped (default tag `monogram`; leave it blank to offer it on all products).
  - It is safe when unconfigured: the inputs stay disabled until the shopper opts in, and in the editor it shows a hint only.
- **Cart free-shipping threshold.** The existing `free_shipping_threshold` setting, in major units, stays canonical. The source's cents-based duplicate setting was not added.
- **Range default bug.** `motion_duration` defaulted to 560 on a 300–800 range with a step of 50, which is not a valid step and fails Shopify's schema validation. It is now 550 in the newsletter, trust bar and about template.

## Merchant setup

1. **Wishlist.** Go to *Online Store → Pages*, create "Wishlist" with template `page.wishlist`, then select it under *Theme settings → Wishlist*.
2. **Monogramming.** Tag the eligible products `monogram`. For a paid monogram, add a variant option value containing "Monogram" with its price. Otherwise the letters are saved as a line-item property.
3. **Size finder.** Works on products with a `Size` option (option names are configurable). Optional fit notes come from the metafield `custom.fit_notes`.
4. **Delivery estimate.** Enable the block in the product template once you have set your real business-day window and cutoff.
5. **Back in stock.** Requests arrive as contact-form emails tagged `back-in-stock`. Use a restock app if you want automated sends.
6. **Social.** Add TikTok, Instagram, Pinterest and LinkedIn links under *Theme settings → Social media*. The lookbook follow button uses them.
7. **FAQ.** Create a page with template `page.faq` and review the answers against your policies.

## Validation

- `python3 scripts/validate_theme.py`: template JSON, section schemas, settings and asset references.
- Shopify Theme Check (`@shopify/theme-check-node`), run with this repository's `.theme-check.yml`.
