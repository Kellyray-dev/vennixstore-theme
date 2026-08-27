/**
 * Vennix — pre-order state sync
 * ------------------------------------------------------------------
 * Keeps the PDP purchase UI truthful as the shopper switches variants:
 *   • Submit label flips Add to cart ↔ Pre-order ↔ Sold out
 *   • Expected-availability chip shows/hides accordingly
 *
 * Dawn renders initial states server-side; variant inputs fire native
 * change events, so a delegated listener re-syncs without patching
 * Dawn's product-form internals. Variant truth ships as JSON in the form.
 */
(function () {
  'use strict';

  function updateFromPayload(form) {
    var payloadEl = form.querySelector('[data-vnx-variants]');
    if (!payloadEl) return;

    var variants;
    try {
      variants = JSON.parse(payloadEl.textContent);
    } catch (error) {
      console.error('[Vennix] Pre-order payload:', error);
      return;
    }

    var idInput = form.querySelector('input.product-variant-id');
    if (!idInput || !idInput.value) return;

    var variant = null;
    for (var i = 0; i < variants.length; i++) {
      if (String(variants[i].id) === String(idInput.value)) {
        variant = variants[i];
        break;
      }
    }
    if (!variant) return;

    var isPreorder =
      variant.available &&
      variant.policy === 'continue' &&
      variant.managed === 'shopify' &&
      variant.qty <= 0;

    var button = form.querySelector('.product-form__submit');
    if (button && !button.disabled) {
      var labelEl = button.querySelector('span:not(.loading-overlay__spinner)');
      if (labelEl) {
        // Dawn wraps translations directly; safe to rewrite text only.
        labelEl.textContent = isPreorder
          ? labelEl.dataset.vnxPreorder || window.vnxPreorderLabels.preOrder
          : window.vnxPreorderLabels.addToCart;
      }
    }

    document.querySelectorAll('[data-vnx-note]').forEach(function (note) {
      if (note.closest('[data-type="add-to-cart-form"]') !== form) return;
      note.hidden = !isPreorder;
    });
  }

  function bootstrap() {
    window.vnxPreorderLabels = {
      addToCart:
        window.vnxPreorderLabels && window.vnxPreorderLabels.addToCart
          ? window.vnxPreorderLabels.addToCart
          : 'Add to cart',
      preOrder:
        window.vnxPreorderLabels && window.vnxPreorderLabels.preOrder
          ? window.vnxPreorderLabels.preOrder
          : 'Pre-order',
    };
  }

  // Capture phase keeps this sync ahead of Dawn's own variant handlers,
  // so our authoritative state is what the shopper ends up seeing.
  document.addEventListener(
    'change',
    function (event) {
      var form = event.target.closest && event.target.closest('[data-type="add-to-cart-form"]');
      if (form) updateFromPayload(form);
    },
    true
  );

  // Server-side markup is already correct on load; labels seed lazily so
  // the first variant switch has localized strings available.
  document.addEventListener('DOMContentLoaded', bootstrap);
})();