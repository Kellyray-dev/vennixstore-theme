# Prompt for Google Antigravity (VSCode) — VennixStore Homepage Overhaul: Verify & Finish

> Copy everything in the fenced block below into the Antigravity chat in VSCode,
> with this repository folder open as the workspace root.

````markdown
You are working inside the repository **`vennixstore-theme`** — a Shopify
Online Store 2.0 theme built on **Dawn** with a custom VennixStore brand layer.
The workspace root is the theme folder (it contains `assets/`, `sections/`,
`snippets/`, `templates/`, `config/`, `layout/`).

Act as a senior Shopify theme developer. A previous pass implemented a homepage
UX overhaul. Your job is to **verify it is correct, Shopify-native, and complete,
then fix anything broken** — not to redesign it. Make changes in-place and report
exactly what you changed and why.

## Brand & guardrails (treat as hard constraints)
- Brand: **VENNIXSTORE — Modern Clothing & Active Essentials.** Minimal, modern,
  premium, editorial, functional (Gymshark/Aritzia feel).
- **Apparel only.** Do NOT reintroduce Tech/Home/general-store positioning.
  Tech products may stay in the catalog/admin but must NOT be promoted on the
  homepage. The only place tech terms (`tech, usb, humidifier, case, gadget,
  electronics, phone, cable, charger, trimmer, clipper`) may appear is in the
  **exclusion** filter of the apparel feed.
- Preserve OS 2.0 compatibility: JSON templates, sections with valid
  `{% schema %}`, presets/blocks/settings, color schemes, Theme-Editor
  configurability. No locked/hardcoded markup where a Shopify setting works.
- Prefer reusable sections/snippets and Shopify-native objects/filters.
- Maintain accessibility (semantic landmarks/headings, aria labels, alt text,
  focus states), responsiveness (desktop 4-col grids → mobile 2-col; category
  tiles 3 → 1), and performance (lazy images, responsive srcset, no heavy JS).
- Do NOT delete products, publish a theme, or change the primary navigation.
- Don't claim something works you couldn't verify. If you can't render the live
  storefront, say so and verify via static analysis instead.

## What the homepage must be (templates/index.json, top → bottom)
1. Announcement bar (`sections/header-group.json` → `vennix-announcement-bar`):
   solid dark bar, white text, single message
   "Free Shipping on Orders Over $50 | 30-Day Easy Returns".
2. `vennix-hero` — H1 "Modern Clothing. Made for Movement.", subtext
   "Elevated everyday pieces and active essentials designed for modern life.",
   CTA "Shop Active Essentials".
3. `vennix-trust-bar` — exactly 3 badges: Free shipping over $50 / 30-day
   returns / Secure checkout.
4. `vennix-category-grid` — 3 image tiles: Women's Activewear, Men's
   Essentials, Active Essentials. Hover zoom (scale 1.05). Each tile has a
   native **collection picker** that drives image/title/link dynamically, with
   manual overrides + bundled-asset fallback.
5. `featured-collection` ("New in Apparel") — static CSS grid (4 desktop /
   3 tablet / 2 mobile), **no carousel duplication**, every product rendered
   exactly once, tag-filtered to **exclude** tech.
6. `vennix-brand-story` — 50/50 image-left/text-right split, heading
   "Why VennixStore", CTA "Shop Active Wear".
7. `vennix-newsletter` — heading "STAY UPDATED", email input + "SUBSCRIBE".

There must be NO "Lifestyle & Tech" section and NO "Tech & Accessories" tile.

## Files already changed in the previous pass (review these first)
- `templates/index.json` — rebuilt homepage flow (apparel-only).
- `sections/header-group.json` — announcement bar copy.
- `sections/vennix-category-grid.liquid` — NEW bespoke section (3 tiles,
  collection picker, hover zoom).
- `sections/vennix-brand-story.liquid` — NEW bespoke 50/50 split section.
- `sections/featured-collection.liquid` — added tag include/exclude filter
  settings + handle de-duplication + deeper pagination; renders static grid.
- `snippets/card-product.liquid` — removed duplicate badge/heading markup and
  an invalid `block.settings.description` reference; uniform card structure.
- `assets/vennix-brand-2.css` — appended premium overrides: section whitespace,
  nav dropdown shadow, static product grid, equal-height cards with bottom-pinned
  CHOOSE OPTIONS / ADD TO CART, 2-line clamped titles, sale price styling
  (strikethrough `#808080`, sale `#d32f2f` bold), category hover zoom.

## Your tasks (do all, in order)
1. **Tooling.** Check for `shopify` CLI (`shopify version`) and `theme-check`
   (`theme-check --version` or `bundle exec theme-check`). If available, run
   Theme Check on the theme and fix every error/warning in the changed files
   (Liquid syntax, missing translations, unknown tags/filters, JSON validity,
   accessibility). If not installed, install the Theme Check VS Code extension /
   `npm i -g @shopify/theme-check-node` or fall back to careful manual review;
   report which path you used.
2. **Validate JSON.** Parse every `templates/**/*.json`, `sections/*.json`,
   `config/*.json`. Confirm every section `type` in `templates/index.json`
   resolves to a real `sections/<type>.liquid` file, and every block type is
   declared in that section's schema.
3. **Validate Liquid.** Ensure the changed sections/snippets have balanced
   tags (`if/for/paginate/schema/style/form/capture`), valid `{% schema %}` JSON,
   and only Shopify-supported objects/filters. Pay special attention to the
   filter loop in `featured-collection.liquid` (the `rendered_handles`
   de-duplication, `continue`/`break`, and the `product_filter`/`filter_terms`
   settings) and the collection-picker fallback chain in
   `vennix-category-grid.liquid`.
4. **Verify the curation logic by inspection/unit test.** Confirm:
   - No product can render twice (handle tracking).
   - Exclude mode hides tech terms from "New in Apparel"; include mode still
     exists for future use but is NOT used on the homepage.
   - Empty-filter or empty-collection cases still render placeholders without errors.
   - Pagination (`by 50`) plus `break` at `products_to_show` doesn't break the
     "View all" link or slider counter.
5. **Cards & CSS.** Confirm product cards have equal height, the price/quick-add
   button stays bottom-aligned for 1- and 2-line titles, sale prices show
   red + strikethrough, and the static grid overrides don't accidentally affect
   collection cards, search, or cart. Check that `card-product.liquid` badge
   logic (sale/sold-out/prestige) and `aria-labelledby` references still point at
   element IDs that exist.
6. **Dynamic data.** In `vennix-category-grid.liquid`, confirm collection
   image → custom image → bundled asset fallback order and title/link fallback
   order are correct and Theme-Editor-configurable. Make sure no collection or
   social URL is hardcoded when a setting/object is available.
7. **Responsive & a11y spot-check.** Verify the new sections' markup and CSS use
   semantic elements, heading order (one h1, then h2s), alt text, visible focus,
   and the mobile breakpoints (`max-width: 749px`, `750–989px`, `min-width:990px`).
8. **Local preview (only if Shopify CLI is available and the user authorizes it).**
   Do NOT publish. You may run `shopify theme dev` against a dev store if
   credentials exist; otherwise skip and say so.

## Definition of done
- Theme Check reports no errors in the changed files (warnings either fixed or
  explicitly justified).
- `templates/index.json` matches the 7-section apparel-only flow above.
- No tech positioning on the homepage; no duplicated products; grids are static.
- All new sections are Theme-Editor configurable and use dynamic Shopify data
  where possible.
- You provide a concise report: what you verified, every file you changed with a
  one-line reason, anything you could NOT verify (e.g., live storefront), and any
  manual steps the merchant must do in the Theme Editor (e.g., map the three
  category tiles and the apparel collection to real collections).

Begin by listing the relevant files and running your validation tooling, then
work through the tasks. Show diffs for every change.
````
