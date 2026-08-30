# VennixStore Theme – Release Notes

## v2.0.0 – Soft-Minimal Storefront Redesign (August 2026)

### Added

- [Design System] New soft-minimal identity built on `vennix-brand.css`, replacing the previous custom/enhancement stylesheets.
- [Sections] Editorial hero with configurable shopping benefits, trust bar, values ("Why us"), newsletter, and announcement bar sections.
- [Conversion] Sticky add-to-cart and free-shipping progress indicator for mobile purchase flows.
- [Product] Product assurances snippet and metafield-driven product details on product pages.
- [SEO] Breadcrumb JSON-LD structured data and refined meta-tag rendering.
- [Customer] Rebuilt contact form with dedicated styles, footer contact info, refund-policy returns link, and customer account support links.
- [Accessibility] Skip-to-content link for WCAG 2.1 AA compliance.
- [Tooling] Catalog cleanup script (`scripts/clean_product_catalog.py`) with cleaned product CSV and audit report.
- [Docs] Admin notification checklist, email security setup guide, and product catalog/SEO guide.

### Removed

- Wishlist system (section, page template, button, and JS).
- Brand story, category rows, reviews carousel, FAQ section, size guide, and recently viewed components.
- Legacy `vennix-custom.css`, `vennix-enhancements.css`, and breadcrumb markup snippets.

### Fixes and improvements

- Fixed theme metadata and SEO JSON-LD output.
- Sharpened brand hierarchy and catalog navigation.
- Restored dedicated 404 page template and storefront trust signals.
