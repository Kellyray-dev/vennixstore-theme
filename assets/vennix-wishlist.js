/*
 * VennixStore — Wishlist system
 * Stores wishlist items in localStorage and keeps the UI in sync:
 * heart buttons, header count badge, and the wishlist page grid.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'vennix_wishlist';

  var VennixWishlist = {
    /* ---------------------------------------------------------------- data */
    read: function () {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        var parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },

    write: function (items) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        /* storage unavailable — fail silently */
      }
    },

    has: function (id) {
      id = String(id);
      return this.read().some(function (item) {
        return String(item.id) === id;
      });
    },

    add: function (product) {
      if (!product || !product.id) return;
      var items = this.read();
      if (
        !items.some(function (item) {
          return String(item.id) === String(product.id);
        })
      ) {
        items.push({
          id: String(product.id),
          title: product.title || '',
          price: product.price || '',
          image: product.image || '',
          url: product.url || ''
        });
        this.write(items);
      }
    },

    remove: function (id) {
      id = String(id);
      var items = this.read().filter(function (item) {
        return String(item.id) !== id;
      });
      this.write(items);
    },

    toggle: function (product) {
      if (!product || !product.id) return false;
      if (this.has(product.id)) {
        this.remove(product.id);
        return false;
      }
      this.add(product);
      return true;
    },

    /* ------------------------------------------------------------------ UI */
    updateUI: function () {
      var items = this.read();
      var ids = items.map(function (item) {
        return String(item.id);
      });

      var buttons = document.querySelectorAll('[data-wishlist-btn]');
      buttons.forEach(function (btn) {
        var active = ids.indexOf(String(btn.getAttribute('data-product-id'))) !== -1;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      var badge = document.getElementById('vennixHeaderWishlistCount');
      if (badge) {
        badge.textContent = items.length;
        if (items.length > 0) {
          badge.removeAttribute('hidden');
        } else {
          badge.setAttribute('hidden', '');
        }
      }
    },

    /* -------------------------------------------------------------- toasts */
    showToast: function (message) {
      var toast = document.getElementById('vennix-toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('is-visible');
      if (this._toastTimer) window.clearTimeout(this._toastTimer);
      this._toastTimer = window.setTimeout(function () {
        toast.classList.remove('is-visible');
      }, 2600);
    },

    /* -------------------------------------------------------- wishlist page */
    renderPage: function () {
      var grid = document.getElementById('vennixWishlistGrid');
      var empty = document.getElementById('vennixWishlistEmpty');
      if (!grid) return;

      var items = this.read();

      if (!items.length) {
        grid.innerHTML = '';
        grid.setAttribute('hidden', '');
        if (empty) empty.removeAttribute('hidden');
        return;
      }

      if (empty) empty.setAttribute('hidden', '');

      grid.removeAttribute('hidden');
      grid.innerHTML = items
        .map(function (item) {
          var img = item.image
            ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">'
            : '';
          return (
            '<div class="vennix-wishlist-card grid__item" data-wishlist-card="' +
            escapeHtml(item.id) +
            '">' +
            '<a class="vennix-wishlist-card__media" href="' +
            escapeHtml(item.url) +
            '">' +
            img +
            '</a>' +
            '<button type="button" class="vennix-wishlist-card__remove" data-wishlist-remove="' +
            escapeHtml(item.id) +
            '" aria-label="Remove from wishlist">&times;</button>' +
            '<div class="vennix-wishlist-card__info">' +
            '<a class="vennix-wishlist-card__title" href="' +
            escapeHtml(item.url) +
            '">' +
            escapeHtml(item.title) +
            '</a>' +
            '<span class="vennix-wishlist-card__price">' +
            escapeHtml(item.price) +
            '</span>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');
    },

    /* ---------------------------------------------------------------- init */
    init: function () {
      var self = this;

      document.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-wishlist-btn]');
        if (btn) {
          event.preventDefault();
          var product = {
            id: btn.getAttribute('data-product-id'),
            title: btn.getAttribute('data-product-title'),
            price: btn.getAttribute('data-product-price'),
            image: btn.getAttribute('data-product-image'),
            url: btn.getAttribute('data-product-url')
          };
          var added = self.toggle(product);
          self.updateUI();
          self.renderPage();
          self.showToast(
            added ? 'Added to your wishlist' : 'Removed from your wishlist'
          );
          return;
        }

        var removeBtn = event.target.closest('[data-wishlist-remove]');
        if (removeBtn) {
          event.preventDefault();
          self.remove(removeBtn.getAttribute('data-wishlist-remove'));
          self.updateUI();
          self.renderPage();
          self.showToast('Removed from your wishlist');
        }
      });

      window.addEventListener('storage', function (event) {
        if (event.key === STORAGE_KEY) {
          self.updateUI();
          self.renderPage();
        }
      });

      this.updateUI();
      this.renderPage();
    }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.VennixWishlist = VennixWishlist;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      VennixWishlist.init();
    });
  } else {
    VennixWishlist.init();
  }
})();
