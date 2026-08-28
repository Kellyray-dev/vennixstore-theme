/* ============================================================
   Vennix Quick View
   Fetches the product's main-product section via the Section
   Rendering API, rebuilds a lightweight gallery, and reuses the
   cloned Dawn <product-info> machinery (variant picker, price,
   quantity, add-to-cart) inside a single shared modal.
   ============================================================ */
(function () {
  'use strict';

  var modal = null;
  var lastFocus = null;
  var isOpen = false;

  var CLOSE_ICON =
    '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none">' +
    '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function ensureShell() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'vx-qv';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="vx-qv__overlay" data-qv-close></div>' +
      '<div class="vx-qv__dialog" role="dialog" aria-modal="true" aria-label="Product quick view">' +
      '<button type="button" class="vx-qv__close" data-qv-close aria-label="Close quick view">' +
      CLOSE_ICON +
      '</button>' +
      '<div class="vx-qv__body">' +
      '<div class="vx-qv__media" data-qv-media></div>' +
      '<div class="vx-qv__info" data-qv-info></div>' +
      '</div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target.closest('[data-qv-close]')) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) close();
    });
    return modal;
  }

  function close() {
    if (!modal) return;
    isOpen = false;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('vx-qv-open');
    window.setTimeout(
      function () {
        if (!isOpen) modal.hidden = true;
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300
    );
    if (lastFocus) lastFocus.focus();
  }

  function loadScripts(doc) {
    doc.querySelectorAll('script[src]').forEach(function (script) {
      var src = script.getAttribute('src');
      if (!src) return;
      var absolute = new URL(src, window.location.origin).href;
      if (document.querySelector('script[src="' + absolute + '"]')) return;
      var tag = document.createElement('script');
      tag.src = absolute;
      tag.defer = true;
      document.head.appendChild(tag);
    });
  }

  function buildGallery(mediaList, images) {
    if (!images.length) return;
    var main = document.createElement('div');
    main.className = 'vx-qv__media-main';
    var thumbs = document.createElement('div');
    thumbs.className = 'vx-qv__media-thumbs';

    images.slice(0, 6).forEach(function (img, index) {
      var clone = img.cloneNode(true);
      clone.removeAttribute('loading');
      clone.setAttribute('sizes', '(min-width: 990px) 40vw, 90vw');
      clone.className = 'vx-qv__media-img' + (index === 0 ? ' is-active' : '');
      main.appendChild(clone);

      var thumb = img.cloneNode(true);
      thumb.removeAttribute('loading');
      thumb.setAttribute('sizes', '72px');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'vx-qv__thumb' + (index === 0 ? ' is-active' : '');
      button.setAttribute('aria-label', 'View image ' + (index + 1));
      button.appendChild(thumb);
      button.addEventListener('click', makeThumbSwap(thumbs, main, index, button));
      thumbs.appendChild(button);
    });

    mediaList.appendChild(main);
    if (images.length > 1) mediaList.appendChild(thumbs);
  }

  function makeThumbSwap(thumbs, main, index, button) {
    return function () {
      thumbs.querySelectorAll('.vx-qv__thumb').forEach(function (t) {
        t.classList.remove('is-active');
      });
      main.querySelectorAll('.vx-qv__media-img').forEach(function (m) {
        m.classList.remove('is-active');
      });
      button.classList.add('is-active');
      main.children[index].classList.add('is-active');
    };
  }

  function buildInfo(sourceInfo, infoPane) {
    var clone = sourceInfo.cloneNode(true);
    clone
      .querySelectorAll(
        '.product__accordion, .share-button, .product__view-details, ' +
          'pickup-availability, complementary-products, vx-shipping-progress, ' +
          '.product__text'
      )
      .forEach(function (el) {
        el.remove();
      });
    infoPane.appendChild(clone);
  }

  function open(url, trigger) {
    lastFocus = trigger || document.activeElement;
    var shell = ensureShell();
    var mediaPane = shell.querySelector('[data-qv-media]');
    var infoPane = shell.querySelector('[data-qv-info]');
    mediaPane.innerHTML =
      '<div class="vx-qv__loading"><span class="vx-qv__spinner"></span></div>';
    infoPane.innerHTML = '';
    shell.hidden = false;
    isOpen = true;
    window.requestAnimationFrame(function () {
      shell.classList.add('is-open');
    });
    document.documentElement.classList.add('vx-qv-open');
    shell.querySelector('.vx-qv__close').focus();

    var requestUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'section_id=main-product';
    fetch(requestUrl)
      .then(function (response) {
        if (!response.ok) throw new Error('Quick view fetch failed');
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        loadScripts(doc);
        mediaPane.innerHTML = '';
        var images = Array.prototype.slice
          .call(doc.querySelectorAll('.product__media-item img'))
          .filter(function (img) {
            return img.getAttribute('src');
          });
        buildGallery(mediaPane, images);
        var sourceInfo = doc.querySelector('.product__info-container');
        if (sourceInfo) buildInfo(sourceInfo, infoPane);
      })
      .catch(function () {
        window.location.href = url;
      });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-quick-view]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger.getAttribute('data-quick-view-url'), trigger);
  });
})();
