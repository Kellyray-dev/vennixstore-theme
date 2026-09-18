# VennixStore — Theme Audit & Product Rail Implementation

**Date:** 2026-09-11
**Branch:** `arena/01a09384-vennixstore-theme`
**Base commit:** `755b570`

---

## 1. How this audit was run

| Check | Tool | Result |
|---|---|---|
| Liquid / JSON lint | `@shopify/theme-check-node` 3.29.0 (same engine as `shopify theme check`), driven by the repo's own `.theme-check.yml` | 4 offenses, all pre-existing |
| Structural consistency | `scripts/validate_theme.py` (new) | 0 problems |
| JS behaviour | 50-assertion jsdom suite against the shipped `assets/vennix-product-rail.js` | all pass |
| CSS | `css-tree` parse of new + touched stylesheets | 0 parse errors |
| Translation keys | 371 `| t` keys cross-checked against `locales/en.default.json` | 0 missing |

Ruby is not installed in this sandbox, so the canonical `shopify theme check` binary could not
run. The Node port executes the same check implementations against the same
`.theme-check.yml`, which is why the offense list is directly comparable.

**Baseline offenses (unchanged by this work):**

```
LiquidComplexity  snippets/card-product.liquid:617   complexity 132 (max 120)
LiquidComplexity  sections/main-product.liquid:834   complexity 124 (max 120)
LiquidComplexity  snippets/facets.liquid:865         complexity 136 (max 120)
UndefinedObject   sections/main-product.liquid:695   Unknown object 'continue'
```

The three `LiquidComplexity` hits are Dawn base files at severity *suggestion*; refactoring
them is real work with real regression risk on the PDP and collection filters, so they are
left as tracked debt rather than touched. The `UndefinedObject` hit is a **false positive**:
`offset: continue` on line 695 is valid Shopify Liquid inside the complementary-products
`for` loop.

---

## 2. Bugs found and fixed

### 2.1 `.gitignore` was wrapped in Markdown code fences

The file began and ended with a literal ` ``` ` line — a Markdown fence committed by accident.
Git treated both as filename patterns. Harmless in effect, but it meant the file was never
reviewed as a real ignore list. Removed.

### 2.2 Two settings were referenced but never defined

A scan of every `settings.<id>` in Liquid against `config/settings_schema.json` found two
orphans:

| Location | Reference | Effect |
|---|---|---|
| `layout/theme.liquid:220`, `layout/password.liquid:82` | `--media-padding: {{ settings.media_padding }}px;` | Emitted the invalid declaration `--media-padding: px;`. The custom property is consumed **nowhere** in any stylesheet (verified by grep), so it was dead output on every page. Removed. |
| `templates/gift_card.liquid:10` | `<meta name="theme-color" content="{{ settings.color_background }}">` | `color_background` was replaced by color schemes long ago, so every gift card shipped `content=""` — an empty `theme-color`, which means no browser-chrome tinting on iOS Safari / Chrome Android. Now reads `settings.color_schemes.first.settings.background` with a `#1A1A1A` fallback. |

### 2.3 `MISSING_FEATURES_ANALYSIS.md` list numbering

The V2 roadmap jumped `6 → 8 → 8 → 9`. Renumbered to a clean `1..9`.

### 2.4 No CI at all

`.github/` contained issue templates, a PR template and a Dependabot config watching the
`github-actions` ecosystem — **with no `.github/workflows/` directory**, so there was nothing
for Dependabot to update and nothing verifying a push.

A `Theme Check` workflow was written and committed, but the push was **rejected by GitHub**:

```
! [remote rejected] (refusing to allow a GitHub App to create or update workflow
  `.github/workflows/theme-check.yml` without `workflows` permission)
```

The GitHub App backing this session has no `workflows` permission, which is a repo-level
setting only an admin can change. The workflow therefore ships at **`ci/theme-check.workflow.yml`**
instead, fully written and ready. To activate it, either grant the App the `workflows`
permission, or run:

```bash
mkdir -p .github/workflows && git mv ci/theme-check.workflow.yml .github/workflows/theme-check.yml
```

It runs theme-check, Liquid formatting, and the new structural validator on every push and PR,
using `--fail-level error` so the three pre-existing `LiquidComplexity` *suggestions* stay
advisory and the pipeline is green from day one. **Until it is moved, nothing is enforcing any
of this** — treat it as an open action, not a completed one.

---

## 3. Optimisation opportunities (reported, not applied)

These need a merchant decision, so they are documented rather than actioned.

### 3.1 ~357 KB of unreferenced assets

`assets/` is 3.0 MB across 210 files. Three are referenced by nothing in the repo:

| Asset | Size |
|---|---|
| `assets/vennix-hero-editorial.jpg` | 212 KB |
| `assets/lookbook.jpg` | 180 KB |
| `assets/component-progress-bar.css` | 0.6 KB |

`component-progress-bar.css` is safe to delete: `snippets/progress-bar.liquid` renders the
markup, but the matching styles already live in `assets/base.css:3586-3607`, so the standalone
file is a Dawn duplicate that is never loaded.

The two JPGs are **not** deleted here: `lookbook.jpg` is plausibly staged for the "Lookbook /
shoppable imagery" item on the V2 roadmap, and `vennix-hero-editorial.jpg` for the editorial
hero. If neither is planned, remove them with:

```bash
git rm assets/vennix-hero-editorial.jpg assets/lookbook.jpg assets/component-progress-bar.css
```

Shopify's asset limit is 10 MB per theme, so this is headroom, not an emergency.

The 44 unreferenced `icon-*.svg` files reported by a naive scan are **not** dead —
`snippets/icon-accordion.liquid:2` builds filenames at runtime
(`icon | prepend: 'icon-' | append: '.svg'`), so they resolve from block settings and a
static scan cannot see them.

### 3.2 Theme-editor schema translations

31 storefront locales are shipped; 20 have a matching `*.schema.json`. Missing for:
`bg, el, hr, hu, id, lt, ro, ru, sk, sl, vi`. Storefront strings are translated in those
languages — only the **Theme Editor UI** falls back to English. This matches upstream Dawn's
coverage, so it is a nice-to-have, not a defect.

---

## 4. Slide-style product showcase — what was needed and what was built

Three surfaces were requested. All three are now covered.

### 4.1 Store-wide left rail — **new**

`sections/vennix-product-rail.liquid`, added to `sections/header-group.json` so it renders on
every storefront template. A fixed edge tab sits on the left; clicking it slides an off-canvas
panel in from the left with a vertical, scroll-snapping product rail.

It is a **section in a section group**, not hard-coded markup in `theme.liquid`, so merchants
configure and disable it from the Theme Editor like any other section.

### 4.2 Homepage showcase — **new**

`sections/vennix-product-showcase.liquid`, inserted into `templates/index.json` between the
trust bar and the category grid. Two columns: the slide rail on the **left**, editorial copy,
selling-point blocks and CTAs on the right.

### 4.3 Product page left gallery — **already present, no code needed**

This one turned out to be shipped already. `templates/product.json` sets:

```json
"media_position": "left",
"gallery_layout": "thumbnail_slider",
"mobile_thumbnails": "show",
"media_size": "large"
```

`assets/section-main-product.css` styles `.product--thumbnail_slider` (lines 424, 992, 1012)
and `sections/main-product.liquid` loads both that stylesheet (line 21) and `media-gallery.js`
(line 861). So the PDP already has a left-docked, slide-style media gallery. Nothing was added;
building a second one would have duplicated working code.

### 4.4 Files added

| File | Purpose |
|---|---|
| `sections/vennix-product-rail.liquid` | Store-wide off-canvas rail |
| `sections/vennix-product-showcase.liquid` | Homepage two-column showcase |
| `assets/vennix-product-rail.js` | `<vennix-rail-slider>` + `<vennix-product-rail>` |
| `assets/component-vennix-rail.css` | Shared rail primitives + panel |
| `assets/component-vennix-showcase.css` | Two-column showcase layout |
| `assets/dark-mode.css` | Dark-mode overrides appended (13 new rules) |

### 4.5 Product source — and a correction worth flagging

The requested source was "best sellers, automatic". **The obvious implementation is broken and
was caught before it shipped.**

`{{ collection.products | sort: 'best-selling' }}` looks right and appears in plenty of blog
posts, but it is a silent no-op. The [official `sort` filter docs](https://shopify.dev/docs/api/liquid/filters/sort)
state: *"You can sort by any property of the object that you're sorting."* Products expose
`price`, `title`, `created_at`, `vendor`, `published_at` — there is no units-sold property, so
`'best-selling'` matches nothing and the array comes back in its original order.

Shopify surfaces best-selling order through **the collection's own sort order** instead. Both
sections therefore default to `sort_by: collection_default`, which leaves the collection's
admin order intact, and offer only sort keys the filter can actually honour
(`price`, `price-descending`, `title`, `created_at`).

**Action required for true best-seller ordering:** in the Shopify admin, open
**Collections → [your collection] → Sort order** and choose **Best selling**. The rail and the
showcase then serve best sellers with no further change. Left on `All products`, the order is
whatever the store's default collection sort is.

Both sections also carry the repo's existing brand-alignment filter (`product_filter` /
`filter_terms`, matching `sections/featured-collection.liquid`), pre-seeded with the same
exclusion list used by the homepage "New in Apparel" block, so off-brand tech accessories
cannot surface in a merchandising slot.

### 4.6 Design decisions

**Mobile.** The docked rail is hidden below 750px. A left off-canvas panel would compete with
the menu drawer and the cart drawer on a narrow screen, and the same products stay reachable
through the homepage showcase, which flips its rail from vertical to a horizontal swipe strip
at the same breakpoint. The axis is declared in markup (`data-rail-axis` /
`data-rail-axis-mobile`) and re-read on the breakpoint's `change` event.

**Accessibility.** The panel is `role="dialog"` + `aria-modal`, `inert` and `aria-hidden` while
closed, focus is trapped on open and returned to the opener on close, Escape and overlay-click
close it, and the body scroll lock reuses Dawn's `overflow-hidden` class. The counter is
`aria-live="polite"`; dots carry `aria-current`; buttons are `disabled` at the ends rather than
hidden, so the control count never shifts.

**Dark mode.** All surfaces ride the `--v-*` tokens remapped in `assets/dark-mode.css`, with one
necessary exception: the edge tab pairs `--v-ink` as a *fill* with `--v-white` as text, and
`--v-ink` flips to off-white in dark mode. Without an explicit override the tab would have been
white-on-white. Overrides added.

**Reduced motion.** Transitions collapse to `0.01ms`, scroll snapping uses `behavior: 'auto'`,
and auto-open is skipped entirely.

**Performance.** Images are `loading="lazy"`; product card styles are emitted once
(`skip_card_product_styles`); CSS and JS load only when the rail is enabled. The rail renders
server-side rather than lazy-fetching through the Section Rendering API so that it works with
JavaScript disabled and previews correctly in the Theme Editor — the trade-off is that the
collection is read on every page load, which is why the collection setting exists and the scan
window is capped at the 50-product paginate maximum.

---

## 5. Verification performed

```
$ theme-check (Node port, repo .theme-check.yml)
TOTAL OFFENSES: 4 across 2 checks      # identical to the pre-change baseline

$ python3 scripts/validate_theme.py
OK — template JSON, section schemas, settings and asset references are consistent.

$ node test-rail.js        # jsdom, against the shipped assets/vennix-product-rail.js
ALL TESTS PASSED           # 50 assertions
```

The validator was itself verified by injecting four faults — an unknown section setting, an
out-of-enum select value, a missing asset reference, and an undefined global setting — and
confirming it reported all four and exited 1. The faults were then reverted.

The jsdom suite executes the real file, not a copy. Because jsdom has no layout engine,
`offsetTop` / `offsetLeft` and `scrollTo` are stubbed with the values a browser would produce;
everything asserted (`offsets`, `nearestIndex`, `step`, `goTo`, `render`, `open`, `close`,
`setHidden`, the axis getter) is the shipped code path.

Two real bugs were found and fixed during testing:

1. `transitionend` **bubbles**, so a listener on the rail also fired for hover transitions on
   buttons *inside* the panel — closing it would have un-focused and hidden the panel
   mid-animation. Now guarded with `event.target === this`.
2. No `transitionend` fires at all when the panel is `display: none` (below 750px), which would
   have left it focusable. A 500 ms timer now acts as the fallback. Both paths are asserted.

**Not verified:** nothing here was rendered against a live Shopify store. Liquid output, the
`card-product` render inside the rail, and real visual layout need a
`shopify theme dev` / preview-deploy pass. The Liquid is syntax- and reference-clean per
theme-check, but only a live store can confirm the rendered HTML.

---

## 6. Open items

| Priority | Item |
|---|---|
| High | Set the source collection's admin sort order to **Best selling** (§4.5) |
| High | Run a `shopify theme dev` preview pass on a store with real products |
| High | Activate the CI workflow: `git mv ci/theme-check.workflow.yml .github/workflows/theme-check.yml` (§2.4) |
| Medium | Decide on the ~357 KB of unreferenced assets (§3.1) |
| Medium | Wishlist / recently viewed / compare / back-in-stock still open — see `MISSING_FEATURES_ANALYSIS.md` |
| Low | Refactor the three `LiquidComplexity` Dawn files |
| Low | Add `*.schema.json` for the 11 remaining locales |
