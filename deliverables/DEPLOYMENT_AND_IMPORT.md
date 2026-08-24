# Vennix deployment and catalog import checklist

## Deliverables

- Theme ZIP: build on demand with `shopify theme package` (ZIPs are not committed)
- Full cleaned catalog: `catalog/vennix-products-cleaned.csv`
- Catalog audit: `catalog/CATALOG_CLEANUP_REPORT.md`
- Metafield and SEO guide: `docs/PRODUCT_CATALOG_AND_SEO_GUIDE.md`

## 1. Create an unpublished theme preview

Preferred method with Shopify's GitHub integration:

1. Open **Shopify Admin → Online Store → Themes**.
2. Add or connect a theme from GitHub.
3. Select repository `Kellyray-dev/vennixstore-theme`.
4. Select branch `arena/019ff6c1-vennixstore-theme`.
5. Keep the connected theme unpublished.
6. Preview the homepage, collection, product, search, cart, account, policy, and contact pages on desktop and mobile.

ZIP alternative:

1. Run `shopify theme package` at the repository root to produce the theme ZIP.
2. In **Online Store → Themes**, choose **Add theme → Upload ZIP file**.
3. Upload it and keep it unpublished while testing.

## 2. Verify store settings before catalog import

- Free-shipping rate is actually configured for eligible orders over $50.
- Refund policy matches the stated 30-day return window.
- Payment providers and test mode are configured correctly.
- Shipping profiles, fulfillment locations, package weights, and tax settings are correct.
- Main navigation links to active collections.
- Policy pages and customer-support contact details are present.

## 3. Back up the catalog

Keep the original Shopify product export outside the repository. Do not modify it.

Read `catalog/CATALOG_CLEANUP_REPORT.md` before importing. Four products were changed to draft for fulfillment/content review, and two products were already draft.

## 4. Import the cleaned catalog

1. Open **Shopify Admin → Products**.
2. Choose **Import**.
3. Upload `catalog/vennix-products-cleaned.csv`.
4. Enable the option to overwrite products with matching handles.
5. Review Shopify's import preview and error report before confirming.
6. Confirm that obsolete warehouse-source variants were removed. If Shopify retained them, delete those variants manually before activating the affected products.

The cleaned file preserves handles, selected SKUs, fulfillment service, inventory policy, weights, images, variant images, and valid selling prices. The merchant-private **Cost per item** column is intentionally omitted, so the import will not expose or update product costs.

## 5. Review all draft products

Do not activate a draft product until its price, variant availability, fulfillment source, description, images, and shipping behavior are verified.

Highest priority:

- Men's Slim-Fit Elastic-Waist Jogger Pants
- Men's Wide-Leg Streetwear Jeans
- Men's Multi-Pocket Regular-Fit Jeans
- Men's Lightweight Mesh Tank Top

The two bra products were already draft in the supplied export and remain draft.

## 6. Create or verify product metafield definitions

Follow `docs/PRODUCT_CATALOG_AND_SEO_GUIDE.md`. The theme supports materials, care instructions, sizing/fit, dimensions, compatibility, package contents, warranty, and country of origin. Empty fields remain hidden.

## 7. Conversion QA before publishing

Test at least one simple product and one multi-variant product:

1. Product selection and price updates.
2. Mobile sticky Add to Cart appears only after scrolling past the main button and uses the selected variant.
3. Add to cart and cart-drawer updates.
4. Cart free-shipping progress recalculates after add, removal, and quantity changes.
5. Product story, specifications, care, shipping, and returns accordions.
6. Discount codes and shipping calculation.
7. Payment, checkout, and order confirmation email.
8. Mobile navigation, filters, quick add, forms, and image galleries.
9. Judge.me widgets, Shopify Inbox, SEO Lab, GPTLab, and Metafields Guru blocks.
10. Google Search Console and analytics/pixel integrations.

## 8. Publish

Publish only after the theme preview and test order pass. Keep the previous published theme available as a rollback copy.
