# Vennix product catalog and SEO guide

This guide defines the catalog fields supported by the Vennix theme and the checks required before importing product data into Shopify.

## Important distinction

Shopify's **Search engine listing** fields are the canonical SEO title and SEO description. They are not custom metafields. The theme automatically uses them through `page_title` and `page_description` for HTML metadata and social sharing.

Custom product metafields add structured merchandising content to the product page. They should not duplicate the SEO title or description.

## Required Shopify search-engine fields

For every active product:

| Field | Target | Rule |
| --- | --- | --- |
| Page title | 45–60 characters | Product name plus a meaningful differentiator. Do not append `| VennixStore`; Shopify adds the store name where appropriate. |
| Meta description | 140–160 characters | State the product type, primary benefit, important compatibility or material, and a natural action phrase. |
| URL handle | Short and readable | Remove supplier years, country names, marketplace phrases, and keyword repetition. Preserve an existing handle when changing it would break indexed links unless a Shopify redirect will be created. |
| Image alt text | Descriptive and concise | Describe the visible product and relevant color or view. Do not stuff keywords. |

## Theme-supported product metafields

Create these definitions under **Shopify Admin → Settings → Custom data → Products**. Namespace must be `custom`.

| Name | Namespace and key | Recommended type | Purpose |
| --- | --- | --- | --- |
| Short description | `custom.short_description` | Multi-line text | One or two benefit-led sentences shown below the product title. |
| Key features | `custom.key_features` | List of single-line text | Three to six scannable highlights. |
| Materials | `custom.materials` | Multi-line text | Materials or construction. |
| Dimensions | `custom.dimensions` | Multi-line text | Product measurements and capacity. |
| Compatibility | `custom.compatibility` | Multi-line text | Supported devices, models, sizes, or systems. |
| Care instructions | `custom.care_instructions` | Multi-line text | Cleaning, washing, storage, or maintenance guidance. |
| What's included | `custom.whats_included` | Multi-line text | Package contents. |
| Warranty | `custom.warranty` | Single-line text | Only use when a real warranty exists. |
| Country of origin | `custom.country_of_origin` | Single-line text | Accurate origin disclosure; do not hide or rewrite supplier-country data. |

The theme displays these fields only when values are present, so incomplete products do not show empty headings.

## Catalog quality rules

### Pricing

- Variant price must be the real selling price.
- Compare-at price is optional and must represent a genuine previous price.
- Compare-at price must be greater than the selling price.
- Review any compare-at price above three times the selling price.
- The theme temporarily hides discounts above 67% to protect customers from malformed supplier data, but the Shopify product record must still be corrected.

### Variants

- Customers should choose only meaningful options such as size, color, capacity, or device model.
- Remove supplier-routing options such as `Ships From`, warehouse country, supplier SKU groups, or marketplace bundle codes.
- Normalize capitalization: use `Black`, not a mix of `BLACK`, `black`, and `Black`.
- Remove duplicate option values and unavailable combinations that cannot be fulfilled.
- Keep the number of variants manageable and verify each variant's price, image, SKU, inventory policy, and shipping weight.

### Product titles

- Lead with the product type and strongest useful differentiator.
- Remove supplier keywords, years, marketplace wording, and repeated store names.
- Keep visible titles concise—usually under 70 characters.

### Descriptions

Use this order:

1. Benefit-led opening paragraph.
2. Key features in `custom.key_features`.
3. Accurate specifications in the supported metafields.
4. Compatibility, sizing, or fit guidance where relevant.
5. Package contents and care information.

Do not use H2–H5 headings for individual specification bullets. Do not claim performance, certifications, delivery speed, warranties, or material quality unless they are verified.

## Current high-priority catalog issue

The public storefront previously exposed a jogger variant with a `$148,330` compare-at price against a `$39.99` selling price and customer-facing warehouse-country choices. That product and any similar supplier-imported products must be corrected in the product CSV before launch.

## Safe import workflow

1. Keep the original Shopify export unchanged as a backup.
2. Edit a duplicate CSV.
3. Review products by handle, including all variant rows.
4. Test-import a small set of products first.
5. Confirm prices, variants, images, inventory behavior, collections, and SEO listings in Shopify Admin.
6. Preview the unpublished theme on desktop and mobile.
7. Import the remaining reviewed products.
8. Recheck navigation, filters, product recommendations, cart, shipping threshold, policies, and checkout.
