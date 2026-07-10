/* =============================================
   VENNIXSTORE — Product page enhancements
   Tab switching + sticky add-to-cart bar
   ============================================= */
(function () {
  'use strict';

  /* ---------- Tab switching ---------- */
  function initTabs(root) {
    var tabs = root.querySelectorAll('[data-tab-target]');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetId = tab.getAttribute('data-tab-target');
        var target = document.getElementById(targetId);
        if (!target) return;

        // Reset all tabs within this tab group
        root.querySelectorAll('[data-tab-target]').forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });

        // Reset all panels within this tab group
        root.querySelectorAll('.vennix-tabs__panel').forEach(function (panel) {
          panel.classList.remove('is-active');
        });

        // Activate selected tab + panel
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        target.classList.add('is-active');
      });
    });
  }

  /* ---------- Sticky add-to-cart bar ---------- */
  function initStickyBar() {
    var bar = document.querySelector('[data-vennix-sticky-bar]');
    if (!bar) return;

    var formId = bar.getAttribute('data-form-id');
    var form = formId ? document.getElementById(formId) : null;

    // The main Add to Cart button lives inside the product form
    var mainButton =
      (form && form.querySelector('[name="add"]')) ||
      document.querySelector('product-form button[name="add"]') ||
      document.querySelector('.product-form__submit');

    if (!mainButton) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: always keep hidden if unsupported
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // Show the sticky bar only once the main button is out of view
          if (entry.isIntersecting) {
            bar.classList.remove('is-visible');
          } else {
            bar.classList.add('is-visible');
          }
        });
      },
      { root: null, threshold: 0 }
    );

    observer.observe(mainButton);
  }

  function init() {
    document.querySelectorAll('[data-vennix-tabs]').forEach(initTabs);
    initStickyBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
