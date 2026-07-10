/*
 * VennixStore — Free shipping progress bar
 * Fetches the current cart total and updates the shipping progress bar
 * inside the cart drawer. Triggers on drawer open and on cart updates.
 */
(function () {
  'use strict';

  var THRESHOLD = 7500; // $75.00 in cents

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function updateShippingBar(totalPrice) {
    var bar = document.querySelector('.vennix-shipping-bar');
    if (!bar) return;

    var threshold = parseInt(bar.getAttribute('data-shipping-threshold'), 10) || THRESHOLD;
    var fill = bar.querySelector('[data-shipping-fill]');
    var label = bar.querySelector('[data-shipping-label]');

    var percent = Math.min(100, Math.round((totalPrice / threshold) * 100));
    var remaining = Math.max(0, threshold - totalPrice);

    if (fill) fill.style.width = percent + '%';

    if (label) {
      if (remaining <= 0) {
        label.textContent = "You've unlocked free shipping!";
        bar.classList.add('vennix-shipping-bar--unlocked');
      } else {
        label.textContent = "You're " + formatMoney(remaining) + ' away from free shipping';
        bar.classList.remove('vennix-shipping-bar--unlocked');
      }
    }
  }

  function refreshFromCart() {
    fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (response) {
        return response.json();
      })
      .then(function (cart) {
        updateShippingBar(cart.total_price);
      })
      .catch(function () {
        /* silently ignore fetch errors */
      });
  }

  // Trigger on cart drawer open. Dawn's cart-drawer toggles the `animate` /
  // `active` classes; observe for the drawer becoming visible.
  function watchDrawer() {
    var drawer = document.querySelector('cart-drawer');
    if (!drawer) return;

    var observer = new MutationObserver(function () {
      if (drawer.classList.contains('active') || drawer.classList.contains('animate')) {
        refreshFromCart();
      }
    });
    observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
  }

  // Trigger on cart updates (Dawn publishes the `cart-update` PubSub event and
  // also replaces cart drawer markup). Listen broadly to stay in sync.
  function watchCartUpdates() {
    document.addEventListener('cart:refresh', refreshFromCart);
    document.addEventListener('cart:updated', refreshFromCart);

    // Dawn fires this event when cart contents change.
    document.addEventListener(
      'click',
      function (event) {
        if (event.target.closest('cart-remove-button, .quantity__button')) {
          setTimeout(refreshFromCart, 600);
        }
      },
      true
    );
  }

  function init() {
    watchDrawer();
    watchCartUpdates();
    refreshFromCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
