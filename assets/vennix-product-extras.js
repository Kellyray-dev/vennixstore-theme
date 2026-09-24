/**
 * VENNIX product page extras — monogramming and the size finder.
 * ----------------------------------------------------------------------------
 * Ported from the standalone VENNIX storefront theme and wired into Dawn's
 * product form instead of a parallel cart implementation:
 *
 *   <vx-monogram>   Personalisation. Two data models, both from the source
 *                   theme and both Shopify-native:
 *                     property — the letters travel as a line item property
 *                                (properties[<label>]), no extra charge.
 *                     variant  — a "Monogram" variant carries the fee; when
 *                                the shopper opts in, the product form's
 *                                variant id is swapped to the matching
 *                                monogrammed variant so Shopify charges it.
 *                   With no monogram variant the block degrades to property.
 *
 *   <vx-size-finder> Height / weight / fit preference → suggested size, then
 *                   selects that size in Dawn's variant picker. It only ever
 *                   suggests sizes this product actually sells.
 */
(function () {
  'use strict';

  function define(name, ctor) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }

  function readJson(el, selector) {
    var node = el.querySelector(selector);
    if (!node) return null;
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      return null;
    }
  }

  function formatMoney(cents) {
    var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
    try {
      return new Intl.NumberFormat(document.documentElement.lang || undefined, {
        style: 'currency',
        currency: currency,
      }).format(cents / 100);
    } catch (e) {
      return (cents / 100).toFixed(2);
    }
  }

  function toast(message) {
    if (typeof window.vennixToast === 'function') window.vennixToast(message);
  }

  /* ================================================================ monogram */
  var MONOGRAM_RE = /monogram/i;

  class VxMonogram extends HTMLElement {
    connectedCallback() {
      this.mode = this.dataset.mode || 'property';
      this.max = parseInt(this.dataset.max, 10) || 3;
      this.formId = this.dataset.productFormId;
      this.variants = readJson(this, '[data-vx-monogram-variants]') || [];
      this.toggle = this.querySelector('[data-vx-monogram-toggle]');
      this.body = this.querySelector('[data-vx-monogram-body]');
      this.input = this.querySelector('[data-vx-monogram-input]');
      this.extras = this.querySelectorAll('[data-vx-monogram-extra]');
      this.preview = this.querySelector('[data-vx-monogram-preview]');
      this.error = this.querySelector('[data-vx-monogram-error]');
      this.feeEl = this.querySelector('[data-vx-monogram-fee]');
      this.freeNote = this.querySelector('[data-vx-monogram-free-note]');
      this.idInput = document.querySelector('#' + this.formId + ' input[name="id"]');
      if (!this.toggle || !this.input) return;

      this.baseId = this.idInput ? String(this.idInput.value) : '';
      if (this.isMonogramVariant(this.baseId)) {
        var base = this.baseFor(this.findVariant(this.baseId));
        if (base) this.baseId = String(base.id);
      }

      this.onToggle = () => {
        this.paint();
        if (this.toggle.checked) this.input.focus();
      };
      this.onInput = () => this.paint();
      this.onVariantInput = () => {
        // Dawn rewrites the id whenever the shopper changes an option. Treat any
        // non-monogram id as the new base, then re-apply the opt-in.
        var value = String(this.idInput.value || '');
        if (this.swapping) return;
        if (!this.isMonogramVariant(value)) this.baseId = value;
        this.paint();
      };
      this.onSubmit = this.onSubmit.bind(this);

      this.toggle.addEventListener('change', this.onToggle);
      this.input.addEventListener('input', this.onInput);
      if (this.idInput) this.idInput.addEventListener('change', this.onVariantInput);
      document.addEventListener('submit', this.onSubmit, true);
      this.paint();
    }

    disconnectedCallback() {
      if (this.toggle) this.toggle.removeEventListener('change', this.onToggle);
      if (this.input) this.input.removeEventListener('input', this.onInput);
      if (this.idInput) this.idInput.removeEventListener('change', this.onVariantInput);
      document.removeEventListener('submit', this.onSubmit, true);
    }

    findVariant(id) {
      return this.variants.find(function (v) { return String(v.id) === String(id); });
    }

    isMonogramVariant(id) {
      var v = this.findVariant(id);
      return !!v && MONOGRAM_RE.test(v.title);
    }

    /** Options that are not the personalisation option itself. */
    plainOptions(variant) {
      return (variant.options || []).filter(function (o) { return !MONOGRAM_RE.test(o); });
    }

    sameOptions(a, b) {
      var pa = this.plainOptions(a);
      var pb = this.plainOptions(b);
      return pa.length === pb.length && pa.every(function (o, i) { return o === pb[i]; });
    }

    baseFor(monoVariant) {
      if (!monoVariant) return null;
      return this.variants.find((v) => !MONOGRAM_RE.test(v.title) && this.sameOptions(v, monoVariant)) || null;
    }

    monogramFor(baseId) {
      var base = this.findVariant(baseId);
      var monos = this.variants.filter(function (v) { return MONOGRAM_RE.test(v.title); });
      if (!monos.length) return null;
      if (!base) return null;
      return monos.find((v) => this.sameOptions(v, base)) || (monos.length === 1 ? monos[0] : null);
    }

    clean(value) {
      return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9.&'\- ]/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/^\s+/, '')
        .slice(0, this.max);
    }

    paint() {
      var text = this.clean(this.input.value);
      if (this.input.value !== text) this.input.value = text;
      var on = this.toggle.checked;
      var active = on && text.trim().length > 0;

      this.body.hidden = !on;
      this.toggle.setAttribute('aria-expanded', String(on));
      this.classList.toggle('is-active', on);
      // Disabled inputs are left out of the cart request, so an unticked
      // monogram never adds an empty property to the order.
      this.input.disabled = !on;
      this.extras.forEach(function (el) { el.disabled = !on; });
      if (!on && this.error) this.error.hidden = true;

      if (this.preview) {
        this.preview.textContent = text || new Array(this.max + 1).join('·');
        this.preview.classList.toggle('is-empty', !text);
      }

      var mono = this.mode === 'variant' ? this.monogramFor(this.baseId) : null;
      var base = this.findVariant(this.baseId);
      var fee = mono && base ? mono.price - base.price : 0;
      var charged = !!mono && mono.available !== false;

      if (this.feeEl) {
        this.feeEl.hidden = !(charged && fee > 0);
        if (charged && fee > 0) this.feeEl.textContent = '+' + formatMoney(fee);
      }
      if (this.freeNote) this.freeNote.hidden = charged;

      if (this.idInput && this.mode === 'variant' && this.baseId) {
        var target = active && charged ? String(mono.id) : this.baseId;
        if (String(this.idInput.value) !== target) {
          // Set without re-dispatching change so Dawn does not re-render.
          this.swapping = true;
          this.idInput.value = target;
          this.swapping = false;
        }
      }
    }

    onSubmit(event) {
      var form = event.target;
      if (!form || form.id !== this.formId) return;
      if (this.toggle.checked && !this.clean(this.input.value).trim()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        if (this.error) this.error.hidden = false;
        this.input.focus();
      }
    }
  }
  define('vx-monogram', VxMonogram);

  /* ============================================================== size finder */
  var BANDS = [
    { size: 'XXS', height: [60, 65], weight: [90, 120] },
    { size: 'XS', height: [61, 66], weight: [105, 135] },
    { size: 'S', height: [63, 68], weight: [120, 150] },
    { size: 'M', height: [65, 70], weight: [140, 175] },
    { size: 'L', height: [67, 72], weight: [165, 200] },
    { size: 'XL', height: [69, 74], weight: [190, 230] },
    { size: 'XXL', height: [70, 76], weight: [220, 265] },
  ];
  var ORDER = BANDS.map(function (b) { return b.size; });
  var ALIASES = { '2XS': 'XXS', '2XL': 'XXL', 'X-SMALL': 'XS', SMALL: 'S', MEDIUM: 'M', LARGE: 'L', 'X-LARGE': 'XL', 'XX-LARGE': 'XXL' };
  var FIT_KEY = 'vennix_fit';

  function normal(size) {
    var s = String(size || '').trim().toUpperCase();
    return ALIASES[s] || s;
  }

  function rank(body) {
    return BANDS.map(function (band) {
      var hc = (band.height[0] + band.height[1]) / 2;
      var wc = (band.weight[0] + band.weight[1]) / 2;
      var hs = Math.max(1, (band.height[1] - band.height[0]) / 2);
      var ws = Math.max(1, (band.weight[1] - band.weight[0]) / 2);
      return { band: band, score: (Math.abs(body.weight - wc) / ws) * 1.6 + Math.abs(body.height - hc) / hs };
    }).sort(function (a, b) { return a.score - b.score; });
  }

  function shift(size, steps) {
    var i = ORDER.indexOf(size);
    if (i === -1 || !steps) return size;
    return ORDER[Math.max(0, Math.min(ORDER.length - 1, i + steps))];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  class VxSizeFinder extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('dialog');
      this.form = this.querySelector('[data-vx-size-finder-form]');
      this.result = this.querySelector('[data-vx-size-finder-result]');
      this.values = readJson(this, '[data-vx-size-values]') || [];
      this.t = readJson(this, '[data-vx-size-strings]') || {};
      this.optionName = this.dataset.optionName;
      this.sectionId = this.dataset.sectionId;
      if (!this.dialog || !this.form) return;

      this.querySelector('[data-vx-size-finder-open]')?.addEventListener('click', () => this.open());
      this.querySelectorAll('[data-vx-size-finder-close]').forEach((btn) =>
        btn.addEventListener('click', () => this.close())
      );
      this.dialog.addEventListener('click', (event) => {
        if (event.target === this.dialog) this.close(); // backdrop click
      });
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.suggest();
      });
      this.result.addEventListener('click', (event) => {
        var apply = event.target.closest('[data-vx-size-apply]');
        if (apply) this.apply(apply.getAttribute('data-vx-size-apply'));
      });
      this.restore();
    }

    open() {
      if (typeof this.dialog.showModal === 'function') this.dialog.showModal();
      else this.dialog.setAttribute('open', '');
      document.body.classList.add('overflow-hidden');
      var first = this.form.querySelector('input');
      if (first) first.focus();
    }

    close() {
      if (typeof this.dialog.close === 'function') this.dialog.close();
      else this.dialog.removeAttribute('open');
      document.body.classList.remove('overflow-hidden');
      this.querySelector('[data-vx-size-finder-open]')?.focus();
    }

    field(name) {
      return this.form.querySelector('[name="' + name + '"]');
    }

    restore() {
      var saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(FIT_KEY) || 'null');
      } catch (e) {
        saved = null;
      }
      if (!saved) return;
      if (this.field('heightFt')) this.field('heightFt').value = saved.heightFt || 5;
      if (this.field('heightIn')) this.field('heightIn').value = saved.heightIn != null ? saved.heightIn : 9;
      if (this.field('weight')) this.field('weight').value = saved.weight || 165;
      var pref = saved.preference && this.form.querySelector('[name="preference"][value="' + saved.preference + '"]');
      if (pref) pref.checked = true;
    }

    suggest() {
      var t = this.t;
      var ft = parseInt(this.field('heightFt').value, 10) || 0;
      var inch = parseInt(this.field('heightIn').value, 10) || 0;
      var weight = parseInt(this.field('weight').value, 10) || 0;
      var height = ft * 12 + inch;
      var checked = this.form.querySelector('[name="preference"]:checked');
      var preference = checked ? checked.value : 'true';
      this.result.hidden = false;

      if (height < 48 || height > 90 || weight < 70 || weight > 450) {
        this.result.innerHTML = '<p class="vx-size-finder__warn">' + escapeHtml(t.out_of_range || '') + '</p>';
        return;
      }
      try {
        localStorage.setItem(FIT_KEY, JSON.stringify({ heightFt: ft, heightIn: inch, weight: weight, preference: preference }));
      } catch (e) {
        /* ignore */
      }

      var ranked = rank({ height: height, weight: weight });
      var steps = preference === 'relaxed' ? 1 : preference === 'snug' ? -1 : 0;
      var base = ranked[0].band.size;
      var size = shift(base, steps);

      // Never suggest a size this product does not make.
      var offered = this.values.map(normal).filter(function (v) { return ORDER.indexOf(v) > -1; });
      if (offered.length && offered.indexOf(size) === -1) {
        var target = ORDER.indexOf(size);
        size = offered.slice().sort(function (a, b) {
          return Math.abs(ORDER.indexOf(a) - target) - Math.abs(ORDER.indexOf(b) - target);
        })[0];
      }
      var others = [base, shift(size, 1)].filter(function (v, i, a) {
        return v !== size && a.indexOf(v) === i && (!offered.length || offered.indexOf(v) > -1);
      });
      var confidence = ranked[1].score - ranked[0].score > 0.45 ? 'high' : 'medium';
      var reason =
        preference === 'relaxed' ? t.reason_relaxed : preference === 'snug' ? t.reason_snug : t.reason_true;

      this.result.innerHTML =
        '<div class="vx-size-finder__verdict vx-size-finder__verdict--' + confidence + '">' +
        '<p class="vx-size-finder__size">' + (t.suggest_html || '[size]').replace('[size]', escapeHtml(this.label(size))) + '</p>' +
        '<ul class="vx-size-finder__reasons">' +
        '<li>' + escapeHtml((t.reason_band || '').replace('[size]', base)) + '</li>' +
        '<li>' + escapeHtml(reason || '') + '</li>' +
        '</ul>' +
        (this.optionName
          ? '<button class="button button--primary" type="button" data-vx-size-apply="' + escapeHtml(size) + '">' +
            escapeHtml((t.select || '[size]').replace('[size]', this.label(size))) + '</button>'
          : '') +
        (others.length
          ? '<p class="vx-size-finder__also">' + escapeHtml((t.also || '[sizes]').replace('[sizes]', others.map(this.label.bind(this)).join(', '))) + '</p>'
          : '') +
        '</div>';
    }

    /** The product's own spelling of a normalised size (e.g. "Medium" for M). */
    label(size) {
      var match = this.values.find(function (v) { return normal(v) === size; });
      return match || size;
    }

    apply(size) {
      var picker = document.getElementById('variant-selects-' + this.sectionId);
      if (!picker) return;
      var label = this.label(size);
      var candidates = Array.prototype.slice.call(
        picker.querySelectorAll('[data-option-name]')
      ).filter((el) => el.dataset.optionName === this.optionName && (el.value === label || normal(el.value) === size));
      var el = candidates[0];
      if (!el) return;
      if (el.classList.contains('disabled')) {
        toast(this.t.unavailable || '');
        return;
      }
      if (el.tagName === 'OPTION') {
        var select = el.closest('select');
        select.value = el.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      this.close();
      toast((this.t.selected || '[size]').replace('[size]', label));
    }
  }
  define('vx-size-finder', VxSizeFinder);
})();
