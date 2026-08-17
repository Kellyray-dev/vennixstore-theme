# VennixStore — Email Security & Deliverability (SPF / DKIM / DMARC)

Email security and deliverability are configured at the **DNS level**, not in the
theme. This repository includes **no DNS changes**. The steps below are for the
person who controls the domain DNS (Cloudflare + registrar) and the Shopify admin.

The user has already **authenticated the custom email domain `vennixstore.com`**
with **Shopify Email domain authentication** successfully. The remaining work is
verification and, where needed, adding the missing DNS records.

---

## What each mechanism does

| Mechanism | Purpose |
|-----------|---------|
| **SPF** (Sender Policy Framework) | `TXT` record listing servers allowed to send mail for the domain. Prevents spoofing. |
| **DKIM** (DomainKeys Identified Mail) | `TXT` record with a public key. Shopify signs outbound mail so receivers can verify it. |
| **DMARC** (Domain-based Message Authentication, Reporting & Conformance) | `TXT` record at `_dmarc.` telling receivers what to do (reject/quarantine) when SPF/DKIM fail, and where to send reports. |
| **Return-Path / CNAME** | Optional; used by some providers for bounce handling. |

---

## Shopify Email domain authentication

Shopify provides the exact DNS values to add. When you set up the custom domain:

1. **Shopify Admin → Settings → Notifications → Custom sender email / Email domain**
2. Shopify generates a **DKIM** `CNAME` (or `TXT`) record and an **SPF** include for you.
3. Add those records exactly as supplied, in **Cloudflare → DNS → Records**.
4. In Shopify, click **Verify**. Wait for propagation (can take up to 24–72 hours).

> If Shopify previously asked you to add specific SPF/DKIM/TXT records for
> `vennixstore.com`, confirm they are still present and unchanged in Cloudflare.

---

## DNS records to verify in Cloudflare (zone: vennixstore.com)

### SPF (TXT)
```
Name:  vennixstore.com
Type:  TXT
Value: v=spf1 include:... -all   (use the value Shopify provided)
Proxied: DNS only (not proxied)
```

### DKIM (CNAME or TXT, as Shopify supplied)
```
Usually a CNAME such as:
Name:  <selector>._domainkey
Target/Value: <value provided by Shopify>
```

### DMARC (TXT) — recommend adding if not present
```
Name:  _dmarc
Type:  TXT
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@vennixstore.com; fo=1; adkim=r; aspf=r
```
> Start with `p=none` while monitoring reports, then move to `p=quarantine`,
> then optionally `p=reject` once you are confident legitimate mail passes.

---

## Cloudflare settings to review

- **SSL/TLS**: set to **Full (strict)** so HTTPS is enforced end-to-end.
- Add the DNS records **without proxy (DNS only)** for mail records (SPF/DKIM/DMARC
  are TXT/CNAME and cannot be proxied).
- If using **Cloudflare Email Routing** for `vennixstore.com`, it typically adds an
  `MX` record and a **TXT SPF record** for `sendyour.email`/email routing. Keep those
  in sync with Shopify's SPF include so both can send legitimately.

---

## Verification tools

- SPF/DKIM/DMARC lookups: `https://mxtoolbox.com` (SPF, DKIM, DMARC lookup)
- DMARC report parsing: `https://dmarcian.com` / `https://google.com/postmaster`
- Check Shopify help: https://help.shopify.com/en/manual/marketing/shopify-email

---

## Admin Action Checklist (concise)

- [ ] Confirm Shopify's DKIM CNAME/TXT for `vennixstore.com` exists in Cloudflare.
- [ ] Confirm Shopify's SPF include exists in Cloudflare TXT record.
- [ ] Add a DMARC `TXT` record at `_dmarc` if not present (start `p=none`, then tighten).
- [ ] Set Cloudflare SSL/TLS to **Full (strict)**.
- [ ] Verify with mxtoolbox.com (SPF, DKIM, DMARC).
- [ ] If using Cloudflare Email Routing, confirm its MX + SPF coexist with Shopify's.

> DNS changes are NOT part of theme code. Do not attempt to fake or simulate
> Cloudflare DNS changes in this repository.