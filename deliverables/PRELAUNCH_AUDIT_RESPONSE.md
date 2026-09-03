# Pre-Launch Audit — Developer Response

**Date:** 2026-09-03
**Scope:** Full audit of theme code + live storefront (vennixstore.com) against the pre-launch audit request.
**Status:** All theme-level items **implemented on this branch**. Items requiring Shopify Admin or Shopify Support are listed with exact steps.

---

## Answers to your timeline questions

1. **When can you start?** — Started; everything fixable in theme code is done in this PR.
2. **ETA for Priority 1** — P1.2 and P1.3 are code-verified complete (see findings — several audit assumptions didn't hold). P1.1 is a Shopify Support ticket that only the store owner/support can resolve (~1 business day).
3. **ETA for Priority 2** — Merchandising + size guide are implemented here. Test checkout is an Admin task (steps below, ~30 min).
4. **Blockers** — Need store owner action on 4 Admin items (marked **[ADMIN]** below) and 1 Support ticket (**[SUPPORT]**).

---

## Priority 1 — Critical technical issues

### P1.1 — X-Frame-Options / CSP blocking Shop Pay ✅ confirmed, **[SUPPORT]**

- Confirmed: this cannot be set or unset from theme code — Shopify serves storefront response headers at the platform level.
- Verified live: Shop Pay **is rendering** on product pages ("Pay over time… with Shop", "Buy with · More payment options", Affirm installments messaging). So dynamic checkout buttons are alive; the exposure is specifically iframe-embedded flows.
- **Action (store owner):** Shopify Admin → Help Center → contact support → request review/removal of `X-Frame-Options: DENY` / `frame-ancestors 'none'` on the storefront domain, referencing Shop Pay iframe checkout. Fallback (as you noted): Shop Pay opens full-page checkout instead of a modal — conversion impact is then minimal.
- Note: if the headers were observed via a third-party scanner, re-verify in a normal browser session — some scanners receive stricter headers than real browsers.

### P1.2 — Orphaned app scripts (403/404) ✅ audited, theme is clean — **[ADMIN] to finish**

Findings from a full sweep of the theme code:

- **Zero hardcoded third-party `<script src="https://…">` tags** exist anywhere in `layout/`, `sections/`, `snippets/`, or `templates/`. Nothing to remove at the code level.
- **App embeds currently in the theme** (`config/settings_data.json`): Judge.me (core + cart drawer widget), SEO Lab optimizer, Get Found by AI, Shopify Inbox chat.
  - Verified live: **Inbox chat is active** (chat button renders) and **Metafields Guru is active** — its block renders the "Care instructions" accordion on product pages. **Do not remove these.**
  - Unknown: SEO Lab + Get Found by AI. If either app is uninstalled, its embed is the 403/404 source.
- **Action (2 min, Admin):** Online Store → Themes → Customize → **App embeds** (left rail, 🧩 icon). For each embed whose app is NOT in Admin → Settings → Apps and sales channels → toggle it **off**. This is also where the 404'd script URLs from DevTools map 1:1 — any embed whose app no longer exists gets switched off.
- Leftover app *blocks* in templates: verified none are orphaned (the one app block on the product template belongs to Metafields Guru, which is live and rendering content).

### P1.3 — Slow third-party script loading ✅ code-verified

- Every theme-owned script in `layout/theme.liquid` and all sections already loads with `defer="defer"` (audited: 15/15 in `theme.liquid`, all section-level scripts too). Nothing render-blocking left in theme code.
- App/pixel scripts are injected server-side by Shopify (`content_for_header`) — **themes cannot add `defer`/`async` to those**. The only lever is the one in your audit: Admin → Online Store → **Web Performance**, where heavy app scripts can be toggled per-page-type. Recommended pass before scaling spend: disable non-essential apps on product/cart/checkout pages.
- Recommendation adopted: after launch, consider Sentry (or Shopify's own Web Performance dashboard) for runtime error monitoring.

---

## Priority 2 — Merchandising + UX (implemented)

### P2.1 — Homepage sections ✅ implemented (audit data was stale)

Live-crawl correction: **"Shop by Category" and a featured collection ("New in Apparel") already render on the live homepage.** What was genuinely broken: all three category tiles and the featured collection linked to `/collections/all` — no real category navigation. Fixed in `templates/index.json`:

| Tile | Now links to (verified live collection) |
|---|---|
| Women's | `/collections/womens-clothing` (42 products) |
| Men's | `/collections/mens-clothing` (26 products) |
| Everyday Essentials | `/collections/apparel` (33 products) |

- Section order updated: Hero → Trust bar → **Shop by Category** → New in Apparel → **Best Sellers** (new) → Brand story → Newsletter. Category grid now precedes the product rails for a clear navigation path.
- **New "Best Sellers" section** added (8 products, 4 columns, customer-favorites eyebrow).
  - **[ADMIN] recommendation:** once real sales exist, create an automated collection: Products → Collections → Create → *Automated*, handle `best-sellers`, condition "Product price > 0", sort **Best selling** — then re-point this section to it in Theme Editor (one dropdown). Until then it pulls the `apparel` collection.
  - Mobile: sections use the theme's existing responsive grid (2 columns on mobile); included in the QA checklist below.

### P2.2 — Size guide on product pages ✅ implemented (no app, no Admin dependency)

Built as a native theme feature — closest to your "Option C", but with A's flexibility and zero setup:

- New `size_guide` block in `main-product` renders a "Size guide" link **directly under the variant picker** (the highest-attention placement for apparel), opening an accessible modal (`modal-dialog`, ESC/backdrop close, reuses Dawn's popup-modal infrastructure).
- Content resolution order:
  1. **Block page setting** (Theme Editor → Product page → Size guide → select a page), else
  2. **Per-product metafield** `custom.size_chart` (page reference), else
  3. **Built-in default chart** — women's XS–XXL + men's S–3XL tables in inches, "how to measure" bullets, size-up guidance, contact link. Works day one on every product with no configuration.
- Styling uses theme tokens, so it follows light/dark mode and the Vennix type system; table scrolls horizontally on small screens.

### P2.3 — Test checkout flow ⏳ **[ADMIN]** (cannot be done from theme repo)

1. Settings → Payments: confirm Shop Pay, Apple Pay, Google Pay are activated; check shop eligibility messages for anything disabled.
2. Enable a test/bogus gateway if available on the plan, or place small real orders, one per method (Shop Pay dynamic button, wallet express, regular card).
3. Verify each: order appears in Admin with correct line items/price, confirmation email arrives, and the order can be refunded/archived.
4. While there: Settings → Notifications → confirm order confirmation + shipping emails are enabled and the sender address is a store domain (not `@gmail`).

---

## Store audit findings — verified against live site + code

| Area | Audit said | Verified status |
|---|---|---|
| Homepage load | ✅ | ✅ Confirmed |
| Hero section | ✅ | ✅ Confirmed |
| Navigation | ✅ | ✅ Confirmed |
| Collections | ✅ | ✅ 10 collections live (womens-clothing 42, mens-clothing 26, apparel 33, + mens-tops/pants/outerwear/suits, frontpage, fitness-active) |
| Shop-by-category links | ⚠️ (not flagged) | 🔴 All tiles → `/collections/all` → **fixed in this PR** |
| Best Sellers block | 🔴 missing | ✅ **added in this PR** |
| Size guide | 🔴 missing | ✅ **built in this PR** |
| Page speed / scripts | ⚠️ | ✅ Theme scripts 100% deferred; app scripts = Web Performance toggle pass **[ADMIN]** |
| Network 403/404 | 🔴 unknown | ✅ Theme code clean; source is app embeds → App embeds toggle **[ADMIN]** |
| CSP headers | 🔴 | ⏳ **[SUPPORT]** ticket (not theme-fixable) |
| Shop Pay | ⚠️ | ✅ Renders on PDP (incl. installments); iframe modal flow depends on P1.1 |
| Mobile UX | ⚠️ | ⏳ QA checklist below |
| Product gallery counter | (not flagged) | ⚠️ Observed "NaN / of-Infinity" in one headless crawl of a PDP — likely a crawler artifact (CSS-less rendering), but **verify on a real device**; if reproduced, it's a Dawn slider-counter bug worth a follow-up issue |

---

## Deployment & QA checklist

**Before merging/publishing (store owner):**

1. Duplicate the live theme (Online Store → Themes → ⋯ → Duplicate) — backup, as you specified.
2. Merge this PR → if GitHub sync is connected, Shopify publishes the update to the connected theme (verify the connected branch is the one this merges into; otherwise upload the ZIP of this branch as a draft theme and preview first).
3. Preview checklist (desktop + real mobile device):
   - [ ] Homepage: category tiles land on the right collections; Best Sellers renders 8 products
   - [ ] PDP: "Size guide" link under size buttons opens modal; tables readable; dark mode OK
   - [ ] PDP gallery counter shows "1 / 6" (not NaN) on mobile
   - [ ] Cart drawer, quick add, predictive search still work
   - [ ] Checkout test orders per P2.3
4. Baseline PageSpeed run on homepage + one PDP (mobile) → record score for post-launch comparison.

**Post-launch:** Sentry (or equivalent) for console errors; weekly Web Performance review while ad spend scales.
