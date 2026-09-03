# VennixStore V2 — Phase 4 Report (Editorial Homepage + Motion System + Auto-Image)

**Branch:** `arena/01a066da-vennixstore-theme` — homepage-only scope (plus additive shared polish, namespaced).
**Phase 4 goal:** transform the existing Shopify OS 2.0 homepage into a premium, editorial, fashion-first storefront for **Modern Clothing & Active Essentials** — quiet purposeful motion, automatic image provisioning for every visual slot, full Theme Editor compatibility, and no rebuild (Dawn remains the underlying template engine and commerce layer).

---

## 1. Files changed

### Sections (5 rewritten + 1 Dawn section adapted)
| File | Change |
|---|---|
| `sections/vennix-hero.liquid` | Split editorial hero: full-bleed media frame, cream wash, eyebrow + display heading, two CTAs; bundled fallbacks inside `<picture>` (mobile `<source>` + desktop img, both merchant-replaceable); scroll cue only when benefit blocks exist; Motion schema group with clearer labels; legacy tech-era labels removed |
| `sections/vennix-trust-bar.liquid` | Quiet assurance strip (3 items max); icon/copy/border polish hooks; entrance motion + duration settings; `[threshold]` token from Theme settings |
| `sections/vennix-category-grid.liquid` | Sharp editorial category tiles (16:11 → desktop 3:2.6), caption below image, hairline + gold underline CTA; collection/custom-image/asset fallback chain; motion group |
| `sections/vennix-brand-story.liquid` | Asymmetric 60/40 editorial story (image left, offset copy right); motion group + desktop media parallax toggle |
| `sections/vennix-newsletter.liquid` | Quiet closing band: kicker + restrained heading + underline field; motion group |
| `sections/featured-collection.liquid` | Homepage-only additive gates: new **Eyebrow** text setting (rendered as editorial kicker above the title), **Image fallback** group (`fallback_image` picker + `fallback_asset`), **Motion** group (`enable_entrance_animation` checkbox gated *with* the global “Reveal on scroll” setting); filter-terms copy neutralised |

### Snippets
| File | Change |
|---|---|
| `snippets/card-product.liquid` | Additive no-media branch: when a render passes `no_media_image` / `no_media_asset`, a product with no photos of its own gets the section-level placeholder media instead of a bare text card; outer `card` and `card__inner` ratio conditionals updated so fallback media reserves the exact same aspect wrap as real media (both `card` and `standard` styles). All other call sites unchanged |

### Assets
| File | Change |
|---|---|
| `assets/vennix-motion.js` (new, 8 KB) | Shared dependency-free motion engine: IntersectionObserver reveals + optional desktop parallax, reduced-motion & toggle gated, focusin force-reveal, immediate reveal for items already in viewport at load, idempotent (`window.__vennixMotionLoaded`) |
| `assets/vennix-hero.js` | Scroll-only rAF parallax for the hero frame (parallax drift deleted); gated by `data-motion`, `prefers-reduced-motion`, ≥990 px |
| `assets/section-vennix-hero.css` | Full Phase-4 hero stylesheet: split layout, wash/grain, editorial type, scroll cue, assurance strip, load settle + parallax, mobile stacked layout, reduced-motion overrides |
| `assets/vennix-brand.css` | Shared tokens/patterns: scheme-aware eyebrow (AA contrast per band), trust strip redesign, newsletter band redesign, scheme-aware card hover shadow (no wrapper transform) |
| `assets/vennix-brand-2.css` | Motion + type + space tokens; `.vx-rise` reveal contract; design-mode static override; Dawn featured-grid cascade cap (≤ 5 × 45 ms); homepage featured-collection opener styling; hover-lift quieted to −0.4rem; stale/duplicated hero & legacy trust rules removed |
| `assets/dark-mode.css` | Scheme-correct parity for redesigned sections (hairlines `--v-border`, trust icons gold, category media surface, newsletter raised surface + gold focus border, gold eyebrow wins by specificity) — no stale copy overrides |
| `assets/vennix-product-fallback.jpg` (new, 88 KB) | 928×1152 portrait editorial placeholder for products without photos |

### Templates
| File | Change |
|---|---|
| `templates/index.json` | Homepage order: hero → trust bar → **featured collection (“The edit”)** → categories → brand story → newsletter; all content rewritten apparel/active-only (no tech/home/marketplace messaging — legacy `gadget…clipper` filter terms removed); per-section motion defaults on; newsletter editorial copy |
| `layout/theme.liquid` | Unchanged (brand CSS/dark-mode already loaded globally; motion JS stays per-section — see §7) |

**Docs:** `deliverables/PHASE4_IMPLEMENTATION_PLAN.md` (plan), this report.

---

## 2. Image map — every visual slot provisioned

| Slot | Out of the box | Wired through | Fallback chain | Alt | Lazy | Flagged replaceable |
|---|---|---|---|---|---|---|
| Hero — desktop | `editorial-hero-desktop.jpg` (1408×768, bundled) | `vennix-hero` → `desktop_image` (picker) | picker → bundled asset | section alt → image alt | eager + high priority | ✓ picker info |
| Hero — mobile | `editorial-hero-mobile.jpg` (768×1376, bundled) inside `<picture>` `<source>` | `mobile_image` (picker) | picker → bundled portrait | same as above | part of hero | ✓ picker info |
| Category tiles ×3 | `womens-fashion.jpg` / `mens-fashion.jpg` / `active-essentials.jpg` (1408×768, bundled) | block → `collection` + `image` (picker) + `image_asset` | picker → collection image → bundled asset | tile title | lazy | ✓ picker + asset info |
| Brand story | `activewear.jpg` (1408×768, bundled) | `image` (picker) + `image_asset` | picker → bundled asset | heading text | lazy | ✓ picker + asset info |
| Featured products | each product’s real media | n/a (Dawn media) | — | product alt | lazy | n/a |
| Product with **no** media | `vennix-product-fallback.jpg` (928×1152, generated) | featured-collection → `fallback_image` (picker) + `fallback_asset` | picker → bundled asset | “{product title} — placeholder image” | lazy | ✓ picker info |
| Newsletter | none (type-led) | — | — | — | — | — |

Notes: no merchant-selected image is ever overwritten (picker wins everywhere). Generated fallback is only ever rendered for products that genuinely have no image of their own — never a fake photo of a real product. Generated imagery is on-brand (charcoal/cream/muted-gold wardrobe editorial, generic figures, no logos/text/watermarks) and ships as theme assets wired through image-picker settings — identical wiring serves Shopify Files the moment a merchant picks an image (no live store reachable from this sandbox).

---

## 3. Hero rationale

The hero is the single oversized-display-heading moment on the viewport (all other sections use the restrained section scale):

- **Desktop (≥750 px): split editorial composition** — full-bleed image on the right, cream scrim fading out at ~64%, charcoal copy on the left. One display heading (`Modern Clothing. Made for Movement.`), muted gold rule, single primary CTA + hairline underline secondary. Image focus follows merchant `image_focus`; wash strength follows merchant overlay control.
- **Mobile (<750 px): separate stacked layout** — full-bleed 4:5 image first, copy on plain cream *below* the image (never overlaid on imagery, so crop/contrast collisions are impossible), full-width primary button.
- **Motion:** one quiet entrance — copy fades + rises 8 px (staggered 60/150/240/330 ms) and the image settles 1.0→1.03 once on load (CSS, no CLS, ≤800 ms). No infinite loops anywhere. Desktop ≥990 px adds a gentle rAF scroll parallax on the media frame (transform only, off-screen unobserved). Every effect is gated by the Theme-Editor `enable_motion` toggle and `prefers-reduced-motion`; content is never hidden in the initial state without JS and reveals never hide keyboard focus.
- Typography: eyebrow 1.05rem/600/0.22em caps + gold rule; heading `var(--vennix-type-display)` clamp(5rem, 6.8vw, 8.8rem), −0.045em, balance; body lead ~1.6–1.8rem/1.6. Ratio band 1.25–1.333 maintained through the `--vennix-type-*` tokens.
- Scroll cue renders only when the merchant also adds shopping-benefit blocks (dead anchor case removed).

---

## 4. Merchandising & content hygiene

- Homepage rhythm: **loud hero → quiet trust → mid product grid (“The edit”) → loud category tiles → calm asymmetric story → quiet dark newsletter.** The two loud image moments (products, tiles) never sit adjacent; the editorial image is separated from the tiles by the product grid.
- All copy is apparel/active only. Legacy tech/home/marketplace terms (incl. the `gadget…clipper` curation list) were removed from `templates/index.json`, section copy, schema examples, and comments. Full scan clean.
- Categories/CTAs/links/titles/benefits remain merchant-configurable through blocks + settings + collections (`shopify://` links and `collection`/`link`/`image` block fields) — nothing hardcoded.
- No invented claims, reviews, UGC, scarcity, or sale numbers. Free-shipping wording pulls the real threshold from Theme settings via `[threshold]`.
- Badge vocabulary already constrained to best-seller / new-arrival / limited-edition tag-driven labels.

---

## 5. Shared template polish (additive, namespaced, verified on all pages)

| Item | Where | Notes |
|---|---|---|
| Motion & type/space tokens | `vennix-brand-2.css` root | `--vennix-motion-*`, `--vennix-type-*`, `--vennix-space-*`; defaults keep Dawn behaviour when unused |
| Reveal utilities | `vennix-brand-2.css` | `.vx-rise` / `.vx-rise--in` + `[data-vx-motion]` contract; no-JS/reduced-motion/design-mode safe |
| Card hover lift | `vennix-brand.css` / `vennix-brand-2.css` | single micro-lift on `card__inner` only; Dawn `animate--hover-vertical-lift` tamed −0.75rem → −0.4rem; wrapper transform removed (no double lift); box-shadow fallback kept |
| Card no-media fallback media | `snippets/card-product.liquid` | only when callers pass fallback params (featured-collection homepage use); aspect reserved in both card styles |
| Eyebrow pattern | `vennix-brand.css` | scheme-aware AA contrast on all 5 colour schemes incl. dark mode |
| Homepage featured-collection opener | `vennix-brand-2.css` (`.template-index …` scoped) | kerned heading, 62rem tinted description, 4.4rem view-all breathing room, cascade delay cap ≤ 5×45 ms |

Verified scope: rules are additive or `.template-index`-scoped; product/collection/search/cart/recommendation templates were not restructured (theme-check clean, all 183 files, single pre-existing warning — §8).

---

## 6. Animation inventory (per-animation motion table)

All: transform/opacity only, cancellable, non-blocking, ≤800 ms, zero CLS, `prefers-reduced-motion` static, per-section Theme-Editor toggle.

| # | Element | Motion | Trigger | Duration | Toggle (schema id) | Reduced motion |
|---|---|---|---|---|---|---|
| 1 | Hero copy (eyebrow/heading/text/actions) | fade + 8 px rise, stagger 60–330 ms | page load, CSS-only | 560 ms | `enable_motion` | static |
| 2 | Hero image | settle scale 1.0→1.03 (once) | page load | 800 ms | `enable_motion` | static |
| 3 | Hero media frame | vertical parallax (≤ ~6rem drift) | scroll ≥990 px, rAF | n/a (scroll-bound) | `enable_motion` | static |
| 4 | Trust items | fade + rise, stagger 45 ms | IO | 560 ms | `enable_entrance_animation` (+`motion_duration`) | static |
| 5 | Featured-collection heading/desc/cards | Dawn slide-in + cascade, delay capped ≤5×45 ms | IO (Dawn engine) | 500 ms | `enable_entrance_animation` AND global reveal setting | static (Dawn) |
| 6 | Category opener + tiles | fade + rise, stagger ≤3×45 ms | IO | 560 ms | `enable_entrance_animation` (+`motion_duration`) | static |
| 7 | Brand-story media/copy | fade + rise stagger 0–3×45 ms | IO | 560 ms | `enable_entrance_animation` (+`motion_duration`) | static |
| 8 | Brand-story media parallax | scale 1.06→1.11 (desktop) | scroll ≥990 px | scroll-bound | `enable_parallax` (+motion gates) | static |
| 9 | Newsletter copy/form | fade + rise | IO | 560 ms | `enable_entrance_animation` (+`motion_duration`) | static |
| 10 | Card image hover zoom / badge-free lift | scale ~1.02–1.04, translateY −0.4rem, arrow nudges | hover/focus-visible | 240–550 ms | Dawn hover setting + `motion-reduce` | kept |

Engine notes: `vennix-motion.js` reveals only inside `.js`-enabled, motion-enabled scope (`vx-motion-ready` added by JS after parse; IO missing → never hidden; `focusin` force-reveals; above-the-fold items revealed in the same task so nothing flashes hidden). Dawn featured-collection continues to use Dawn’s own `scroll-trigger` engine (gated by both toggles). No marquee/loops implemented (announcement bar remains static per plan).

---

## 7. Mobile / accessibility / performance notes

- **Mobile is a separate layout**, not a squashed desktop: hero stacks (image → copy on cream, 4:5 media, full-width CTA); category tiles 1-col→3-col; story stacks image-first; trust items 3-up with ellipsis-safe copy; featured grid 2-up swipe-free.
- **A11y:** semantic landmarks + `aria-labelledby` on hero/story; section `aria-label`s; forms labelled (`visually-hidden` label + error `role="alert"`); badges sold-out/sale stay screen-reader wired via `aria-labelledby`; focus never hidden by reveals (`focusin` force-reveal, transform/opacity-only so tab order intact); hover effects all have `:focus-visible` twins; reduced motion returns full static content with `!important` safety; eyebrow colour AA per band incl. dark mode.
- **Perf:** one 8 KB shared motion script (idempotent, per-section defer includes — kept per-section so non-homepage templates don’t pay; cached after first hit); hero eager/high-priority with explicit w/h; every below-fold image lazy with width/height (no CLS) and srcset/sizes; fallback images carry intrinsic dims; animations compositor-friendly; no dependencies, no build step, no layout-thrash loops (single rAF throttle; off-screen unobserved).

---

## 8. Validation outputs

| Check | Result |
|---|---|
| Official Shopify theme check (`shopify theme check`, 183 files) | **1 warning only** — pre-existing `sections/main-product.liquid:644` UndefinedObject `continue` (untouched, Phase-1 baseline). Zero offenses in all Phase-4 files |
| JSON parse `templates/index.json` | PASS |
| Settings/blocks cross-check vs embedded schemas (all 6 homepage sections) | PASS — every key exists, block types valid |
| Schema select option defaults (options exist incl. value) | PASS |
| Legacy-content scan (gadget/usb/electronics/phone/charger/appliance/marketplace/smart-home/…) across homepage files | PASS — clean |
| `node --check` on `vennix-motion.js`, `vennix-hero.js` | PASS |
| Duration-token wiring (`motion_duration` → `--vennix-motion-duration` inline) | PASS |
| `git diff --check` (whitespace) | PASS |
| Dark-mode parity pass | scheme-aware counterparts for every new homepage style |

---

## 9. Before / after architecture

| | Before (Phase 3 homepage) | After (Phase 4) |
|---|---|---|
| Hero | glass dark panel over image; infinite 18 s drift; unscoped reveal; duplicated CSS | split cream/image editorial composition; single quiet entrance + parallax; motion-scoped CSS in one file |
| Homepage order | trust → categories → products → story → newsletter | hero → trust → **products (The edit)** → categories → story → newsletter (deliberate loud/quiet rhythm) |
| Motion | mixed engines, global-only gates | one 8 KB utility (`vennix-motion.js`) + Dawn engine for featured-collection; every animated section has its own Theme-Editor toggle + duration; unified reduced-motion contract |
| Reveal safety | content could be hidden before JS | visible-by-default; hidden only inside `.js` + motion + ready scope; IO/focusin/reduced-motion/design-mode all handled |
| Imagery | mixed bundled refs, no flagging | every slot provisioned via picker → asset fallback, flagged “replace with your own photography”, dims/srcset/lazy correct; product no-media cards get editorial placeholder |
| Typography | mixed sizes/weights across sections | token scale (1.25–1.333 band), one display heading per viewport (hero), section openers (kicker + restrained heading + short intro) everywhere |
| Identity | cream/charcoal/gold partially applied | cohesive tokens; muted gold as accent only; dark mode unrestricted parity |
| Content | residual tech/home/marketplace copy & filter terms | apparel & active essentials only, merchant-configurable |

**Phase 4 is complete. Per instructions, work stops here — no Phase 5 (collection/search merchandising, wishlist, recently viewed, size guide, compare, back-in-stock, lookbook, UGC, QA/Theme-Store review) has been started.**
