/**
 * Hover-intent for desktop header menus (mega menu + dropdown).
 *
 * On pointer-capable desktop viewports, hovering a top-level menu item that has
 * sub-links opens its panel without requiring a click. Keyboard behaviour is
 * untouched: the <summary> still toggles on Enter/Space and the panel never
 * auto-closes while focus is inside it.
 */

(function () {
  var OPEN_DELAY = 90; // ms — guards against fly-by pointer movement
  var CLOSE_DELAY = 220; // ms — grace period when crossing between panels
  var DESKTOP_HOVER = '(hover: hover) and (pointer: fine) and (min-width: 990px)';

  function canHover() {
    return window.matchMedia(DESKTOP_HOVER).matches;
  }

  function setUpHoverIntent(menu) {
    if (menu.dataset.hoverIntent === 'true') return;
    menu.dataset.hoverIntent = 'true';

    var details = menu.querySelector('details');
    var summary = menu.querySelector('summary');
    if (!details || !summary) return;

    var openTimer;
    var closeTimer;

    function clearTimers() {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    }

    function open() {
      if (details.hasAttribute('open')) return;
      details.setAttribute('open', '');
      summary.setAttribute('aria-expanded', 'true');
    }

    function close() {
      // Never yank the panel away from someone navigating it with the keyboard.
      if (menu.contains(document.activeElement)) return;
      if (!details.hasAttribute('open')) return;
      details.removeAttribute('open');
      summary.setAttribute('aria-expanded', 'false');
    }

    menu.addEventListener('mouseenter', function () {
      if (!canHover()) return;
      clearTimers();
      openTimer = setTimeout(open, OPEN_DELAY);
    });

    menu.addEventListener('mouseleave', function () {
      clearTimers();
      closeTimer = setTimeout(close, CLOSE_DELAY);
    });

    // A deliberate click (or tap) wins over the pending timers.
    menu.addEventListener('click', clearTimers);
    menu.addEventListener('focusin', clearTimers);
    // Touch devices have no hover: dismiss on the next touch elsewhere.
    menu.addEventListener('touchstart', clearTimers, { passive: true });
  }

  function initMenus() {
    var menus = document.querySelectorAll('header-menu');
    for (var i = 0; i < menus.length; i++) {
      setUpHoverIntent(menus[i]);
    }
  }

  function init() {
    initMenus();

    // Menus are re-rendered by the theme editor and by section reloading.
    // Debounced so a chatty page (predictive search, cart updates) is cheap.
    if (typeof MutationObserver === 'undefined') return;

    var pending;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(initMenus, 150);
    }).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
