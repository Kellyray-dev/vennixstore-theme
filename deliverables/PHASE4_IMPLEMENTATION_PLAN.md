# VennixStore V2 — Phase 4 Implementation Plan (Editorial Homepage + Motion + Auto-Image)

**Branch:** `arena/01a066da-vennixstore-theme` — homepage only.

## 1. Audit classification (active homepage sections)

| Section | Status | Verdict |
|---|---|---|
| `vennix-announcement-bar` (header group) | Working | Brand message on all pages; keep as-is |
| `vennix-hero` | Partial | Good bones (picture/wash/assurance hooks, image pickers). Conflicts: dark glass panel + white text vs cream gradient; infinite 18s image drift (not in motion vocabulary); untoggled content reveal; dead scroll-cue anchor (no blocks on homepage); duplicated hero CSS in `vennix-brand-2.css`; fallback images not in `<picture>` |
| `vennix-trust-bar` | Partial | Quiet strip is right, but mobile = invisible swipe strip; icon circles/borders dated; no reveal; duplicated concept with hero assurance blocks (hero has none on homepage — fine) |
| `vennix-category-grid` | Working/Weak | Rounded card + shadow + overlay text on image; no entrance motion; `image_asset` text field not merchant-friendly |
| `featured-collection` (Dawn) | Working | Homepage-only use; motion gated only by global Theme settings (no per-section gate); stagger cascade delay runs 8×75 ms; heading hierarchy fine but plain |
| `vennix-brand-story` | Working/Weak | Rounded+shadow "card" look, oversized heading, no motion, no replace-flag |
| `vennix-newsletter` | Working/Weak | Shouty caps defaults; oversized display heading; no motion |
| `rich-text`, `image-with-text`, `multicolumn`, `vennix-why-us` | Inactive on homepage | Not touched |

Homepage order kept: announcement → hero → trust → featured products → categories → story → newsletter (the two loud image grids are separated by the quiet trust bar / whitespace rhythm; categories + story kept apart by product grid). → **Wait:** current order is trust → categories → products → story. Final order after reorder (JSON): trust → **new-in apparel (products)** → categories → story → newsletter. Rationale: hero CTA is shop-led; products directly after reassurance; categories become discovery after curation; loud tiles are not directly adjacent to the editorial image because of the product grid between them.

Actually — final decision: keep **categories after products** per Section 3 guidance (featured/collection first, then category discovery). Verified rhythm: loud hero → quiet trust → mid products → loud categories → calm asymmetric story → quiet dark newsletter.

## 2. Design tokens added (`assets/vennix-brand-2.css`)

- Motion: `--vennix-motion-duration: 560ms`, `--vennix-motion-duration-fast: 240ms`, `--vennix-motion-ease`, `--vennix-motion-rise: 8px`, `--vennix-motion-stagger: 45ms` (40–60 ms band).
- Reveal utility classes `[data-vx-motion] .vx-rise` (hidden state applied ONLY by JS-added `vx-motion-ready` class → no-JS safe; `prefers-reduced-motion` forces static; section toggle `data-vx-motion="false"` never hides).
- Shared editor-opener + headline sizing tokens used by every homepage opener.

## 3. Motion map

| Element | Motion | Trigger | Toggle (schema) | Reduced motion |
|---|---|---|---|---|
| Hero text block | fade + 8 px rise, staggered ≤ 0.35 s | on load (CSS only) | `enable_motion` (exists) | static |
| Hero image | scale 1.0 → 1.03 once + gentle vertical parallax (desktop ≥ 990) | load + scroll (rAF) | `enable_motion` (exists) | static |
| Trust bar items | fade + rise, stagger 45 ms | IntersectionObserver | `enable_entrance_animation` (new) | static |
| Featured collection (Dawn) | Dawn slide-in + cascade, delay capped ≤ 5 × 45 ms | IO (Dawn) | `enable_entrance_animation` (new, combined with global setting) | static |
| Category opener + tiles | fade + rise stagger ≤ 3 | IO | `enable_entrance_animation` (new) | static |
| Brand story opener/media | fade + rise; media parallax desktop | IO + scroll | `enable_entrance_animation`, `enable_parallax` (new) | static |
| Newsletter | fade + rise | IO | `enable_entrance_animation` (new) | static |
| Card hover zoom / button arrows | scale 1.02–1.05, arrow nudge (hover/focus) | hover/focus | n/a (motion-reduce) | kept |
| Announcement bar | static (no infinite loops anywhere) | — | — | — |

Shared engine: one new file `assets/vennix-motion.js` (IntersectionObserver + focusin safety + parallax binding, reduced-motion & toggle gated, idempotent). No dependencies.

## 4. Image map (sourcing decision)

No merchant-selected images exist in `templates/index.json` — every slot currently uses a bundled fallback, so all slots are replaceable defaults.

| Slot | Source | Lives in settings | Alt |
|---|---|---|---|
| Hero desktop | Reuse bundled `editorial-hero-desktop.jpg` | `vennix-hero` → `desktop_image` (picker) | "Modern clothing and active essentials editorial" |
| Hero mobile | Reuse bundled `editorial-hero-mobile.jpg` | `vennix-hero` → `mobile_image` (picker) | same |
| Category tiles ×3 | Reuse bundled `womens-fashion.jpg`, `mens-fashion.jpg`, `active-essentials.jpg` | blocks → `image` (picker) w/ collection-image fallback | tile titles |
| Brand story | Reuse bundled `activewear.jpg` | `vennix-brand-story` → `image` (picker) | heading text |
| Product cards | Product media (dynamic) | n/a | product alt |
| Product no-media fallback | **Generated** editorial placeholder | featured-collection → `fallback_image` (picker) | product title |
| Newsletter | No visual (type-led layout) | n/a | n/a |

All generated/replaced imagery: replaceable flag in picker info ("Placeholder — replace with your own photography"), width/height attributes, lazy below fold.

**Shopify Files note:** no live store is reachable from this sandbox, so new imagery is delivered as theme assets under `assets/` and wired through `image_picker` settings + asset fallbacks — the identical wiring automatically uses Shopify Files the moment a merchant picks an image. Same convention as Phases 1–3.

## 5. Files touched

Sections: `vennix-hero`, `vennix-trust-bar`, `vennix-category-grid`, `vennix-brand-story`, `vennix-newsletter`, `featured-collection` (homepage-only use; additive gate), `templates/index.json` (order + newsletter copy + scroll-cue off).
Assets: `vennix-motion.js` (new), `section-vennix-hero.css`, `vennix-hero.js`, `vennix-brand.css` (trust/newsletter/eyebrow), `vennix-brand-2.css` (tokens, reveals, remove stale hero/vx duplicates), `dark-mode.css` (parity for redesigned sections), product placeholder jpg (new).
Docs: `deliverables/PHASE4_IMPLEMENTATION_PLAN.md`, this repo's final report in chat.
