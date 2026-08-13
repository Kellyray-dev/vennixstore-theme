# Vennix catalog cleanup report

## Summary

- Products reviewed: **40**
- CSV rows: **1853 → 1410**
- Priced variants: **1708 → 1264**
- Duplicate supplier-source variants removed: **444**
- Compare-at prices above 3× selling price cleared: **319**
- Compare-at prices at or below selling price cleared: **162**
- Products changed to draft for review: **4**
- Total draft products after cleanup: **6** (including two products that were already draft)
- Product images with rewritten alt text: **650**
- Products with material metafields: **25**
- Products with care metafields: **11**
- Products with sizing/fit metafields: **14**

## Import safety

The cleaned CSV preserves handles, selected source SKUs, fulfillment service, inventory policy, weights, image URLs, variant images, and valid selling prices. Use Shopify's overwrite option and test a small subset before importing the full file.

The merchant-private `Cost per item` column is intentionally omitted. Importing this CSV will not expose or update product cost values.

Products marked **draft** must not be activated until fulfillment source, variant availability, and pricing have been confirmed.

## Product changes

| Product | Status | Variants | Supplier sources | Review required |
| --- | --- | ---: | ---: | --- |
| Cream Textured Tie-Front Top & Mini Skirt Set | active | 1 → 1 | 0 | No |
| Go Love Joy Half-Finger Training Gloves | active | 1 → 1 | 0 | No |
| Fluffy Cat-Ear Braided Y2K Hat | active | 5 → 5 | 0 | No |
| Skull-Print Motorcycle Balaclava | active | 1 → 1 | 0 | No |
| Floral Sleeveless A-Line Mini Dress | active | 15 → 15 | 0 | No |
| Women's V-Neck Ruffle Tie-Waist Blouse | active | 32 → 32 | 0 | No |
| Men's Slim-Fit Elastic-Waist Jogger Pants | draft | 210 → 21 | 10 | Yes |
| Men's Wide-Leg Streetwear Jeans | draft | 240 → 30 | 8 | Yes |
| Men's Loose-Fit Streetwear Joggers | active | 18 → 18 | 1 | No |
| Men's 3-Piece Slim-Fit Business Suit | active | 60 → 60 | 1 | No |
| Men's Quick-Dry Stretch Casual Pants | active | 28 → 28 | 1 | No |
| Men's Breathable Short-Sleeve Polo Shirt | active | 30 → 30 | 1 | No |
| Men's Multi-Pocket Regular-Fit Jeans | draft | 50 → 5 | 10 | Yes |
| Men's Lightweight Mesh Tank Top | draft | 56 → 56 | 1 | Yes |
| Men's Moisture-Wicking Crew-Neck T-Shirts — 6 Pack | active | 5 → 5 | 1 | No |
| Men's Wrinkle-Resistant Business Shirt | active | 42 → 42 | 1 | No |
| Men's Breathable Wide-Leg Casual Pants | active | 30 → 30 | 1 | No |
| Men's Elastic-Waist Sports Shorts | active | 30 → 30 | 1 | No |
| Men's Turtleneck Knit Sweater | active | 3 → 3 | 1 | No |
| Men's Baseball-Collar Casual Jacket | active | 36 → 36 | 1 | No |
| Men's Waffle-Knit Crew-Neck T-Shirt | active | 35 → 35 | 1 | No |
| Men's Heavyweight Vintage-Wash T-Shirt | active | 33 → 33 | 1 | No |
| Men's Reflective Hooded Windbreaker | active | 8 → 8 | 1 | No |
| T9 Cordless Hair Trimmer & Clipper | active | 6 → 6 | 0 | No |
| Women's Wire-Free Full-Cup Support Bra | draft | 42 → 42 | 1 | No |
| Wire-Free Maternity Nursing Bra | draft | 40 → 40 | 1 | No |
| iPhone Privacy Screen Protector | active | 160 → 160 | 0 | No |
| MagSafe Silicone iPhone Case | active | 20 → 20 | 0 | No |
| Clear MagSafe iPhone Case | active | 200 → 200 | 0 | No |
| 180ml USB Aroma Humidifier | active | 2 → 2 | 0 | No |
| MagSafe Matte Armor iPhone Case | active | 140 → 140 | 0 | No |
| Rechargeable Motion Sensor LED Strip Light | active | 8 → 8 | 0 | No |
| Rechargeable LED Motion Sensor Night Light | active | 8 → 8 | 0 | No |
| Mini USB Aroma Humidifier | active | 2 → 2 | 0 | No |
| Hanes Cool Comfort Cotton Boxer Briefs | active | 71 → 71 | 0 | No |
| 8-in-1 USB-C Hub for MacBook & iPad | active | 3 → 3 | 0 | No |
| Reusable Double-Sided Pet Hair Brush | active | 1 → 1 | 0 | No |
| Memory Foam Non-Slip Bath Mat | active | 3 → 3 | 0 | No |
| 7-in-1 USB-C Multiport Hub | active | 2 → 2 | 0 | No |
| Purple Watercolor Phone Case | active | 31 → 31 | 0 | No |

## Draft review list

- **Men's Slim-Fit Elastic-Waist Jogger Pants:** 10 warehouse sources collapsed to US-source size/color variants; two US variants have higher selling prices and require review.
- **Men's Wide-Leg Streetwear Jeans:** 8 warehouse sources collapsed to US-source size/color variants; one US variant has a higher selling price and requires review.
- **Men's Multi-Pocket Regular-Fit Jeans:** 10 warehouse sources collapsed to US-source size variants; verify US fulfillment and product color imagery.
- **Men's Lightweight Mesh Tank Top:** the exported description described a six-pack of T-shirts, so it was replaced with minimal non-speculative copy and set to draft.

## Before importing

1. Keep the original export as a private backup.
2. In Shopify, test the four draft products separately before importing the complete CSV.
3. Confirm that overwriting products removes obsolete warehouse-source variants; if not, delete those variants in Shopify Admin first.
4. Verify remaining compare-at prices represent genuine previous selling prices.
5. Confirm shipping profiles, taxes, fulfillment services, inventory policy, and checkout behavior.
6. Do not activate draft products until the review items above are resolved.
