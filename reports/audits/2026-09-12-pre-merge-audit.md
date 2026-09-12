# VennixStore — Pre-Merge Audit

**Date:** 2026-09-12
**Branch:** `arena/01a09615-vennixstore-theme`
**Base commit:** `6b0a86e` — *fix: harden product size-guide audience detection*
**Scope:** everything tracked in the repo at that commit (465 files: 117 `.liquid`, 77 `.json`,
42 JS assets, 213 files in `assets/`).

Verdict: **no merge blockers found.** The theme is lint-clean at error level, structurally
consistent, and free of undefined translations, missing assets, unknown filters and syntax
errors. Four defects were fixed in this commit (§2); the rest of this document records what
was verified and what is still open.

---

## 1. What was run

| # | Check | Command | Result |
|---|---|---|---|
| 1 | Structural consistency | `python3 scripts/validate_theme.py` | **OK**, exit 0 — template JSON, section schemas, settings and asset references consistent (after the `node_modules` fix in §2.4) |
| 2 | Liquid / JSON lint (repo config) | `@shopify/theme-check-node` 3.29.0 driven by `.theme-check.yml` | **3 offenses, 0 errors** — all `LiquidComplexity` suggestions |
| 3 | Liquid / JSON lint (every check) | same engine, `extends: theme-check:all` (84 of 85 checks on) | 861 offenses: 14 `AssetSizeJavaScript`, 844 `MatchingTranslations`, 3 `LiquidComplexity` — nothing else |
| 4 | Liquid formatting (the CI step) | `npx prettier --plugin=@shopify/prettier-plugin-liquid --check '**/*.liquid'` | 47 files differ from `.prettierrc.json`; measured delta **1,159 lines** |
| 5 | JS syntax | `node --check` over all 42 `assets/*.js` | 0 failures |
| 6 | Python syntax | `python3 -m py_compile scripts/*.py` | 0 failures |
| 7 | JSON validity | every tracked `.json` parsed | all valid (3 carry the theme-editor `/* auto-generated */` banner, which `validate_theme.py` strips) |
| 8 | Duplicate JSON keys | `object_pairs_hook` scan of all 77 JSON files | 0 |
| 9 | Runtime translation keys | 371 `'…' \| t` keys vs `locales/en.default.json` | 0 missing |
| 10 | Schema translation keys | every `"t:…"` in section schemas and `settings_schema.json` vs `en.default.schema.json` | 0 missing |
| 11 | Colour schemes | every `*color_scheme*` value in templates, section groups and schema defaults vs `settings_data.json` | `scheme-1..5` defined; one empty value found — fixed (§2.1) |
| 12 | Unreferenced assets | name scan across all Liquid, template JSON and `config/*.json` | 46 of 213 assets never named; 44 are the dynamic icon library (§3.2) |
| 13 | Secrets / hardcoded hosts | grep for API keys, `shp*` tokens, `*.myshopify.com`, `http://` links | none |
| 14 | Undefined Liquid variables | independent scan (§1.2) | no genuine hits — every flagged name is a documented optional `render` param |

### 1.1 Why the Node engine, not the Ruby binary

`shopify theme check` needs Ruby. This sandbox has no Ruby and no reachable apt mirror
(`E: Unable to locate package ruby-full` after `apt-get update` failed to reach
`deb.debian.org`), so the canonical binary could not run. `@shopify/theme-check-node` 3.29.0
is Shopify's own Node port of the same check implementations and was installed from npm.

The engine was **not** taken on trust. Before accepting its clean result, deliberate defects
were injected into a throwaway copy of the theme and confirmed to be reported:

| Injected defect | Reported as |
|---|---|
| unclosed `{% if %}` / `<div>` | `LiquidHTMLSyntaxError` |
| `{% render 'does-not-exist-anywhere' %}` | `MissingTemplate` |
| `"snz-nope.css" \| asset_url` | `MissingAsset` |
| `{{ product.title \| bogus_filter_xyz }}` | `UnknownFilter` |
| `{% assign snz_unused_thing = 1 %}` (unused) | `UnusedAssign` |
| `{{ "snz.does.not.exist" \| t }}` | `TranslationKeyExists` |
| `<a href="/collections/all">` | `HardcodedRoutes` |
| snippet rendered by nothing | `OrphanedSnippet` |

So the "0 errors" in row 2 means those eight failure modes were actually looked for and not
found, not that the tool stayed silent.

### 1.2 One check is inert, and what was done instead

`UndefinedObject` **never fires** in this engine build. Eight different injected forms of an
undefined variable (`{{ undefined }}`, `{{ undefined.prop }}`, `{% if undefined %}`,
`{% for x in undefined %}`, `limit:` / `offset:` arguments, `render` argument) produced
0 offenses every time. Row 2's clean result therefore says nothing about undefined variables,
so a separate conservative scan was run: every variable root used in Liquid, minus the ones
assigned/captured/looped in the same file, minus names passed by any caller of that snippet,
minus Shopify's injected globals.

Every surviving hit was a **documented optional parameter** guarded by a default — e.g.
`description` in `meta-tags.liquid`, `first_3d_model` in `product-media-gallery.liquid`,
`heading` in `vennix-cart-recommendations.liquid`, `fallback_to_brand` in
`vennix-vendor.liquid`. No undefined-variable defects found.

Note this contradicts the 2026-09-11 audit, which lists an `UndefinedObject` hit at
`sections/main-product.liquid:695` (`offset: continue`). That finding could not be reproduced
here with the same package version; it was a false positive there too, so nothing turns on it.

---

## 2. Defects found and fixed in this commit

### 2.1 `templates/product.json` — `disclosures` section had an empty colour scheme

```json
"color_scheme": ""        ->        "color_scheme": "scheme-1"
```

`sections/disclosures.liquid:26` renders `<div class="color-{{ section.settings.color_scheme }} gradient">`,
so the product page was emitting the literal, non-existent class `color-`. Neither
`theme-check` nor `validate_theme.py` catches it: an empty string is a legal value for a
`color_scheme` setting.

**No visual change** — and that was verified rather than assumed. `layout/theme.liquid:135-139`
emits the first colour scheme's variables onto `:root` as well as onto `.color-scheme-1`, and
`scheme-1` is first in `config/settings_data.json`. A section with no scheme class therefore
inherits exactly `scheme-1`'s palette from `:root`, including under
`html[data-theme='dark']:root`. The fix removes an invalid class name and matches the
section's own schema default (`scheme-1`); it does not repaint anything.

### 2.2 `snippets/vennix-size-guide.liquid` — stale usage docs

The header comment documented
`{% render 'vennix-size-guide', block: block, product: product %}`, but the only caller
(`sections/main-product.liquid:860`) also passes `audience: size_guide_audience` — the
parameter added by the base commit. Anyone copying the documented call would silently get the
`unisex` two-table chart on a women's product. The comment now lists all three parameters,
what `audience` accepts, and what happens when it is omitted.

### 2.3 `.theme-check.yml` — the two disabled checks were unexplained

`MatchingTranslations: enabled: false` was a bare flag with no rationale in the file, which
means the gap it hides was invisible to anyone reading the config. It now records what the
check would report and why the result is cosmetic (§3.1). No behaviour change — verified by
re-running the linter before and after: same 3 offenses, 0 errors.

### 2.4 `scripts/validate_theme.py` scanned `node_modules` — this would have broken CI on day one

`check_json_files()` walked `ROOT.rglob("*.json")` and skipped only `.git`. Installed npm
packages ship JSONC (comments, trailing commas) in their fixtures and tsconfigs, which strict
JSON rejects. With a `node_modules/` present the repo's own gate reported:

```
FAILED — 7 problem(s):
  - node_modules/@shopify/theme-graph/bin/jsconfig.json: invalid JSON (…line 11 column 5)
  - node_modules/@shopify/theme-graph/fixtures/skeleton/jsconfig.json: invalid JSON (…)
  - node_modules/@shopify/theme-graph/fixtures/skeleton/sections/header-group.json: invalid JSON (…)
  - node_modules/@shopify/theme-graph/fixtures/skeleton/templates/index.json: invalid JSON (…)
  - node_modules/@shopify/theme-graph/tsconfig.build.json: invalid JSON (…)
  - node_modules/@shopify/theme-graph/tsconfig.json: invalid JSON (…)
  - node_modules/@vscode/l10n/dist/tsdoc-metadata.json: invalid JSON (…)
```

None of those are theme files. This was latent only because CI never runs (§3.4) — and it was
*not* hypothetical, because the parked workflow installs packages in the step immediately
before it calls this script:

```
ci/theme-check.workflow.yml:52   npm install --no-save --silent @shopify/prettier-plugin-liquid prettier@3
ci/theme-check.workflow.yml:58   run: python3 scripts/validate_theme.py
```

So the documented "just `git mv` the workflow into place" instruction would have produced a
red pipeline blaming the theme for someone else's fixture files. `IGNORED_PARTS = {".git",
"node_modules"}` now guards the walk.

Verified both directions, on a full copy of the theme at `/tmp/vt`:

| Case | Result |
|---|---|
| clean copy, no `node_modules` | `OK`, exit 0 |
| clean copy **plus** a JSONC file at `node_modules/@shopify/theme-graph/tsconfig.json` | `OK`, exit 0 |
| copy with an unknown setting injected into `templates/product.json` and a renamed setting in `templates/collection.json` | `FAILED — 2 problem(s)`, exit 1, both named correctly |

So the ignore rule does not blind the script to real drift.

---

## 3. Known gaps, left open on purpose

### 3.1 844 missing translations (Medium — cosmetic, not breaking)

| Group | Files | Missing keys each | Findings |
|---|---|---|---|
| Storefront locales | 30 non-English | 19 (identical set) | 540 |
| Schema locales | 19 non-English `*.schema.json` | 16 (identical set) | 304 |
| | | **theme-check total** | **844** |

A direct key-parity count gives 874, not 844: the difference is `sections.footer.phone`,
which theme-check treats as a schema key and therefore does not compare inside the
storefront files. Both numbers are correct for what they measure.

The 19 storefront keys are shopper-visible:

```
customer.account.contact_support            templates.contact.info_heading
sections.faq.placeholder_heading            templates.contact.info_label
sections.faq.placeholder_text               templates.contact.info_text
sections.footer.address                     templates.contact.phone_label
sections.footer.contact_info                vennix.dark_mode.switch_to_dark
sections.footer.email                       vennix.dark_mode.switch_to_light
sections.footer.phone                       vennix.shipping_progress.label
templates.contact.email_label               vennix.shipping_progress.remaining_html
templates.contact.form.optional             vennix.shipping_progress.unlocked_html
templates.contact.form.response_note
```

Shopify falls back to the default locale, so the practical effect is that a non-English
shopper sees the dark-mode toggle label, the free-shipping progress bar and the contact-page
copy in English. The 16 schema keys only affect theme-editor labels for the `faq`, `footer`,
`contact-form` and `main-404` sections.

The right fix is real translation (Translate & Adapt or a vendor), not copying English into
`ja.json` — which is why this was documented rather than "fixed".

Separately, 11 locales have no `.schema.json` at all: `bg, el, hr, hu, id, lt, ro, ru, sk, sl, vi`.
That matches the 2026-09-11 audit's Low-priority item and is unchanged.

### 3.2 47 Liquid files are not Prettier-clean (Low)

`prettier --check` reports 47 files; applying `--write` would rewrite **1,159 lines**. CI
deliberately emits this as a `::warning::` rather than failing, and a 1,159-line
whitespace-only diff is exactly the wrong thing to land immediately before a merge — it would
bury the three real fixes above. Left alone. To apply it as its own commit:

```bash
npm install --no-save @shopify/prettier-plugin-liquid prettier@3
npx prettier --plugin=@shopify/prettier-plugin-liquid --write '**/*.liquid'
```

### 3.3 394,923 bytes of dead assets (Medium)

| File | Bytes | Why it is dead |
|---|---|---|
| `assets/vennix-hero-editorial.jpg` | 214,065 | named nowhere in Liquid, template JSON or `config/*.json` |
| `assets/lookbook.jpg` | 180,268 | same |
| `assets/component-progress-bar.css` | 590 | `snippets/progress-bar.liquid` renders the markup but never loads this stylesheet |

The other 43 unreferenced files are **not** dead: `icon-*.svg` are resolved dynamically by
`snippets/icon-accordion.liquid:2`
(`icon | replace: '_' | prepend: 'icon-' | append: '.svg'`), so a plain name scan cannot see
them. Deleting brand imagery is the owner's call, not an audit's, so nothing was removed here.
When decided:

```bash
git rm assets/vennix-hero-editorial.jpg assets/lookbook.jpg assets/component-progress-bar.css
```

### 3.4 CI still does not run (High — needs an admin, not a commit)

The `Theme Check` workflow lives at `ci/theme-check.workflow.yml`, outside
`.github/workflows/`, so GitHub never executes it — and `.github/dependabot.yaml` watches the
`github-actions` ecosystem with nothing to watch.

This was re-tested empirically rather than assumed from the last audit. The file was moved to
`.github/workflows/theme-check.yml`, committed, and pushed; GitHub rejected the push:

```
! [remote rejected] arena/01a09615-vennixstore-theme -> arena/01a09615-vennixstore-theme
  (refusing to allow a GitHub App to create or update workflow
   `.github/workflows/theme-check.yml` without `workflows` permission)
```

The move was reverted, so the repo still ships the workflow at `ci/`. **Only a repo admin can
finish this** — either grant the GitHub App the `workflows` permission, or run locally with
your own credentials:

```bash
mkdir -p .github/workflows && git mv ci/theme-check.workflow.yml .github/workflows/theme-check.yml
```

The workflow is safe to switch on **now that §2.4 is fixed**: every step it runs was executed
here and passes — theme-check at `--fail-level error` (0 errors), `scripts/validate_theme.py`
(exit 0, including with `node_modules` present), and the Prettier step (non-blocking by
design). Without §2.4 it would have failed on the first run.

### 3.5 The test suite from the last audit is not in the repo (Medium)

`reports/audits/2026-09-11-theme-audit.md:245` tells you to run `node test-rail.js`. No such
file is tracked — `git ls-files | grep -iE 'test|spec'` returns nothing. The 50-assertion
jsdom suite described in that audit was never committed, so
`assets/vennix-product-rail.js` (11,824 bytes) currently has no regression test in the repo.

### 3.6 Minor, not worth a commit each

- **3 `LiquidComplexity` suggestions** (Dawn base files, advisory): `snippets/card-product.liquid:77`
  complexity 139, `sections/main-product.liquid:101` complexity 131,
  `snippets/facets.liquid:864` complexity 136. Both of the first two have risen since
  2026-09-11 (132→139 and 124→131) as Vennix logic was added to those files.
- **14 `AssetSizeJavaScript` errors** under `theme-check:all` (files over 10 KB). Not part of
  the recommended set, so CI does not run it; normal for a Dawn-derived theme.
- **5 files without a trailing newline**: `release-notes.md`, `snippets/unit-price.liquid`,
  `templates/404.json`, `templates/article.json`, `templates/password.json`.
- **76 lines with trailing whitespace** across Liquid/JS/CSS/JSON.
- **`/pages/contact` hardcoded** in `snippets/vennix-size-guide.liquid`. Shopify exposes no
  route object for an arbitrary page, so this is normal practice — but it 404s if the
  merchant's contact page has a different handle.
- **Hardcoded English in the custom sections** (size-guide table headers and measurement
  tips, `aria-label="Store announcements"`). These are not `| t` lookups, so they will never
  translate regardless of §3.1.

---

## 4. Not verified here

- **Nothing was rendered against a live store.** No `shopify theme dev`, no preview deploy.
  Liquid output, real visual layout and the `card-product` render inside the product rail all
  still need a pass on a store with real products — unchanged from the 2026-09-11 audit.
- **Catalog data is out of scope.** `catalog/`, `PRODUCTS-TO-*.csv` and `reports/audits/*.csv`
  are merchant-facing exports; nothing here validates them against the live store, and the
  repo's own guidance is not to change production data from it.
- **Menu handles and collection assignments** referenced from `settings_data.json`
  (`main-menu`) and the Vennix sections cannot be checked without store access.
