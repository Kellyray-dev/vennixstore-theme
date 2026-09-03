/**
 * VennixStore — shared, dependency-free motion utility (homepage reveals + editorial parallax)
 *
 * Design contract (see Phase 4 motion spec):
 * - Every animated group lives inside a root carrying `data-vx-motion="true"` (the per-section
 *   Theme-Editor toggle renders "true"/"false"). When the toggle is off nothing is ever hidden.
 * - Hidden states are applied ONLY after this script runs (`.vx-motion-ready`), so no-JS and
 *   JS-failure visitors always see the full content. Elements observed are `.vx-rise`.
 * - `prefers-reduced-motion: reduce` → early return; CSS also forces every reveal visible.
 * - `prefers-reduced-motion: no-preference` + IntersectionObserver adds `.vx-rise--in`.
 * - Reveals never hide keyboard focus: a `focusin` listener force-reveals the focused group.
 * - Optional parallax: `[data-vx-parallax="true"]` scales/translates an image inside an
 *   overflow-hidden frame on scroll — desktop only (>= 990px), transform-only.
 * - Idempotent: sections each include this file; the first execution wins.
 */
(function () {
  if (window.__vennixMotionLoaded) return;
  window.__vennixMotionLoaded = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 990px)').matches;
  var supportsObserver = 'IntersectionObserver' in window;

  /* ------------------------- scroll reveals -------------------------------- */
  var revealRoots = Array.prototype.slice.call(document.querySelectorAll('[data-vx-motion="true"]'));

  if (reduceMotion || !supportsObserver || revealRoots.length === 0) {
    /* Never hide anything. */
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('vx-rise--in');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.12 }
    );

    var revealItems = [];
    revealRoots.forEach(function (root) {
      root.classList.add('vx-motion-ready'); /* CSS may now apply hidden states */
      Array.prototype.forEach.call(root.querySelectorAll('.vx-rise'), function (item) {
        revealItems.push(item);
        revealObserver.observe(item);
      });
    });

    /* Items already inside the viewport at load get revealed immediately so
       nothing visible ever flashes to hidden first. */
    var viewportH = window.innerHeight || document.documentElement.clientHeight;
    revealItems.forEach(function (item) {
      var rect = item.getBoundingClientRect();
      if (rect.top < viewportH && rect.bottom > 0) {
        item.classList.add('vx-rise--in');
        revealObserver.unobserve(item);
      }
    });

    /* Keyboard safety: reveal whatever receives focus, even if never intersected. */
    document.addEventListener(
      'focusin',
      function (event) {
        var group = event.target.closest ? event.target.closest('.vx-rise') : null;
        if (group && !group.classList.contains('vx-rise--in')) {
          group.classList.add('vx-rise--in');
          if (revealObserver) revealObserver.unobserve(group);
        }
      },
      true
    );
  }

  /* ------------------------- editorial parallax ----------------------------- */
  var parallaxTargets = Array.prototype.slice.call(document.querySelectorAll('[data-vx-parallax="true"]'));
  if (reduceMotion || !desktop || parallaxTargets.length === 0 || !supportsObserver) {
    /* CSS keeps images static below 990px / under reduced motion. */
  } else {
    var ticking = false;
    var parallaxFrames = parallaxTargets.map(function (frame) {
      /* Frame already has overflow hidden + a scaled child image (see CSS). */
      return frame;
    });

    function updateParallax() {
      ticking = false;
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      parallaxFrames.forEach(function (frame) {
        var rect = frame.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > viewportHeight + 80) return; /* off-screen */
        var total = viewportHeight + rect.height;
        var progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / total));
        frame.style.setProperty('--vx-parallax-progress', progress.toFixed(3));
      });
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateParallax);
        }
      },
      { passive: true }
    );
    updateParallax();
  }
})();
