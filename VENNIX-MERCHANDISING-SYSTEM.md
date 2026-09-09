# VennixStore Merchandising System

This document is the permanent product-classification rulebook for VennixStore. Merchants and developers should use these rules for every new product, collection, merchandising surface, and product-page feature.

## 1. Product Taxonomy

Every product must have one approved product type from the taxonomy below. Product types are customer-facing classification values and must use the exact spelling and capitalization shown.

### Women's

- Women's Tops
- Women's Bottoms
- Women's Dresses
- Women's Outerwear
- Women's Activewear
- Women's Loungewear
- Women's Accessories

### Men's

- Men's T-Shirts
- Men's Shirts
- Men's Pants
- Men's Shorts
- Men's Outerwear
- Men's Activewear
- Men's Loungewear
- Men's Accessories

### Active

- Active Tops
- Active Bottoms
- Performance Wear
- Training Essentials
- Running Essentials

### Essentials

- Everyday Essentials
- Bags
- Accessories
- Lifestyle Essentials

### Taxonomy rules

- Use exactly one approved product type per product.
- Do not create synonyms, abbreviations, alternate punctuation, or singular/plural variations.
- Use the most specific applicable product type.
- Do not classify a product by its merchandising position, image, title keyword alone, or assumed use.
- If a product could fit multiple departments, choose the department that best describes its primary customer use and record the approved product type consistently.

## 2. Tag Conventions

Tags are normalized identifiers. They must be lowercase, hyphenated, and spelled exactly as shown:

- `best-seller`
- `new-arrival`
- `limited-edition`
- `featured`
- `trending`
- `active`
- `everyday`
- `premium`

### Tag rules

- Never vary capitalization, spacing, punctuation, or spelling.
- Do not use alternatives such as `Best Seller`, `bestseller`, `new`, or `new arrival`.
- Apply only tags that are factually appropriate.
- Most products should have one to three merchandising tags.
- Product type determines department and feature behavior; tags do not replace product type.
- Remove outdated campaign tags rather than accumulating conflicting tags.

## 3. Automated Collection Rules

Create and maintain automated collections using the following exact rules:

| Collection | Automated condition |
| --- | --- |
| New Arrivals | Product tag is `new-arrival` |
| Best Sellers | Product tag is `best-seller` |
| Women's Clothing | Product type starts with `Women's` |
| Men's Clothing | Product type starts with `Men's` |
| Fitness & Active | Product tag is `active` |
| Everyday Essentials | Product tag is `everyday` |

### Collection rules

- Use exact normalized tags for tag-driven collections.
- Use the approved product type prefix for department collections.
- Do not manually place products into these automated collections as a substitute for correct classification.
- A product may belong to multiple automated collections when it satisfies multiple rules.
- Verify automated collection membership after changing a product type or tag.
- Collection rules are Shopify Admin configuration and must be created or updated there; this document defines the required behavior but does not change live store settings.

## 4. Badge Logic

The theme may display at most one merchandising badge per product.

### Badge conditions

- Show **New Arrival** if the product has the exact tag `new-arrival`.
- Otherwise show **Best Seller** if the product has the exact tag `best-seller`.
- If neither tag is present, show no merchandising badge.

### Badge precedence and restrictions

- Never show more than one merchandising badge per product.
- Do not infer badges from collection membership, product position, sort order, sales rank, recency, title, image, or visual prominence.
- When both `new-arrival` and `best-seller` are present, `new-arrival` takes precedence so the single-badge rule is deterministic.
- Badge labels must be customer-facing title case: `New Arrival` and `Best Seller`.

## 5. Apparel Detection Rules

The product type controls whether clothing-specific product features are shown.

### Treat as apparel when product type contains:

- `Women's`
- `Men's`
- `Active`

Products matching these rules may show clothing sizing, material, care, and fit information, provided the relevant data exists.

### Do not show clothing sizing for:

- Accessories
- Bags
- Lifestyle Essentials
- Everyday Essentials

### Detection rules

- Detection must use the normalized product type, not product title, collection membership, tag, image, or product position.
- A product type that contains `Women's`, `Men's`, or `Active` is apparel for feature-display purposes.
- Non-apparel products must not receive clothing-size selectors or clothing-specific size guidance.
- If a product is misclassified, correct the product type in Shopify Admin rather than adding an exception in theme code.

## 6. Conditional Product Features

### Apparel products show

- A size selector containing all available size variants.
- A size guide link.
- Material composition.
- Care instructions.
- Measurements or fit information when supplied by the merchant.

### Non-apparel products show

- Relevant product details and specifications only.
- Product-specific options such as color, capacity, dimensions, compatibility, or included items when applicable.
- Zero clothing sizing data.
- No clothing-size selector, clothing-size guide, or apparel-specific fit content.

### Feature rules

- Never invent material, care, sizing, measurement, compatibility, warranty, or performance information.
- Render only details that are populated and relevant to the product type.
- Do not use a generic apparel fallback for missing non-apparel data.
- Product metafields and variant data must remain consistent with the approved product type.

## 7. Future Product Onboarding Checklist

Before publishing a new product, the merchant provides:

- Product title (customer-facing name)
- Product type from the approved taxonomy above
- Tags from the standard tag list, usually one to three tags
- Description
- Images with meaningful alt text
- Pricing
- Variants, including sizes and colors where applicable
- For apparel: material, care instructions, and measurements
- For non-apparel: relevant specifications only

### Merchant validation

- Confirm the product type uses the exact approved taxonomy value.
- Confirm tags are lowercase, hyphenated, and selected only from the standard list.
- Confirm apparel variants contain all available sizes and colors.
- Confirm non-apparel products contain no clothing-size data.
- Confirm images accurately represent the product and include useful alt text.
- Confirm description, pricing, variants, materials, care, and specifications are accurate.

### Theme and Shopify behavior

After correct onboarding data is saved, the system should:

- Assign the product to the correct automated collections based on product type and tags.
- Show appropriate product-page features based on apparel detection.
- Show the correct single badge based on badge precedence.
- Display the product in the correct merchandising sections and automated collection results.
- Keep non-apparel products free of clothing sizing data.

## Ownership and Change Control

- Shopify Admin product type and tags are the source data for classification.
- Shopify Admin automated collection rules are the source of collection membership.
- Theme code is responsible for applying the documented display, feature, and badge logic to that source data.
- Any proposed taxonomy, tag, collection-rule, badge, or apparel-detection change must update this document before implementation.
- Do not introduce one-off product exceptions without documenting the rule change and its impact on existing products.
