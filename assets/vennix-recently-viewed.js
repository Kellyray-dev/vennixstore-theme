(function() {
  const STORAGE_KEY = 'vennix_recently_viewed';
  const MAX_ITEMS = 6;

  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function saveItem(product) {
    let items = getItems().filter(i => i.id !== product.id);
    items.unshift(product);
    if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function renderGrid() {
    const wrap = document.getElementById('vennixRecentlyViewed');
    const grid = document.getElementById('vennixRecentlyViewedGrid');
    if (!wrap || !grid) return;

    const currentId = wrap.dataset.currentId;
    const items = getItems().filter(i => String(i.id) !== String(currentId));
    if (items.length === 0) return;

    wrap.style.display = 'block';
    grid.innerHTML = items.map(p => `
      <a href="${p.url}" class="vennix-rv-card card-wrapper">
        <div class="card card--standard">
          <div class="card__media"
            style="aspect-ratio:3/4;overflow:hidden;border-radius:8px;">
            <img src="${p.image}"
              alt="${p.title}"
              loading="lazy"
              style="width:100%;height:100%;object-fit:cover;">
          </div>
          <div style="padding:12px 0;">
            <p style="font-size:0.875rem;font-weight:500;margin-bottom:6px;line-height:1.3;">
              ${p.title.substring(0, 50)}${p.title.length > 50 ? '...' : ''}
            </p>
            <p style="color:#c9a96e;font-weight:700;font-size:0.875rem;">
              ${p.price}
            </p>
          </div>
        </div>
      </a>
    `).join('');
  }

  const meta = document.getElementById('vennixRecentlyViewed');
  if (meta && meta.dataset.currentId) {
    saveItem({
      id: meta.dataset.currentId,
      title: meta.dataset.title,
      price: meta.dataset.price,
      image: meta.dataset.image,
      url: meta.dataset.url
    });
    renderGrid();
  }
})();