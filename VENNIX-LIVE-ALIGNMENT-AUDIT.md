# Live Store Alignment Audit

Audit date: 2026-09-04/05 UTC boundary  
Storefront audited: [vennixstore.com](https://vennixstore.com/)  
Repository: `Kellyray-dev/vennixstore-theme`  
Repository branch: `arena/01a05157-vennixstore-theme`

# LIVE STORE ACCESS STATUS

## Access level

**PARTIAL — PUBLIC STOREFRONT ACCESS ONLY**

The public storefront was reachable and inspected through storefront pages and public Shopify JSON endpoints. No Shopify Admin session, Shopify CLI development connection, API token, theme ID, or authorized private store connection was available in the local environment.

## Verified live

- The public homepage is reachable and titled `Vennix`.
- The storefront renders a skip link, announcement region, mobile menu control, Vennix brand link, search control, theme/display controls, cart control, hero imagery, and a chat control.
- The live announcement states: `Free Shipping on Orders Over $50 | 30-Day Easy Returns`.
- The live cart endpoint (`/cart.js`) is reachable and reports an empty USD cart.
- Public product JSON is reachable at `/products.json`; the live catalog is not empty.
- Public collection JSON is reachable at `/collections.json`.
- Public search suggestions are reachable and return product results.
- The public `Apparel` collection reports 33 products.
- The public `Fitness & Active` collection reports 1 product.
- The public `Men's Clothing` collection reports 26 products.
- The public `Women's Clothing` collection reports 42 products.
- Other public collections include men's outerwear, men's pants, men's suits/formalwear, men's tops, women's clothing, women's clothing/accessories, and the Shopify home-page collection.
- The public refund policy is reachable and states a 30-day return request window, support contact at `support@vennixstore.com`, and a refund target of 10 business days after approval.
- `/pages/contact`, `/pages/about`, and `/policies/shipping-policy` did not provide usable public content at the tested URLs; the latter two tested paths returned 404 responses or only a minimal page response.

## Not verified

The following require Shopify Admin or an authorized Shopify development connection:

- Which theme ID and theme version are currently published.
- The published theme's source files, settings export, JSON templates, section settings, snippets, assets, locales, app embeds, and app blocks.
- Whether the published theme is the same code as this repository branch, `main`, another branch, or an unrelated theme.
- Admin product types, product categories, tags, inventory configuration, product metafields, and unpublished products.
- Automated collection rules and the complete Admin collection configuration.
- Navigation menu handles, menu hierarchy, mega-menu assignments, and link targets as configured in Admin.
- Theme settings values, market settings, localization configuration, redirects, shipping profiles, and checkout configuration.
- App configuration, customer-account settings, chat provider configuration, analytics, pixels, and other Admin-managed storefront behavior.

# Live Store vs Current GitHub Repository

## Theme version and files

**UNVERIFIED — SHOPIFY ACCESS REQUIRED**

The repository contains a Dawn-derived Online Store 2.0 theme with Vennix custom sections and snippets. The public storefront visibly uses Vennix branding and apparel-oriented presentation, but rendered public HTML cannot establish the published theme ID, exact theme version, or source-file equality. No repository-to-published-theme checksum or export comparison was possible.

The repository branch is `arena/01a05157-vennixstore-theme` at commit `2445c01`; it is not evidence that this commit is published.

## Settings and templates

**CODE-VERIFIED ONLY:** The repository has `config/settings_schema.json`, `config/settings_data.json`, JSON templates, section groups, Vennix homepage sections, product/collection/cart/search templates, and Dawn-style account templates.

**UNVERIFIED — SHOPIFY ACCESS REQUIRED:** Live setting values, live homepage section configuration, active template assignments, market-specific templates, app blocks, and whether the published theme contains the same template files.

## Products and catalog

**VERIFIED LIVE:** Public endpoints expose products and collections. The live catalog includes apparel and active-oriented collections, with the collection counts listed above.

**CODE-VERIFIED ONLY:** The repository supports product cards, vendor display, sale/sold-out badges, quick add, variants, product metafields, related products, sticky add-to-cart, and free-shipping messaging.

**UNVERIFIED — SHOPIFY ACCESS REQUIRED:** Admin product types, categories, tags, product metafields and definitions, inventory, variants not exposed publicly, automated collection rules, merchandising order, drafts, archived products, and the full catalog export.

## Navigation and collections

**VERIFIED LIVE:** Public storefront navigation controls and collection routes render; collection JSON exposes the public collection inventory and handles.

**CODE-VERIFIED ONLY:** The repository implements header groups, dropdown menus, mega-menu snippets, mobile drawer navigation, predictive search, and collection facets.

**UNVERIFIED — SHOPIFY ACCESS REQUIRED:** Admin menu structure, menu assignments, mega-menu content, collection rule definitions, hidden collections, and market-specific navigation.

## Policies and shipping messaging

**VERIFIED LIVE:** The homepage publicly displays free shipping over $50 and 30-day easy returns. The refund policy is publicly available and describes return conditions and support contact.

**CODE-VERIFIED ONLY:** The repository contains configurable free-shipping threshold/progress logic, product assurances, refund-policy links, and shipping-progress translations.

**UNVERIFIED — SHOPIFY ACCESS REQUIRED:** Shipping profiles/rates, market-specific thresholds, delivery promises, policy configuration in Admin, and whether the repository threshold exactly matches the published theme setting.

# Required Storefront Checks

| Surface | Status | Evidence or limitation |
| --- | --- | --- |
| Homepage | VERIFIED LIVE | Public homepage loaded; Vennix branding, announcement, hero, header controls, and chat control rendered. |
| Header | VERIFIED LIVE | Skip link, menu, logo/brand link, search, display controls, and cart control rendered publicly. |
| Navigation | PARTIALLY VERIFIED LIVE | Controls render; Admin menu hierarchy and mega-menu data remain unverified. |
| Collections | VERIFIED LIVE | Public collection index and collection JSON loaded; several apparel collections and product counts are exposed. |
| Product page | UNVERIFIED — SHOPIFY ACCESS REQUIRED | Public catalog exists, but a product-page route was not selected for this audit and published theme equality cannot be established. |
| Search | VERIFIED LIVE | Search route and public predictive-search endpoint returned live responses. |
| Cart | VERIFIED LIVE | `/cart.js` returned a valid empty USD cart; add-to-cart and checkout behavior were not exercised. |
| Mobile layout | PARTIALLY VERIFIED LIVE | Public browser viewport rendered the mobile header/menu/hero layout; full responsive journey was not completed. |
| Desktop layout | UNVERIFIED — SHOPIFY ACCESS REQUIRED | No authenticated preview or controlled desktop comparison was available. |
| Shipping messaging | VERIFIED LIVE | Homepage announcement displays the `$50` threshold. Actual rates/profiles remain Admin-only. |
| Policy links | PARTIALLY VERIFIED LIVE | Refund policy loaded; tested shipping-policy path returned 404. |
| Contact information | PARTIALLY VERIFIED LIVE | Refund policy exposes `support@vennixstore.com`; tested contact page returned only a minimal response. |

# Repository-Only Findings

The repository remains a Dawn-derived Online Store 2.0 theme with:

- Vennix homepage sections for hero, brand story, categories, trust, newsletter, announcement, and why-us content.
- Product metafield support for key features, materials, dimensions, compatibility, care, sizing/fit, included items, warranty, and origin.
- Product assurances, sticky add-to-cart, shipping progress, breadcrumb JSON-LD, meta tags, predictive search, cart drawer, customer-account templates, and collection filtering infrastructure.
- Configurable `free_shipping_threshold` and `free_shipping_progress_enabled` settings.
- No current-branch `vennix-size-guide.liquid` file; sizing is supported through product metafields.
- Existing repository documentation identifying an FAQ-page gap and missing live Instagram feed integration.

These are **CODE-VERIFIED ONLY** and must not be represented as proof of the published storefront implementation.

# Safe Code Changes vs Shopify Admin Changes

## Changes that can be safely prepared in the repository

- Theme-code changes to Liquid, CSS, JavaScript, JSON templates, snippets, and locale strings after a separately scoped implementation request.
- Repository documentation and tests/checks that do not write to Shopify.
- A development-theme comparison once an authorized Shopify connection or theme export is supplied.

## Changes requiring merchant/Admin access

- Publishing, duplicating, overwriting, or deleting themes.
- Changing theme settings or homepage section configuration.
- Creating or changing products, product types, categories, tags, variants, inventory, metafields, or collections.
- Changing automated collection rules or navigation menus.
- Changing policies, shipping profiles/rates, markets, redirects, customer accounts, apps, pixels, or checkout settings.
- Verifying or correcting live catalog merchandising and storefront content.

# Synchronization Verdict

The public storefront is accessible and provides useful live evidence, but the repository cannot currently be declared synchronized with the published Shopify theme. The live catalog and several storefront behaviors can be observed publicly; the published theme source, Admin configuration, and repository-to-theme relationship remain unverified.

**BLOCKED — AUTHORIZED SHOPIFY ADMIN/DEVELOPMENT ACCESS OR A PUBLISHED THEME EXPORT IS REQUIRED BEFORE LIVE-ALIGNMENT IMPLEMENTATION.**
