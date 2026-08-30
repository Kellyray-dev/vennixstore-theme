# VennixStore Architecture & Brand Audit

**Repository:** `Kellyray-dev/vennixstore-theme`
**Audit branch:** `arena/01a050e8-vennixstore-theme`
**Audit date:** 2026-08-29
**Reference document:** `README.md` (updated to the new architecture and brand direction)

## Scope

This audit compares the repository's actual code, config, assets, and docs against the refreshed `README.md`. It verifies the **Modern Clothing & Active Essentials** brand direction and the documented architecture.

**Out of scope (intentionally not changed yet):** production data, catalog CSV contents, visual/pixel QA, and any major code refactor. The goal is to confirm the README is accurate and to surface the remaining alignment gaps before code changes begin.

## Method

- Reviewed `README.md`, `layout/theme.liquid`, `config/settings_data.json`, `config/settings_schema.json`, `templates/index.json`, header/footer section JSON, brand CSS, and the custom section/snippet set.
- Validated all 74 JSON files in the repository (config, sections, templates, locales) — **no invalid JSON found**.
- Checked README local file links — **all resolve**.
- Grepped for the retired brand (old green palette, old tagline, multi-category positioning) and for claimed-but-unbuilt features (wishlist, recently viewed).

## Summary

| Category | Status |
|---|---|
| Brand direction (apparel/active) | ✅ Aligned |
| Homepage architecture | ✅ Aligned |
| Design token layer | ✅ Aligned |
| Custom section/snippet set | ✅ Aligned |
| README claims vs code | ⚠️ One claim corrected; remaining cosmetic/doc mismatches |
| Legacy brand leftovers | ⚠️ Present (logo, unused color schemes) |
| Theme metadata / docs branch refs | ⚠️ Minor inconsistency |

---

## What is aligned

### Brand direction
- Homepage hero messaging is dressed for the new brand:
  - Eyebrow: `Modern Clothing & Active Essentials`
  - Heading: `Modern Clothing. Made for Movement.`
  - Copy: `Elevated everyday pieces and active essentials designed for modern life.`
- Footer subtext: `Modern Clothing & Active Essentials. Elevated everyday pieces designed for modern movement and modern life.`
- Catalog guidance in `catalog/CATALOG_RECOMMENDATIONS.md` and `catalog/CATALOG_CLEANUP_REPORT.md` reflects the same focused positioning.
- The old green palette (`#26332f`, `#344b43`, `#536a61`) is **not present** in `assets/vennix-brand.css` or `assets/vennix-brand-2.css`.

### Architecture
- `layout/theme.liquid` loads the style layers in the documented order: `base.css` → `vennix-brand.css` → `vennix-brand-2.css`.
- `assets/vennix-brand-2.css` contains the centralized token set documented in the README:
  - `#1A1A1A` ink, `#C9A96E` gold, `#A6854D` deep gold, `#FAF9F6` cream, `#F0EEEA` warm neutral, `#D8D5CE` line.
  - `Playfair Display` editorial headings and `Inter` body, spacing, radius, and shadow scales.
- `templates/index.json` order matches the README's architecture table exactly:
  `vennix-hero → rich-text → vennix-trust-bar → featured-collection (New Arrivals) → featured-collection (Best Sellers) → image-with-text → collection-list → multicolumn → vennix-newsletter`.
- The documented custom sections exist:
  `vennix-hero`, `vennix-trust-bar`, `vennix-announcement-bar`, `vennix-newsletter`, `vennix-why-us`, `faq`.
- The documented custom snippets exist:
  `vennix-breadcrumb-jsonld`, `vennix-product-metafields`, `vennix-product-assurances`, `vennix-shipping-progress`, `vennix-sticky-atc`.

### Feature claims
- Cart drawer, cart notifications, quick add / bulk quick add, predictive search, product gallery/modal/variant picker, product recommendations, sticky Add to Cart, customer accounts, and localization selectors are all present.
- FAQ section emits `FAQPage` structured data.
- Breadcrumb JSON-LD snippet is present.
- Theme version `2.0.0` matches `config/settings_schema.json` (`theme_version`).

---

## Gaps / discrepancies

Status **P1 = should fix before this branch is considered fully aligned**, **P2 = cosmetic / low risk**.

### P1 — Brand leftovers that contradict the new direction

1. **Logo asset still uses the old brand**
   - `assets/vennix-logo.svg` contains the tagline **`CURATED GOODS`** and the old green strokes `#344B43` / `#536A61`, with background `#E9EDEB`.
   - This directly contradicts the new *Modern Clothing & Active Essentials* positioning. The README points to this file as the brand logo.
   - Fix: replace the logo lockup (wordmark stays `VENNIX`; tagline becomes `MODERN CLOTHING & ACTIVE ESSENTIALS` or is removed; strokes/palette move to charcoal/gold).

2. **Legacy color schemes remain in the store configuration**
   - `config/settings_data.json` still has:
     - `scheme-4`: background `#26332f`, button label `#26332f`, shadow `#0b100e` (old green)
     - `scheme-5`: background `#111927`, button label `#111927`, shadow `#050912` (old dark navy)
   - These are not used by the current homepage, but they are still valid selectable schemes and are referenced as defaults in `config/settings_schema.json` (e.g. `scheme-5` default for some cards).
   - Fix (when the alignment phase begins): remap `scheme-4` and `scheme-5` to charcoal / gold / cream variants, and re-check `settings_schema.json` defaults so merchants never pick an off-brand scheme.

### P2 — Metadata and documentation inconsistencies

3. **Theme metadata is generic**
   - `config/settings_schema.json` `theme_info.theme_name` is `"VennixStore Theme"` and `theme_author` is `"Shopify"` (Dawn default).
   - Recommend `theme_name: "VennixStore — Modern Clothing & Active Essentials"` and `theme_author: "Kelly Ray"` for merchant-facing consistency.

4. **Announcement bar background differs from the brand token**
   - `sections/header-group.json` sets `bg_color: "#20201e"` while the brand token is `#1A1A1A`.
   - Cosmetic; set to `#1A1A1A` or update the README/token docs to explain the intentional near-black value.

5. **Stale branch references in deployment docs**
   - `deliverables/DEPLOYMENT_AND_IMPORT.md` references branch `arena/019ff6c1-vennixstore-theme`.
   - `deliverables/IMPLEMENTATION_REPORT.md` references branch `arena/01a050aa-vennixstore-theme`.
   - Neither reflects the current session branch. Update to either `main` (once merged) or the active work branch to avoid operator confusion.

6. **No wishlist / recently viewed**
   - There is no functional wishlist or recently-viewed feature.
   - `assets/vennix-brand.css` contains orphaned `.vennix-header-wishlist` selectors with no matching Liquid/JS usage.
   - The README no longer claims these features; the dead CSS should be removed or converted into a real feature in the alignment phase.

7. **`release-notes.md` is upstream Dawn heritage**
   - It describes Dawn storefront events / product disclosures, not the VennixStore realignment work.
   - Optional: fold in brand-realignment release notes when the next code pass lands.

8. **`MISSING_FEATURES_ANALYSIS.md` is stale**
   - States FAQ is missing, but `sections/faq.liquid` exists.
   - Recommend a re-audit or a note that the analysis predates the FAQ implementation.

### Fixed during this audit

9. **Theme upload validation failure in `templates/index.json`**
   - Shopify rejected the upload with: *`Setting 'text' is invalid. All top level nodes must be '<p>', '<ul>', '<ol>' or '<h1>'-'<h6>' tags`* (23 items selected, 1 failed).
   - Root cause: the `multicolumn` blocks used for the homepage `social_proof` section are `richtext` settings, but their `text` values were plain strings (e.g. `Clean silhouettes...`).
   - Fix: wrapped the three `text` values in `<p>…</p>` within `templates/index.json`.
   - Verified: all 31 template JSON files now pass the rich-text top-level-node check, and all 74 JSON files still parse.

---

## Aligned with the README — no action needed

- Homepage section order and types
- Stylesheet load order and central design-token file
- Custom Vennix section set
- Custom Vennix snippet set
- FAQ structured data
- Breadcrumb JSON-LD
- Theme version `2.0.0`
- Catalog / docs / deliverables breakdown
- No Node build step

---

## Recommended next steps (before major code changes)

1. **Fix P1 brand leftovers** in a small, isolated PR:
   - Update `assets/vennix-logo.svg`.
   - Remap legacy `scheme-4` / `scheme-5` colors and audit `settings_schema.json` defaults.
2. **Reconcile docs/metadata (P2)** in the same pass or a docs-only PR:
   - `settings_schema.json` theme info
   - announcement bar background
   - deployment/implementation branch refs
   - remove orphaned wishlist CSS or implement wishlist separately
3. **Re-run this audit** after the alignment pass and before starting feature work.
4. **Verify Theme Check** in CI/sandbox (`shopify theme check`) — not verifiable in this audit environment because the Shopify CLI is not installed here.
