# VennixStore — Modern Clothing & Active Essentials

<div align="center">
  <img src="https://raw.githubusercontent.com/kellyray-dev/vennixstore-theme/main/assets/vennix-logo.svg" alt="Vennix Logo" width="180" />
  <h2>Premium Shopify Theme for Modern Apparel Brands</h2>

  [![Shopify](https://img.shields.io/badge/Shopify-Online_Store_2.0-7AB55C?logo=shopify)](https://shopify.dev)
  [![Version](https://img.shields.io/badge/Version-2.0.0-blue)](https://github.com/kellyray-dev/vennixstore-theme)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE.md)
</div>

## Brand Direction

VennixStore is a focused **modern clothing and active essentials** brand — not a generic multi-category store.

The catalog, homepage, messaging, and design system are aligned around:

- Modern clothing
- Activewear and athleisure
- Everyday essentials
- Comfortable, performance-inspired apparel

**Brand voice:** elevated, editorial, and movement-focused.

- Hero messaging: *“Modern Clothing. Made for Movement.”*
- Eyebrow: *“Modern Clothing & Active Essentials”*
- Supporting copy: *“Elevated everyday pieces and active essentials designed for modern life.”*
- Footer positioning: *“Elevated everyday pieces designed for modern movement and modern life.”*

The previous multi-category positioning (Tech, Home, Fitness, Apparel as equal categories) has been retired. Off-brand catalog items (tech accessories, home electronics, grooming, home goods) are flagged for removal in `catalog/CATALOG_RECOMMENDATIONS.md`.

## Overview

VennixStore is a high-performance, custom Shopify theme built on **Online Store 2.0 / Dawn**. It is designed for modern apparel brands that want a premium storefront without maintaining custom code day to day.

**Key highlights**

- A centralized design-token layer for a consistent premium visual system
- Custom Vennix sections: editorial hero, trust bar, announcement bar, newsletter, FAQ, and value/why-us content
- Enhanced commerce UX: cart drawer, quick add, predictive search, sticky Add to Cart, shipping progress, product metafields and assurances
- JSON-LD structured data for breadcrumbs and FAQ
- Apparel-focused catalog tooling and documentation (`catalog/`, `docs/`)
- Localization support and accessibility-focused components
- Theme Check compatible, modular Liquid/JS/CSS

## Architecture

VennixStore follows the Shopify **Online Store 2.0** layer model. Merchants can rearrange sections in the Theme Editor without touching code.

### Layered styling

| Layer | File | Purpose |
|---|---|---|
| Dawn base styles | `assets/base.css` + component styles | Core Shopify structure and component primitives |
| Brand layer | `assets/vennix-brand.css` | Soft-minimal global overrides and premium polish |
| Design system | `assets/vennix-brand-2.css` | Centralized tokens (color, typography, space, radius, shadow) and shared component styles |

Both brand stylesheets are loaded from `layout/theme.liquid` after the Dawn base stylesheet, so the brand tokens override defaults deterministically.

### Design tokens

Centralized in `assets/vennix-brand-2.css`:

| Token group | Value |
|---|---|
| Ink / charcoal | `#1A1A1A` |
| Gold accent | `#C9A96E` |
| Deep gold | `#A6854D` |
| Cream background | `#FAF9F6` |
| Warm neutral | `#F0EEEA` |
| Warm line / border | `#D8D5CE` |
| Editorial type | `Playfair Display` (heading) |
| Body type | `Inter` (body) |
| Radius | `4px` / `8px` / `14px` |
| Shadow | Restrained soft shadows |

### Homepage structure (`templates/index.json`)

| Order | Section ID | Section type | Purpose |
|---|---|---|---|
| 1 | `vennix_hero` | `vennix-hero` | Editorial hero with desktop/mobile imagery, overlay, CTAs |
| 2 | `brand_intro` | `rich-text` | Brand introduction |
| 3 | `vennix_trust` | `vennix-trust-bar` | Shipping, returns, secure checkout, quality |
| 4 | `new_arrivals` | `featured-collection` | New Arrivals grid |
| 5 | `featured_collection` | `featured-collection` | Best Sellers grid |
| 6 | `editorial_image_text` | `image-with-text` | Active Essentials editorial block |
| 7 | `collection_list` | `collection-list` | Shop by category (Women's, Men's, Activewear, Essentials) |
| 8 | `social_proof` | `multicolumn` | Why VennixStore (modern design, built for movement, quality) |
| 9 | `vennix_newsletter` | `vennix-newsletter` | Email signup |

### Custom theme components

**Sections**

- `vennix-hero.liquid` — editorial hero (desktop/mobile image, focus, overlay, scroll cue, benefits)
- `vennix-trust-bar.liquid` — trust/value bar
- `vennix-announcement-bar.liquid` — rotating announcement bar
- `vennix-newsletter.liquid` — newsletter signup
- `vennix-why-us.liquid` — values/why-us section
- `faq.liquid` — accordion FAQ with `FAQPage` structured data

**Snippets**

- `vennix-breadcrumb-jsonld.liquid` — breadcrumb structured data
- `vennix-product-metafields.liquid` — product story, specs, care, etc.
- `vennix-product-assurances.liquid` — product assurances
- `vennix-shipping-progress.liquid` — free-shipping progress
- `vennix-sticky-atc.liquid` — mobile sticky Add to Cart
- `dark-mode-toggle.liquid` — header sun/moon button for the dark theme override

### Commerce & UX features

- Cart drawer and cart notifications
- Quick add and bulk quick add
- Predictive search
- Product media gallery, modal, and variant picker
- Product recommendations
- Sticky Add to Cart (`vennix-product-actions.js`, `vennix-sticky-atc.liquid`)
- Customer accounts and localization selectors
- Sticky header and mobile navigation
- Volume pricing, quantity popovers, and pickup availability
- Storefront events support for app/agent/AI cart interactions (see `release-notes.md`)
- Mega menu with hover-intent opening and automatic collection imagery (collection image → first product image → bundled lifestyle photo matched on the link title)
- Site-wide dark mode: follows the visitor's OS preference, overridable with the header toggle and remembered per visitor (`dark-mode.css`, `dark-mode.js`, `header-menu-hover.js`)

## Repository Structure

| Path | Description |
|---|---|
| `layout/` | Theme layouts, including `theme.liquid` and `password.liquid` |
| `templates/` | Shopify JSON and Liquid templates (`index`, `product`, `collection`, `cart`, `search`, customers, etc.) |
| `sections/` | Reusable, editor-configurable sections |
| `snippets/` | Shared Liquid partials and components |
| `assets/` | CSS, JS, icons, and brand imagery |
| `config/` | `settings_schema.json` and `settings_data.json` |
| `locales/` | Storefront translations for supported markets |
| `catalog/` | Catalog audit, recommendations, and the cleaned product CSV |
| `docs/` | Product/catalog SEO guide, admin and security checklists |
| `deliverables/` | Implementation report and deployment/import checklist |
| `scripts/` | Catalog-cleaning helper script |
| `.github/` | Contribution guidance, issue/PR templates, and dependabot |

## Catalog & Merchant Guidance

The theme ships with operational guidance rather than production data changes.

- `catalog/CATALOG_RECOMMENDATIONS.md` — brand-aligned catalog audit and recommended collection mapping
- `catalog/CATALOG_CLEANUP_REPORT.md` — cleanup detail for the imported catalog
- `catalog/vennix-products-cleaned.csv` — cleaned Shopify product export
- `docs/PRODUCT_CATALOG_AND_SEO_GUIDE.md` — metafield and SEO guide
- `deliverables/DEPLOYMENT_AND_IMPORT.md` — end-to-end theme and catalog deployment checklist
- `deliverables/IMPLEMENTATION_REPORT.md` — record of the brand realignment work

**Merchant note:** do not alter production Shopify data from this repository. Use the documentation and admin checklists to review drafts, collection assignments, and off-brand products before importing or publishing.

## Installation & Setup

1. Download or clone this repository.
2. In Shopify admin: **Online Store → Themes → Add theme → Upload zip**, or connect the GitHub repository.
3. For local development: `shopify theme dev`.
4. Follow `deliverables/DEPLOYMENT_AND_IMPORT.md` before publishing.

There is no Node build step; the theme uses Shopify assets directly.

## Theme Development Principles

- Clean commits: `type(scope): description`
- Keep all styling changes in the token/component layers where possible
- Preserve Online Store 2.0 section editing and schema translation keys
- Run `shopify theme check` before opening a pull request
- `MatchingTranslations` and `TemplateLength` checks are intentionally disabled (see `.theme-check.yml`)

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md).

## Contact

**Kelly Ray** – [kellyray.dev@gmail.com](mailto:kellyray.dev@gmail.com)

---

*Built with passion for elegant commerce | Powered by Shopify & Vennix*
*Last updated: August 2026*
