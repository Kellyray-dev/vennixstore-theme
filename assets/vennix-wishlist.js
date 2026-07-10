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

      // Heart buttons
      var buttons = document.querySelectorAll('[data-wishlist-btn]');
      buttons.forEach(function (btn) {
        var active = ids.indexOf(String(btn.getAttribute('data-product-id'))) !== -1;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      // Header count badge
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
        if (empty) empty.removeAttribute('hidden');
        return;
      }

      if (empty) empty.setAttribute('hidden', '');

      grid.innerHTML = items
        .map(function (item) {
          var img = item.image
            ? '<img src="' + item.image + '" alt="' + escapeHtml(item.title) + '" loading="lazy">'
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

      // Heart button clicks (event delegation covers dynamically added cards).
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

        // Remove button on the wishlist page.
        var removeBtn = event.target.closest('[data-wishlist-remove]');
        if (removeBtn) {
          event.preventDefault();
          self.remove(removeBtn.getAttribute('data-wishlist-remove'));
          self.updateUI();
          self.renderPage();
          self.showToast('Removed from your wishlist');
        }
      });

      // Keep multiple tabs in sync.
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

  // Expose for debugging / external hooks.
  window.VennixWishlist = VennixWishlist;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      VennixWishlist.init();
    });
  } else {
    VennixWishlist.init();
  }
})();
/* =============================================
   VENNIXSTORE — Wishlist (localStorage)
   Key: "vennix_wishlist"
   ============================================= */

const VennixWishlist = (() => {
  const STORAGE_KEY = 'vennix_wishlist';

  function _getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function add(id, title, price, image, url) {
    const items = _getItems();
    if (!items.find((i) => i.id === id)) {
      items.push({ id, title, price, image, url });
      _save(items);
      updateUI();
      showToast('Added to wishlist');
    }
  }

  function remove(id) {
    let items = _getItems();
    items = items.filter((i) => i.id !== id);
    _save(items);
    updateUI();
    showToast('Removed from wishlist');
  }

  function toggle(id, title, price, image, url) {
    if (has(id)) {
      remove(id);
    } else {
      add(id, title, price, image, url);
    }
  }

  function has(id) {
    return _getItems().some((i) => i.id === id);
  }

  function updateUI() {
    const items = _getItems();
    document.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
      const pid = btn.getAttribute('data-product-id');
      if (items.find((i) => i.id === pid)) {
        btn.classList.add('is-wishlisted');
      } else {
        btn.classList.remove('is-wishlisted');
      }
    });
    document.querySelectorAll('#vennixHeaderWishlistCount').forEach((badge) => {
      const count = items.length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function renderPage() {
    const grid = document.getElementById('vennixWishlistGrid');
    const empty = document.getElementById('vennixWishlistEmpty');
    if (!grid) return;
    const items = _getItems();
    if (items.length === 0) {
      grid.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'card-wrapper product-card-wrapper underline-links-hover';
      card.innerHTML = `
        <div class="card card--standard color-scheme-1 gradient" style="--ratio-percent: 100%;">
          <div class="card__inner ratio">
            <div class="card__media">
              <a href="${item.url}" class="full-unstyled-link">
                <img src="${item.image}" alt="${item.title}" width="533" height="533" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
              </a>
            </div>
          </div>
          <div class="card__content">
            <div class="card__information">
              <h3 class="card__heading h5">
                <a href="${item.url}" class="full-unstyled-link">${item.title}</a>
              </h3>
              <div class="card-information">
                <span class="caption-large">${item.price}</span>
              </div>
            </div>
            <button class="vennix-wishlist-btn is-wishlisted" data-wishlist-btn data-product-id="${item.id}" aria-label="Remove from wishlist" style="position:relative;top:auto;right:auto;margin:8px auto 0;">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function showToast(message) {
    const toast = document.getElementById('vennix-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('vennix-toast--visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('vennix-toast--visible');
    }, 2500);
  }

  function init() {
    document.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(
          btn.getAttribute('data-product-id'),
          btn.getAttribute('data-product-title'),
          btn.getAttribute('data-product-price'),
          btn.getAttribute('data-product-image'),
          btn.getAttribute('data-product-url')
        );
      });
    });
    updateUI();
    renderPage();
  }

  return { add, remove, toggle, has, updateUI, renderPage, showToast, init };
})();

document.addEventListener('DOMContentLoaded', VennixWishlist.init);
