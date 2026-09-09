# VennixStore Phase 4B Catalog Remediation

**Source:** Public `https://vennixstore.com/products.json?limit=250`  
**Catalog snapshot:** 107 products  
**Status:** Planning and export only. No products, tags, types, collections, or Shopify settings were modified.

## 1. Executive Summary

- **107 total public products**
- **5 already use an approved taxonomy product type**
- **102 require normalization review or action**
- **101 products have a provisional approved replacement type**
- **1 product is a removal candidate:** Mini USB Aroma Humidifier
- **97 products need tag cleanup/review** because they use supplier, legacy, or non-normalized tags.
- **107 of 107 products have at least one public product image with missing alt text.**

### What can be normalized in a controlled batch

- Blank, numeric, and legacy product types can be replaced with provisional approved taxonomy values in [PRODUCTS-TO-BULK-UPDATE.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-BULK-UPDATE.csv>).
- The provisional mapping is based on public product names and should be sampled by a merchant before import.
- Tag cleanup candidates are listed in [PRODUCTS-TO-TAG-REVIEW.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-TAG-REVIEW.csv>).

### What requires manual merchant review

- Boundary products such as gloves, hats, balaclavas, suits, and underwear.
- Whether products are truly intended for the Vennix assortment, even when their names appear apparel-aligned.
- Supplier/legacy tag meaning, especially whether a product is genuinely `new-arrival`, `best-seller`, `featured`, `trending`, `active`, `everyday`, or `premium`.
- Product materials, care instructions, measurements, image alt text, variant correctness, duplicate records, inventory, and commercial removal decisions.

### Important count reconciliation

The requested arithmetic says “70 blank + 20 numeric + 11 non-approved = 102.” Those categories overlap in the live data: the public snapshot produced **102 non-approved-type records total**, consisting of **70 blank and 32 non-approved nonblank/numeric records**. The generated bulk CSV contains **101 records after excluding the humidifier removal candidate**. This is intentional and safer than importing a product marked for removal. The full 102-record normalization set is represented by the bulk CSV plus the removal CSV.

## 2. Product Type Normalization Plan

### CSV A: bulk type updates

[Download PRODUCTS-TO-BULK-UPDATE.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-BULK-UPDATE.csv>)

Columns:

```text
product_id,current_type,new_type,product_name
```

It contains 101 provisional updates. The `product_id` values are Shopify product IDs from the public catalog snapshot; they are not product handles.

### CSV B: uncertain products

[Download PRODUCTS-TO-REVIEW.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-REVIEW.csv>)

The five boundary cases are:

- Go Love Joy Half-Finger Fitness & Cycling Gloves — Training Essentials vs Accessories.
- Original Fluffy Cat Ear Hat — Women's Accessories vs Accessories.
- Motorcycle Balaclava — Accessories vs Active/Performance classification.
- Men's 3-Piece Slim Fit Business & Wedding Suit — Men's Outerwear vs a missing formalwear bucket.
- Hanes Men's Cool Cotton Boxer Briefs Pack — Men's Loungewear vs removal/assortment review.

Resolve these five decisions before importing their rows. The bulk CSV contains provisional values for them so the export remains complete, but the merchant should edit or remove those rows before execution.

### CSV C: removal candidates

[Download PRODUCTS-TO-REMOVE.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-REMOVE.csv>)

It contains:

- Mini USB Aroma Humidifier — home electronic/general-store product outside the approved Vennix taxonomy.

Removal is not authorized by this plan. Archive/delete only after merchant confirmation, inventory/order review, and an approved redirect or replacement decision.

### Tag review CSV

[Download PRODUCTS-TO-TAG-REVIEW.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-TAG-REVIEW.csv>)

This contains 97 products with at least one non-approved tag. It is a review input, not an automatic instruction to assign badges.

## 3. Bulk Import Instructions

The requested “product_id → Handle” mapping is not safe: a numeric Shopify product ID is not a Shopify product handle. Shopify product CSV imports normally require the exact existing `Handle`, and Shopify's native importer may not update product type from an arbitrary product-ID-only CSV.

### Safe procedure

1. Download [PRODUCTS-TO-BULK-UPDATE.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-BULK-UPDATE.csv>).
2. Export the current Shopify product catalog from Admin, including exact `Handle`, `Title`, and `Type`/`Product type` fields.
3. Join the remediation CSV to that export by Shopify product ID in a spreadsheet or controlled script.
4. Replace the identifier column with the exact Shopify `Handle`; retain the exact product title as a cross-check.
5. Remove the five uncertain boundary rows until the merchant decides them, and remove the humidifier row because it is a removal candidate.
6. In Shopify Admin, use **Products → Import** only with a Shopify-compatible product CSV, or use the Admin bulk editor for the Product type field. Do not upload the generated ID-only CSV directly as if `product_id` were `Handle`.
7. If using a compatible import, map the exact handle to the existing product and `new_type` to **Product type**.
8. Test with 10 products first, verify the results, then process the remaining approved rows.
9. Verify product pages, automated collections, and theme feature behavior.

This is approximately 10 minutes for the actual Admin field update once the export/handle join and merchant review are complete. The join and validation are essential; a blind upload is not recommended.

## 4. Image Alt Text Remediation

The public snapshot showed missing image alt text on all 107 products.

### Method 1: fastest

Use Shopify's media bulk editor or an approved catalog tool to add descriptive alt text. Use:

```text
{product_name} - {color} - {size}
```

For product-level images without a variant:

```text
{product_name} - {image_view}
```

Examples:

- `Angel Wings Heathered Turtleneck Long Sleeve Sweater - Cerise - Front`
- `Men's Baseball Collar Casual Jacket - Black - Front`
- `Go Love Joy Half-Finger Fitness & Cycling Gloves - Black - Product view`

Do not add every size to an image alt text when the image does not visibly distinguish size. Use the visible color/view and keep the text concise and descriptive.

### Method 2: spreadsheet re-import

1. Export product and media data.
2. Add alt text for every image row using the template above.
3. Preserve exact handles, product IDs, image URLs, variant relationships, and SKU values.
4. Re-import through a tested Shopify-compatible workflow.
5. Verify rendered `img alt` values on product and collection pages.

## 5. Material and Care Data

The public audit found 37 products without care-instruction keywords and six without material/composition keywords. These counts are content-keyword checks, not proof that every product lacks accurate Admin metafields.

### Merchant checklist for each apparel product

- Confirm fiber/material composition from the supplier or manufacturer.
- Record the composition in a consistent form, such as `95% cotton, 5% elastane`.
- Add care instructions: wash temperature, wash cycle, drying method, ironing restrictions, and special handling.
- Add fit/measurement data matching the actual variants.
- Confirm the product description, material metafield, care metafield, and size guide do not contradict one another.
- Do not invent material or care claims from product titles or images.

### Priority top 10 visible apparel products

Start with the products surfaced on the homepage and visible merchandising sections:

1. Angel Wings Heathered Turtleneck Long Sleeve Sweater
2. Button Detail Long Sleeve Shirt
3. Casual Leopard Print Ruffled Swing Dress Summer Fashion Beach Dresses Women
4. Cream Textured Tie-Front Crop Top & Mini Skirt Set
5. Denim Trim Button Detail Sweatshirt
6. Early Spring Long-sleeved Thin Sweater Female
7. Elegant Women's V-Neck Ruffle Blouse with Tie Waist, Lantern Sleeves Long Sleeve Top
8. Men's Ice Silk Fast-Dry Stretch Casual Pants
9. Night Reflective Windbreaker Jacket
10. Men's Moisture-Wicking Crew Neck T-Shirt 6-Pack

For each, add verified keywords covering material, care, fit, and measurements. For active items, also verify only substantiated performance claims.

Non-apparel products such as the humidifier do not need clothing-care data. They do need relevant specifications, operating instructions, voltage/compatibility information, and safety information if retained.

## 6. Tag Normalization

Current public tags include supplier and legacy values such as `Rhythmia`, `Ship From Overseas`, `fashion`, `SYNZ`, `men`, and long descriptive SEO phrases.

### Plan

- Replace or archive supplier/legacy merchandising tags after exporting them for audit.
- Use only these normalized merchandising tags:
  - `best-seller`
  - `new-arrival`
  - `limited-edition`
  - `featured`
  - `trending`
  - `active`
  - `everyday`
  - `premium`
- Keep operational supplier/shipping data in appropriate Admin fields or a separately governed operational tag namespace if the business requires it; do not mix it with customer-facing merchandising tags.
- Do not infer `best-seller` or `new-arrival` from product position, import date, supplier tag, or collection membership.
- Apply `new-arrival` only when the merchant confirms the launch window.
- Apply `best-seller` only from verified sales data or an explicit merchant decision.
- Prioritize the 20+ homepage and collection merchandising products, then process the remaining 97 review records in [PRODUCTS-TO-TAG-REVIEW.csv](<C:/Users/Chris/vennix repo/PRODUCTS-TO-TAG-REVIEW.csv>).

## 7. Duplicate Product Check

Likely duplicate:

- `Men's Plus Size Zip Up Long Sleeve Jacket` — product ID `8469519040701`
- `Men's Plus Size Zip Up Long Sleeve Jacket` — product ID `8469518811325`

The records have different supplier tags, so they may be distinct colors, suppliers, or SKUs. Merchant review must compare images, variants, SKUs, cost, inventory, sales history, and descriptions.

Recommendation:

1. Confirm whether the records are duplicate products or legitimate variants.
2. If duplicate, choose the canonical product, consolidate variants/inventory where safe, and redirect the retired product handle.
3. If distinct, revise customer-facing titles to distinguish them and assign the correct approved product type.
4. Resolve this before advertising and before applying broad tag/collection rules.

## 8. Verification Checklist

After approved type updates:

- Check five random products from Women's, Men's, Active, and Essentials departments where products exist.
- Confirm the approved product type appears in Shopify Admin and drives the expected collection membership.
- Confirm product badges are based only on approved normalized tags.
- Confirm one badge maximum per product.
- Confirm apparel products show all available size variants and a size guide.
- Confirm non-apparel products show relevant specifications and no clothing sizing.
- Check one product in each Phase 1 public collection.
- Verify New Arrivals, Best Sellers, Women's Clothing, Men's Clothing, Fitness & Active, and Everyday Essentials collections exist and contain only correctly classified products.
- Verify product image alt text on product and collection pages.
- Verify material, care, and measurement content on the priority products.
- Recheck the duplicate jacket records.
- Confirm no removal candidate was deleted or archived without merchant approval.

## 9. Timeline and Priority

### Must do before advertising

- Resolve the five uncertain products.
- Bulk update the approved 101 type changes after converting IDs to exact Shopify handles.
- Review the humidifier removal decision.
- Verify automated collections: approximately 5 minutes after import.

### Should do this week

- Add image alt text to the top 30 apparel products: approximately 30 minutes with a bulk workflow.
- Add care/material data to the top 20 products: approximately 20 minutes if source data is ready.
- Normalize merchandising tags on 20+ priority products: approximately 15 minutes after sales/newness decisions are supplied.

### Can do later

- Complete all 107 image alt-text entries: approximately 1–2 hours manually.
- Complete care/material/specification data for all affected products.
- Reconcile supplier tags and operational metadata.

## 10. Troubleshooting

If a bulk update fails:

- Verify the CSV headers and UTF-8 encoding.
- Confirm the exact Shopify handles from a current Admin export; product IDs are not handles.
- Ensure Product type values exactly match the approved taxonomy, including apostrophes, capitalization, and hyphenation.
- Test 10 products first.
- Confirm the products are not drafts, archived, or locked by an app workflow.
- Check that the import did not create duplicate products.
- Re-export and compare product type, tags, variants, media, and handles after import.
- If a collection is empty, verify its Admin rule and exact tag/type spelling.
- If a product shows clothing sizing incorrectly, correct its product type and inspect the published theme's apparel-detection logic.

**VERDICT: NORMALIZATION IS READY AS A CONTROLLED ADMIN WORKFLOW, NOT AS A BLIND CSV UPLOAD. MERCHANT REVIEW AND HANDLE-BASED VALIDATION ARE REQUIRED BEFORE ADVERTISING.**
