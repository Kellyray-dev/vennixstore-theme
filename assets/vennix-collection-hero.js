/**
 * Vennix · Collection Hero
 * ------------------------------------------------------------------
 *  • Staggered fade-up reveal (title .2s / description .4s / CTA .6s)
 *    triggered on load or first scroll into view.
 *  • Gentle parallax drift on the background media — desktop
 *    pointers only, disabled under prefers-reduced-motion, rAF-
 *    throttled so scrolling stays at display refresh rate.
 */
(function () {
  'use strict';

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------- reveal */
  function reveal(hero) {
    requestAnimationFrame(function () {
      hero.classList.add('is-revealed');
    });
  }

  /* -------------------------------------------------- parallax */
  function initParallax(hero, media) {
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches || !media) {
      return;
    }

    var ticking = false;
    var MAX_DRIFT_PX = 60;

    function update() {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      var viewportH = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom <= 0 || rect.top >= viewportH) return;

      // 0 (hero below fold) → 1 (hero scrolled past)
      var progress = Math.min(Math.max((viewportH - rect.top) / (viewportH + rect.height), 0), 1);
      media.style.transform = 'translate3d(0,' + ((progress - 0.5) * 2 * MAX_DRIFT_PX).toFixed(1) + 'px,0)';
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* --------------------------------------------------- starter */
  function boot() {
    document.querySelectorAll('[data-vnx-hero]').forEach(function (hero) {
      reveal(hero);
      initParallax(hero, hero.querySelector('[data-vnx-hero-media]'));

      // Smooth-scroll the CTA past the hero into the product grid.
      var cta = hero.querySelector('[data-vnx-hero-cta]');
      if (cta) {
        cta.addEventListener('click', function (event) {
          var hash = cta.getAttribute('href');
          if (!hash || hash.charAt(0) !== '#') return;
          var target = document.querySelector(hash);
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();