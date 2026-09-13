# VennixStore Theme Status

**Last updated:** Theme audit + left product rail (2026-09-11)

## Summary

VennixStore already has a strong Shopify OS 2.0 foundation with premium branding, a custom homepage, product merchandising blocks, cart features, search, filters, SEO, localization, and dark mode.

## Existing features

- Custom homepage sections
- Cart drawer and cart page support
- Predictive search
- Product filtering and sorting
- Quick add / bulk add
- Related products
- Sticky Add to Cart
- Product metafield merchandising
- FAQ section with schema
- Breadcrumb JSON-LD and meta tags
- Localization and accessibility support
- Dark mode with visitor preference persistence
- Size guide modal on product pages (`size_guide` block in `main-product`, built-in apparel chart with page / `custom.size_chart` metafield overrides)
- Homepage "Best Sellers" featured collection and category tiles linked to real collections
- Slide-style product showcase: a store-wide off-canvas rail docked to the left edge
  (`vennix-product-rail.liquid`, in the header group) and a two-column homepage section with the
  rail on the left (`vennix-product-showcase.liquid`). Vertical slides on desktop, horizontal
  swipe strip below 750px.
- CI pipeline ready at `ci/theme-check.workflow.yml` — runs theme-check, Liquid formatting,
  and `scripts/validate_theme.py` (template JSON + section-schema drift). It sits outside
  `.github/workflows/` because the pushing GitHub App lacks the `workflows` permission;
  move it there (or grant the permission) to switch it on.

## Partial features

- Instagram: social links exist, but there is no live feed

## Missing features

- Wishlist
- Recently viewed
- Compare products
- Back-in-stock alerts
- Lookbook or shoppable image content
- UGC / social gallery

## Known technical issues

- Phase 1 cleanup complete: header CSS typo and FAQ token issues resolved
- Brand direction fully aligned: Modern Clothing & Active Essentials
- 2026-09-11 audit fixed: `.gitignore` Markdown fences, the dead `--media-padding` declaration
  in `theme.liquid` / `password.liquid` (referenced an undefined setting), the empty
  `theme-color` in `templates/gift_card.liquid`, and the missing CI pipeline
- No blocking technical issues remain
- Advisory only: three Dawn base files exceed the theme-check `LiquidComplexity` suggestion
  threshold (`card-product`, `main-product`, `facets`); ~357 KB of assets are unreferenced.
  See `reports/audits/2026-09-11-theme-audit.md`
- Best-seller ordering for the new showcase surfaces requires the source collection's admin
  sort order to be set to "Best selling" — the Liquid `sort` filter cannot sort by sales volume

## Recommended V2 work (future phases)

1. Product-page merchandising
2. Editorial homepage refinement
3. Collection and search improvements
4. Wishlist
5. Recently viewed
6. Compare products
7. Back-in-stock alerts
8. Lookbook / shoppable imagery
9. UGC or social gallery
