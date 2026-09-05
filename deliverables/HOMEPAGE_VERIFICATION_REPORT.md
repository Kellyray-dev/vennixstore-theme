# VennixStore Homepage Overhaul — Verification & Fix Report

**Branch:** `arena/01a0554b-vennixstore-theme`
**Scope:** Verify the homepage UX overhaul (commit `2445c01` / `29a241c`) is correct, Shopify-native, and complete; fix what was broken. No redesign.
**Tooling used:** Shopify CLI 4.7.0 → `shopify theme check` (installed via `npm i -g @shopify/cli`; no Ruby/`theme-check` gem or VS Code extension available in the sandbox). All JSON/template wiring validated with a custom parser plus `jq`.

---

## 1. What was verified

### Theme Check (tools path chosen: official Shopify CLI `theme check`)
- **Changed files: 0 offenses** (errors or warnings) after the fixes below.
- The theme as a whole still reports 15 errors + 5 warnings, **all in pre-existing files untouched by the overhaul** (`faq.liquid`, `main-404.liquid`, `collection-hero.liquid`, `main-product.liquid`, `main-search.liquid`, `main-article.liquid`, `main-list-collections.liquid`). Recommended as a follow-up, not part of this pass.

### JSON + template wiring (task 2)
- Every `templates/**/*.json`, `sections/*.json`, `config/*.json`, `locales/*.json` parses cleanly.
- Every section `type` in `templates/index.json` and the header group resolves to a real `sections/<type>.liquid` (`vennix-hero`, `vennix-trust-bar`, `vennix-category-grid`, `featured-collection`, `vennix-brand-story`, `vennix-newsletter`, `vennix-announcement-bar` ✓).
- Every block type and every setting key in the template JSON is declared in the matching section schema. (The only flagged item was a legitimate Shopify App block `shopify://apps/metafields-guru/…` on `product.json` — legal.)
- Homepage flow matches the brief top → bottom: announcement bar (header group) → hero → trust bar (3 badges) → category grid (3 tiles) → "New in Apparel" featured collection → brand story → newsletter.
- No "Lifestyle & Tech" section and no "Tech & Accessories" tile; tech terms appear **only** inside the featured-collection exclusion filter.

### Liquid correctness (task 3)
- All changed sections balance their tags; `{% schema %}` blocks are valid JSON; only supported Shopify objects/filters used. Theme Check parses every file without syntax errors.
- Category-grid fallback chain is coherent: **custom image → collection featured image → bundled asset (`image_asset`) → built-in placeholder**, with title/link falling back to the collection object and finally `all_products_collection_url`. Manual overrides correctly win (matches the schema info: custom image "overrides the collection image"); everything is Theme-Editor configurable; no collection/social URL is hardcoded where a setting/object exists.

### Curation logic (task 4 — inspected + unit-tested)
Simulated the exact loop for include/exclude/none, duplicates, and limits:
- No product renders twice; index `templates/index.json` renders each product exactly once (static grid, sliders off: `enable_desktop_slider: false`, `swipe_on_mobile: false`).
- Exclude mode removes tech; include mode still exists but is not used on the homepage.
- Empty-filter (`has_filter = false`) and no-match cases behave (placeholders render when 0 products, no Liquid errors).
- Pagination (`paginate … by 50`) + `break` at `products_to_show` renders exactly N unique products and never increments the slider counter out of range (slider is disabled on the homepage anyway); the "View all" link renders when the collection has more than `products_to_show` items.
- **Bug found & fixed:** the original de-duplication used substring `contains` on a comma list, so a handle like `tee` was wrongly dropped after rendering `white-tee` (any handle that ends with another handle). Replaced with comma-wrapped exact-token matching.

### Cards & CSS (task 5)
- Product cards: equal-height wrapper, `card__content` as flex column, `quick-add` pinned with `margin-top: auto` — 1- and 2-line titles keep price/CTA bottom-aligned.
- Sale prices: red `#d32f2f` + bold, regular price grey `#808080` strikethrough (scoped to `.price--on-sale`).
- Title clamp: 2-line `-webkit-line-clamp` on card headings only.
- **Bug found & fixed:** the static-grid overrides used `.collection .product-grid`, which also matches the **collection page and search results** — this silently overrode the merchant's column settings (e.g., 2-col layout rendered as 4). Scoped to `.featured-collection-grid`.
- Badges: the duplicate `card__badge` block was genuinely duplicated (media-inner vs info block); keeping the single badge inside `card__inner` is correct and it renders for all cards. `aria-labelledby` references were updated to `NoMediaStandardBadge-…`, which matches the only remaining badge IDs. The invalid `block.settings.description` reference is gone.

### Dynamic data (task 6)
- Category tiles use a native collection picker; image/title/link fall back to the collection object, then to bundled assets (`womens-fashion.jpg`, `mens-fashion.jpg`, `active-essentials.jpg` — all present in `assets/`). Brand story fallback (`activewear.jpg`) also present.

### Responsive & a11y (task 7)
- Breakpoints honored: `max-width: 749px` (2-col product grid, 1-col category tiles, 16/11 tile ratio), `750–989px` (3-col), `min-width: 990px` (4-col, 2-col story split, 5/6 story ratio).
- Heading order is clean: one `h1` (hero), then `h2` (categories, featured collection, brand story, newsletter), `h3` (tile titles). Trust bar has no headings.
- Semantic elements, `aria-label`s, alt text, `loading="lazy"`, and responsive `srcset` are present; hero/announcement/CTA contrast relies on the existing brand tokens.

---

## 2. Files changed in this pass (one-line reason each)

| File | Change |
|---|---|
| `sections/featured-collection.liquid` | Initialize `rendered_handles` (fixes 2 Theme Check `UndefinedObject` warnings) and switch de-duplication to comma-wrapped exact-token matching so substring handles can never collide; added `featured-collection-grid` scope class to the grid `<ul>`. |
| `assets/vennix-brand-2.css` | Scoped the static-grid overrides (columns, item widths, slider-neutralizers) from `.collection .product-grid` to `.featured-collection-grid` so collection/search/cart pages keep their own settings. |
| `sections/vennix-brand-story.liquid` | Emit `aria-labelledby` only when the heading is rendered, so the reference can never dangle. |

No redesign, no new sections, no changes to navigation or catalog.

---

## 3. Could NOT verify

- **Live storefront rendering / visual QA** — no Shopify dev store or credentials in this environment; `shopify theme dev` was intentionally not run (not authorized). Verification is via Theme Check + static analysis + logic unit tests.
- **Real collection images / product data** — the store's actual collections, metafields, and reviews are not accessible from here; fallback assets were confirmed to exist in the theme.
- **Theme Editor behavior** — settings were validated against schemas, but interactive Editor QA requires a store.

---

## 4. Manual steps for the merchant (Theme Editor)

1. **Category tiles** → add the section, then for each of the 3 tiles pick a real collection (Women's Activewear, Men's Essentials, Active Essentials). The collection drives image/title/link; set a custom image only to override. If left unset, bundled assets (`womens-fashion.jpg`, `mens-fashion.jpg`, `active-essentials.jpg`) are shown.
2. **New in Apparel** → currently points to `all`. Point it at your apparel collection for the exclusion filter to make sense; keep `filter: exclude` with the tech terms.
3. **Brand story image** → select a store image or keep `activewear.jpg`; button links are configurable.
4. **Announcement bar** copy/colors are in the header group (single message, dark bar) — adjust timing or color if preferred.
5. Note: the homepage product grid is intentionally a fixed 4/3/2 static grid per the brief; setting `columns_desktop` to 3 is honored, other column settings on this section are overridden by the brand layer.

---

## 5. Follow-ups (out of scope, recommended)

- Fix the 15 Theme Check errors in `sections/faq.liquid` (missing `locales/en.default.schema.json` entries) and `sections/main-404.liquid`, plus the 5 pre-existing warnings — these are pre-existing on `main` and unrelated to the homepage overhaul.
