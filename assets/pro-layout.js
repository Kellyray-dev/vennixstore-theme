/* Pro Layout v1 — mobile filter toolbar.
 *
 * Opens the stock facets drawer when the toolbar's Filter button is tapped.
 * Delegated from `document` so it survives facets.js AJAX re-renders of
 * #ProductGridContainer (which replace the toolbar markup on every filter
 * or sort change). Focus trap + ESC are handled natively by menu-drawer.
 */
(function () {
  if (window.__proLayoutToolbarBound) return;
  window.__proLayoutToolbarBound = true;

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-pro-open-mobile-filters]');
    if (!trigger) return;

    const summary = document.querySelector('#main-collection-filters .mobile-facets__disclosure > summary');
    if (!summary) return;

    event.preventDefault();
    if (!summary.closest('details').hasAttribute('open')) {
      summary.click();
    }
  });
})();
