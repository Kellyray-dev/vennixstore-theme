# VennixStore Phase 4A Priority Fixes

**Scope:** Diagnosis and remediation instructions only.  
**Store:** [vennixstore.com](https://vennixstore.com/)  
**Repository:** `Kellyray-dev/vennixstore-theme`  
**Status:** No implementation or Shopify Admin changes were made.

## Access Boundary

The public storefront was inspected, but Shopify Admin/theme-development access is not available. The instructions below identify the repository wiring and the Admin actions required. Live configuration must be checked in Shopify Admin before applying changes.

# Blocker 1: Homepage SEO Metadata

## Current live value

The homepage currently exposes this meta description:

> Shop Vennix for the latest phone accessories, home essentials, and more. Discover quality products at great prices — your one-stop destination for everyday must-haves.

Required replacement:

> Discover modern clothing and active essentials designed for everyday movement. Shop versatile styles at VennixStore.

## Where the blocker lives

**Primary source: Shopify Admin store SEO description.**  
**Theme role: renders the Shopify value.**

Repository evidence:

- `layout/theme.liquid` emits `<meta name="description">` from Shopify's `page_description`.
- `snippets/meta-tags.liquid` uses `page_description` first and falls back to `shop.description`.
- The repository SEO documentation identifies Shopify's Search engine listing fields as the canonical SEO source.

Therefore, the live legacy phrase is most likely the Shopify Admin homepage/store description, not a hard-coded phrase in the theme. A theme code search did not find the old phone-accessories sentence.

## How to fix

### Recommended Admin fix

1. In Shopify Admin, open **Online Store → Preferences** (or the store's **Search engine listing / SEO** settings location in the current Admin UI).
2. Locate the homepage **Title and meta description** / store SEO description field.
3. Replace the description with:

   `Discover modern clothing and active essentials designed for everyday movement. Shop versatile styles at VennixStore.`

4. Save the change.
5. Confirm the homepage's search-engine listing preview reflects the new text.

Shopify Admin labels can vary by Shopify version; the authoritative target is the homepage/store search-engine meta description that populates Liquid's `page_description`.

### Theme-code fallback

Do not hard-code this description into `layout/theme.liquid` or `snippets/meta-tags.liquid` unless the merchant explicitly chooses a code-owned SEO policy. A hard-coded fallback would override or bypass merchant-controlled SEO fields and could affect markets, templates, or future page-specific metadata.

If a code-owned fallback is explicitly approved, it would be implemented in the `page_description`/meta-description logic in `layout/theme.liquid` or `snippets/meta-tags.liquid`, guarded to the homepage only. That is not recommended while Shopify Admin remains the canonical SEO source.

## Access required

- **Required:** Shopify Admin access to change the live SEO description.
- **Theme code update:** Not required for the normal fix.

## Verification

1. Open `https://vennixstore.com/` in a fresh browser session.
2. Inspect the document `<meta name="description">`.
3. Confirm it exactly reads:

   `Discover modern clothing and active essentials designed for everyday movement. Shop versatile styles at VennixStore.`

4. Confirm Open Graph/Twitter descriptions also update, because `snippets/meta-tags.liquid` derives them from `page_description`.
5. Confirm the page source contains no old `phone accessories` phrase.

# Blocker 2: Contact Page 404

## Where the blocker lives

**Both Shopify Admin content and theme template wiring are involved, but the likely live failure is a missing/mismatched Shopify Page record.**

Repository evidence:

- `templates/page.contact.json` exists.
- It assigns the standard `main-page` section and `contact-form` section.
- `sections/contact-form.liquid` contains a Shopify `{% form 'contact' %}` form plus contact information settings/content.
- The header links to `/pages/contact`.
- The repository also has a generic `templates/page.json` fallback.

The existence of `templates/page.contact.json` does not create a Shopify page or guarantee that `/pages/contact` resolves. Shopify must have a published Page whose handle is exactly `contact`. If the page is missing, unpublished, or has another handle, the header link can lead to a 404 or an empty/minimal page. If a Page exists but is assigned the generic template, the contact form may also be absent even though the route resolves.

## How to fix

### Recommended Admin fix

1. In Shopify Admin, open **Online Store → Pages**.
2. Create or open the customer-facing contact page.
3. Set the page title to `Contact`.
4. Set the page handle/URL to exactly `contact`, producing `/pages/contact`.
5. Ensure the page is published/visible to the Online Store sales channel.
6. Assign the `page.contact` template if the theme editor/Page template selector exposes it.
7. Save.
8. In **Online Store → Navigation**, confirm the Contact link targets `/pages/contact`.

If the live page should use a different handle, update the navigation link to that real handle instead; do not leave a dead `/pages/contact` link.

### Theme-code status and possible code change

No missing contact template needs to be added: `templates/page.contact.json` already exists. No theme code change is required for the normal fix.

If the theme is later confirmed to be missing this file in the published theme, add a JSON template equivalent to:

```json
{
  "sections": {
    "main": {
      "type": "main-page",
      "settings": {}
    },
    "form": {
      "type": "contact-form",
      "settings": {}
    }
  },
  "order": ["main", "form"]
}
```

That file alone still does not create the Shopify Page record; Admin content and handle configuration remain mandatory.

## Access required

- **Required:** Shopify Admin access to create/publish the Page, set its handle, assign its template, and verify navigation.
- **Theme code update:** Not required in the current repository; only required if the published theme differs and lacks `templates/page.contact.json`.

## Verification

1. Open `https://vennixstore.com/pages/contact` in a logged-out browser.
2. Confirm HTTP success and a meaningful Contact page title.
3. Confirm the contact form renders with name/email/message fields and submits successfully in a controlled test.
4. Confirm the header Contact link resolves to the same URL.
5. Confirm mobile and desktop navigation both reach the page.

# Blocker 3: Shipping Policy Page 404

## Where the blocker lives

**Primary source: Shopify Admin policy configuration.**  
**Theme role: renders Shopify policy content and links to the configured policy route.**

The expected route is:

`https://vennixstore.com/policies/shipping-policy`

The public route returned 404 during the live audit.

## Repository findings

- There is no theme template that can create `/policies/shipping-policy`.
- `templates/page.json` and `templates/page.contact.json` are page templates, not Shopify policy-route templates.
- The theme can render policy links through Shopify's policy objects/routes, but policy content and route availability are Admin-managed.
- The repository contains shipping-progress and shipping-assurance components, but these do not create a shipping policy page or shipping rates.

## How to fix

### Recommended Admin fix

1. In Shopify Admin, open **Settings → Policies**.
2. Locate **Shipping policy**.
3. Add or restore the complete shipping policy content, including applicable regions, processing times, delivery estimates, exclusions, duties/taxes, and contact instructions.
4. Save the policy.
5. Confirm the policy is available to the Online Store and that Shopify exposes the standard shipping-policy route.
6. In **Online Store → Navigation** and the footer policy links, ensure the target uses Shopify's shipping policy link rather than a stale custom URL.

If Shopify's policy editor is not available for the store configuration, create a published Online Store Page with a stable handle such as `shipping-policy`, update navigation/footer links to `/pages/shipping-policy`, and clearly label it as the shipping policy. This is a fallback content architecture, not the preferred standard `/policies/shipping-policy` route.

### Theme-code status and possible code change

No theme policy template should be added for the standard `/policies/shipping-policy` route. Adding a Liquid template cannot create a Shopify policy object or repair an Admin policy route.

A theme-code update may be needed only if inspection of the published theme shows a hard-coded stale link or a custom footer link that does not use Shopify's policy URL. The current repository's policy link infrastructure should be checked against the published theme before changing it.

## Access required

- **Required:** Shopify Admin access to configure the shipping policy and confirm its storefront availability.
- **Theme code update:** Usually not required. Only required if the published theme has an incorrect hard-coded link or differs from this repository.

## Verification

1. Open `https://vennixstore.com/policies/shipping-policy` in a logged-out browser.
2. Confirm HTTP success and a visible shipping policy heading/content.
3. Click the footer shipping-policy link from the homepage, product page, cart, and mobile layout.
4. Confirm the page explains shipping terms consistent with the visible `$50` free-shipping messaging.
5. Test the link in a fresh session and confirm it does not depend on customer login or cart state.

# Fix Ownership Summary

| Blocker | Primary owner | Repository status | Required action |
| --- | --- | --- | --- |
| Homepage SEO description | Shopify Admin | Theme already renders `page_description` | Update homepage/store SEO description |
| Contact page | Shopify Admin page + template assignment | `templates/page.contact.json` already exists | Create/publish Page with handle `contact`; assign contact template |
| Shipping policy | Shopify Admin policy settings | No policy template can create the route | Configure/publish Shipping policy; verify policy link |

# Final Status

All three blockers are primarily live-store configuration/content issues, not missing implementation in the current repository. Shopify Admin access is required to apply and verify the normal fixes. Do not claim these blockers are resolved until the three public URLs and the homepage metadata are rechecked after the Admin changes.

**STATUS: DIAGNOSED — IMPLEMENTATION DEFERRED PENDING SHOPIFY ADMIN ACCESS**
