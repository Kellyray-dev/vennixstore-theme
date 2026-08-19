# VennixStore — Order & Shipping Notification Branding

Shopify transactional emails (order confirmation, shipping confirmation, delivery
updates, customer account emails) are **not** controlled by theme Liquid files.
They are managed per-store in the Shopify Admin. This document clearly separates
what is controlled where, and provides the exact admin actions required.

---

## A. Theme-Controlled Branding (this repository)

These affect only the **storefront** (public website), not Shopify email templates:

| Item | Where | Status |
|------|-------|--------|
| Store logo in header | `sections/header.liquid` | Uses `settings.logo` or `vennix-logo.svg`; alt now uses `shop.name` |
| Theme color (browser tab) | `layout/theme.liquid` | Fixed to charcoal `#1a1a1a` (Vennix palette) |
| Custom design CSS | `layout/theme.liquid` | Now loads `vennix-custom.css` + `vennix-enhancements.css` |
| SEO/brand JSON-LD | `snippets/vennix-seo-jsonld.liquid` | Now uses `shop.name` dynamically |
| Social links (Open Graph) | `snippets/meta-tags.liquid`, settings | Uses `settings.social_*_link` |

Theme changes **do not** change the content or look of Shopify's email templates.
To brand the transactional emails you must use the Shopify Admin (section B below).

---

## B. Shopify Admin Notification Settings (Required)

These are manual actions in Shopify. **You must be logged in to the Shopify admin.**

> Click path: **Shopify Admin → Settings → Notifications**

### 1. Header / branding in emails
- **Email logo**: upload the VennixStore logo so it appears at the top of all
  transactional emails.
- **Brand color**: set the accent/button color to match the Vennix palette
  (gold `#c9a96e` / charcoal `#1a1a1a`).

### 2. Sender / contact information
- **Sender email**: the "Reply-to" / sender address customers see.
  If you have verified custom email (`vennixstore.com`), use that here.
- **Sender name**: set to "VennixStore" so it is recognizable in inboxes.

### 3. Order confirmation
- **Order confirmation**: verify logo, brand color, store URL, order summary layout.
- Ensure the email includes support/contact information (email/phone from
  **Settings → Store details**).

### 4. Shipping confirmation
- **Shipping confirmation**: verify carrier/tracking link behaviour.
- Ensure the email uses branded logos and includes contact info.

### 5. Delivery / update emails
- **Fulfillment/update email**: review the template for the latest status text.
- Confirm tracking links and return-policy link are present where appropriate.

### 6. Customer account emails
- **Customer account creation / password reset**: verify these are branded and
  link back to the correct account URLs.

### 7. Legal footers
- Emails often include links to policies (refund, shipping, privacy, terms).
  Enable the relevant pages under **Settings → Policies / Legal** so these links
  resolve correctly.

---

## C. Email-Domain / DNS Configuration (Cloudflare + registrar)

Transactional email deliverability depends on DNS records for the sending domain.
See `docs/email-security-setup.md` for SPF, DKIM, and DMARC details.

---

## Admin Action Checklist (concise)

- [ ] **Shopify Admin → Settings → Notifications** — upload VennixStore email logo.
- [ ] Set brand/accent color to the Vennix gold/charcoal palette.
- [ ] Set sender name to "VennixStore"; confirm sender email address.
- [ ] Review **Order confirmation** template (logo, contact info, store URL).
- [ ] Review **Shipping confirmation** and **Fulfillment/update** templates.
- [ ] Review **Customer account** emails (creation, password reset).
- [ ] Confirm **Store details** (Settings → Store details) has email, phone, address.
- [ ] Confirm refund/shipping/privacy/terms policies exist under **Settings → Legal**.

> Important: Do not rely on theme Liquid edits to change Shopify email templates.
> Every template change listed above must be completed in the Shopify Admin.
