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
