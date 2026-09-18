# VENNIX Phase 9 — Production Approval

**Date:** 2026-09-17  
**Branch:** `arena/01a0b20a-vennixstore-theme`  
**Current commit:** `6a1b69e`  
**Status:** **CODE PREFLIGHT PASS — PRODUCTION APPROVAL BLOCKED**

## Scope

Phase 9 is the production-approval gate after the repository implementation, regression, desktop, and mobile QA work. It is intentionally a go/no-go phase: no production publish or Shopify Admin mutation is performed from this checkout without verified draft-theme access and merchant approval.

## Repository preflight

| Check | Result |
| --- | --- |
| Template JSON, section schemas, settings, and asset references | PASS |
| `scripts/test_validate_theme.py` | PASS — 16/16 tests |
| JavaScript syntax check for every root-level `assets/*.js` file | PASS |
| `git diff --check origin/main...HEAD` | PASS |
| Working tree and branch association | PASS — clean fixed Arena branch |
| Shopify Theme Check CLI | BLOCKED — CLI is not installed in this workspace |

## Production gates still pending

### 1. Draft-theme visual verification

Shopify Admin or a valid draft-theme preview is required to verify the actual rendered branch. Repository inspection cannot confirm the published/draft theme is synchronized with this commit.

Required routes:

- Homepage desktop and mobile
- Collection page with filters, sorting, pagination, and sold-out states
- Search results and predictive search
- Apparel product page with variants, size guide, quantity, Add to Cart, and sticky mobile Add to Cart
- Cart drawer and cart page
- Contact and policy links

### 2. Hero asset selection

The approved desktop and mobile hero images must be selected through the Theme Editor:

- Desktop: supplied clean editorial image, 2:1
- Mobile: supplied portrait image, 2:3
- Confirm image alt text and focal positioning
- Confirm the live HTML heading and CTA links are not baked into the images

The inline image attachments are not available as repository files in this workspace, so exact binary asset inclusion cannot be verified here.

### 3. Shopify Admin data verification

Confirm in the live/draft store:

- `womens-clothing`, `mens-clothing`, and `apparel` collections are published and resolve correctly.
- The apparel collection contains the intended real products and media.
- Product prices, availability, variants, inventory, and shipping settings are correct.
- Review output remains disabled unless a verified review app supplies both rating and positive review-count data.
- Contact, shipping policy, refund policy, navigation, and footer links resolve.
- Homepage SEO title and description reflect the approved VENNIX positioning.

### 4. Transactional verification

A merchant-controlled test must confirm:

- Add to Cart from product and quick-add surfaces
- Variant changes update the selected variant, price, availability, and sticky Add to Cart state
- Cart drawer updates without errors
- Checkout handoff works in the intended market and currency
- Customer account and policy links resolve as configured

## Go / no-go decision

**NO-GO for production publishing at this time.**

The repository code passes the available automated checks, but production approval requires Shopify Admin/draft-preview verification, asset selection, live collection confirmation, and a controlled checkout test. No production theme was published or modified during this phase.

## Approval sequence after access is available

1. Upload/select the approved hero assets in the draft theme.
2. Run the route and responsive QA checklist above.
3. Record any visual or live-data defects against the draft theme.
4. Re-run repository validation after any code changes.
5. Obtain explicit merchant approval.
6. Publish only the approved draft theme.
7. Recheck homepage metadata, canonical URLs, collection links, product purchase flow, cart, and checkout after publishing.
