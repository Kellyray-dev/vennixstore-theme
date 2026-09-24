/**
 * VENNIX storefront behaviours
 * ----------------------------------------------------------------------------
 * Ported from the standalone VENNIX storefront theme (theme.js) and rebuilt on
 * top of this Dawn-based theme so there is ONE cart system (Dawn's cart drawer,
 * product-form and pub/sub) and ONE header. Everything here is a progressive
 * enhancement: without JavaScript every feature degrades to plain links/forms.
 *
 * Features
 *   - Wishlist (localStorage, no account needed) + header count + wishlist page
 *   - Toast notifications (polite live region)
 *   - Count-up statistics (store pulse / brand story)
 *   - Announcement bar rotation + dismiss
 *   - Scroll progress line + page-leave indicator
 *   - Pause/play control for decorative background video
 *   - Collection "load more" pagination
 *   - Cart discount code + gift message (cart attribute)
 *   - Delivery estimate (merchant-configured business days)
 *   - Back-in-stock request form that follows the selected variant
 *
 * Every custom element is guarded with customElements.get() so the file is
 * safe to load more than once and inside the theme editor.
 */
(function () {
  'use strict';

  if (window.__vennixStorefrontLoaded) return;
  window.__vennixStorefrontLoaded = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var strings = window.vennixStrings || {};

  function define(name, ctor) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, wait);
    };
  }

  /* ------------------------------------------------------------------ toast */
  function toast(message, link) {
    var region = document.querySelector('[data-vx-toasts]');
    if (!region) {
      region = document.createElement('div');
      region.className = 'vx-toasts';
      region.setAttribute('data-vx-toasts', '');
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    var el = document.createElement('div');
    el.className = 'vx-toast';
    var text = document.createElement('span');
    text.textContent = message;
    el.appendChild(text);
    if (link && link.href) {
      var a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label || '';
      a.className = 'vx-toast__link';
      el.appendChild(a);
    }
    region.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add('is-in');
    });
    setTimeout(function () {
      el.classList.remove('is-in');
      setTimeout(function () {
        el.remove();
      }, 320);
    }, 4200);
  }
  window.vennixToast = toast;

  /* --------------------------------------------------------------- wishlist */
  var WISHLIST_KEY = 'vennix:wishlist';

  var Wishlist = {
    list: function () {
      try {
        var items = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        return Array.isArray(items) ? items.filter(function (h) { return typeof h === 'string' && h; }) : [];
      } catch (e) {
        return [];
      }
    },
    save: function (items) {
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
      } catch (e) {
        /* storage full or blocked: keep working in-memory for this page */
      }
      document.dispatchEvent(new CustomEvent('vennix:wishlist-change', { detail: { items: items } }));
    },
    has: function (handle) {
      return this.list().indexOf(handle) > -1;
    },
    toggle: function (handle) {
      var items = this.list();
      var i = items.indexOf(handle);
      if (i > -1) items.splice(i, 1);
      else items.unshift(handle);
      this.save(items);
      return i === -1;
    },
    remove: function (handle) {
      var items = this.list().filter(function (h) { return h !== handle; });
      this.save(items);
    },
    clear: function () {
      this.save([]);
    },
  };
  window.VennixWishlist = Wishlist;

  // Keep several open tabs in step.
  window.addEventListener('storage', function (event) {
    if (event.key === WISHLIST_KEY) {
      document.dispatchEvent(new CustomEvent('vennix:wishlist-change', { detail: { items: Wishlist.list() } }));
    }
  });

  function paintWishlistCounts() {
    var count = Wishlist.list().length;
    document.querySelectorAll('[data-vx-wishlist-count]').forEach(function (el) {
      var num = el.querySelector('[data-vx-wishlist-count-number]') || el;
      num.textContent = count;
      el.hidden = count === 0;
    });
  }
  document.addEventListener('vennix:wishlist-change', paintWishlistCounts);
  document.addEventListener('DOMContentLoaded', paintWishlistCounts);
  document.addEventListener('shopify:section:load', paintWishlistCounts);

  class VxWishlistButton extends HTMLElement {
    connectedCallback() {
      this.handle = this.dataset.handle;
      this.button = this.querySelector('button');
      if (!this.handle || !this.button) return;
      this.onClick = this.onClick.bind(this);
      this.paint = this.paint.bind(this);
      this.button.addEventListener('click', this.onClick);
      document.addEventListener('vennix:wishlist-change', this.paint);
      this.paint();
    }

    disconnectedCallback() {
      if (this.button) this.button.removeEventListener('click', this.onClick);
      document.removeEventListener('vennix:wishlist-change', this.paint);
    }

    onClick(event) {
      event.preventDefault();
      event.stopPropagation();
      var added = Wishlist.toggle(this.handle);
      var title = this.dataset.title || '';
      if (added) {
        toast((strings.wishlistAdded || 'Saved to your wishlist') + (title ? ' — ' + title : ''), {
          href: this.dataset.wishlistUrl || root + 'pages/wishlist',
          label: strings.wishlistView || 'View wishlist',
        });
      } else {
        toast((strings.wishlistRemoved || 'Removed from your wishlist') + (title ? ' — ' + title : ''));
      }
    }

    paint() {
      var on = Wishlist.has(this.handle);
      this.button.setAttribute('aria-pressed', on ? 'true' : 'false');
      this.classList.toggle('is-saved', on);
      var label = on ? this.dataset.labelRemove : this.dataset.labelAdd;
      if (label) {
        if (this.dataset.iconOnly === 'true') this.button.setAttribute('aria-label', label);
        var text = this.querySelector('[data-vx-wishlist-label]');
        if (text) text.textContent = label;
      }
    }
  }
  define('vx-wishlist-button', VxWishlistButton);

  /**
   * Wishlist page grid. Each saved handle is rendered through the Section
   * Rendering API (`/products/<handle>?section_id=vennix-product-card`), so the
   * cards are the theme's real `card-product` snippet with live Shopify price,
   * availability and quick add — nothing is duplicated or cached client side.
   */
  class VxWishlistGrid extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('[data-vx-wishlist-list]');
      this.empty = this.querySelector('[data-vx-wishlist-empty]');
      this.loading = this.querySelector('[data-vx-wishlist-loading]');
      this.toolbar = this.querySelector('[data-vx-wishlist-toolbar]');
      this.countEl = this.querySelector('[data-vx-wishlist-total]');
      this.clearBtn = this.querySelector('[data-vx-wishlist-clear]');
      this.limit = parseInt(this.dataset.limit, 10) || 48;
      this.render = debounce(this.render.bind(this), 60);
      document.addEventListener('vennix:wishlist-change', this.render);
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', function () {
          Wishlist.clear();
        });
      }
      this.render();
    }

    disconnectedCallback() {
      document.removeEventListener('vennix:wishlist-change', this.render);
    }

    render() {
      var self = this;
      var handles = Wishlist.list().slice(0, this.limit);
      var token = (this.token = {});

      if (!handles.length) {
        this.list.innerHTML = '';
        this.show('empty');
        return;
      }

      // Keep already-rendered cards; only fetch new ones.
      var existing = {};
      Array.prototype.forEach.call(this.list.children, function (li) {
        existing[li.dataset.handle] = li;
      });
      if (!this.list.children.length) this.show('loading');

      Promise.all(
        handles.map(function (handle) {
          if (existing[handle]) return Promise.resolve({ handle: handle, node: existing[handle] });
          return fetch(root + 'products/' + encodeURIComponent(handle) + '?section_id=vennix-product-card')
            .then(function (response) {
              if (!response.ok) throw new Error(response.status);
              return response.text();
            })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var card = doc.querySelector('[data-vx-product-card]');
              if (!card) throw new Error('missing card');
              var li = document.createElement('li');
              li.className = 'grid__item vx-wishlist__item';
              li.dataset.handle = handle;
              li.innerHTML = card.innerHTML;
              return { handle: handle, node: li };
            })
            .catch(function (error) {
              // A deleted or unpublished product: drop it so the list self-heals.
              if (String(error && error.message) === '404') Wishlist.remove(handle);
              return null;
            });
        })
      ).then(function (results) {
        if (token !== self.token) return;
        var fragment = document.createDocumentFragment();
        results.forEach(function (r) {
          if (r) fragment.appendChild(r.node);
        });
        self.list.innerHTML = '';
        self.list.appendChild(fragment);
        if (self.countEl) self.countEl.textContent = self.list.children.length;
        self.show(self.list.children.length ? 'list' : 'empty');
      });
    }

    show(state) {
      if (this.empty) this.empty.hidden = state !== 'empty';
      if (this.loading) this.loading.hidden = state !== 'loading';
      if (this.toolbar) this.toolbar.hidden = state !== 'list';
      this.list.hidden = state !== 'list';
    }
  }
  define('vx-wishlist-grid', VxWishlistGrid);

  /* --------------------------------------------------------------- counters */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-vx-count-to'));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute('data-vx-count-decimals') || '0', 10) || 0;
    var prefix = el.getAttribute('data-vx-count-prefix') || '';
    var suffix = el.getAttribute('data-vx-count-suffix') || '';
    function paint(value) {
      el.textContent =
        prefix +
        (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString()) +
        suffix;
    }
    if (reduceMotion) {
      paint(target);
      return;
    }
    var started = null;
    function step(now) {
      if (!started) started = now;
      var p = Math.min(1, (now - started) / 1400);
      paint(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters(scope) {
    var counters = (scope || document).querySelectorAll('[data-vx-count-to]:not([data-vx-counted])');
    if (!counters.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        el.setAttribute('data-vx-counted', '');
      });
      return; // the server-rendered final value is already correct
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) {
      el.setAttribute('data-vx-counted', '');
      observer.observe(el);
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    initCounters();
  });
  document.addEventListener('shopify:section:load', function (event) {
    initCounters(event.target);
  });

  /* ----------------------------------------------------------- announcement */
  class VxAnnouncement extends HTMLElement {
    connectedCallback() {
      this.items = Array.prototype.slice.call(this.querySelectorAll('[data-vx-announcement-item]'));
      this.speed = parseInt(this.dataset.rotateSpeed, 10) || 0;
      this.mode = this.dataset.mode || 'inline';
      this.index = 0;

      var close = this.querySelector('[data-vx-announcement-close]');
      var storageKey = 'vennix:announcement-dismissed:' + (this.dataset.fingerprint || '');
      if (close) {
        try {
          if (!window.Shopify || !window.Shopify.designMode) {
            if (sessionStorage.getItem(storageKey) === '1') {
              this.closest('.shopify-section')?.setAttribute('hidden', '');
              return;
            }
          }
        } catch (e) {
          /* sessionStorage blocked */
        }
        close.addEventListener('click', () => {
          try {
            sessionStorage.setItem(storageKey, '1');
          } catch (e) {
            /* ignore */
          }
          (this.closest('.shopify-section') || this).setAttribute('hidden', '');
        });
      }

      if (this.items.length < 2 || this.speed <= 0) return;

      // Inline layout rotates only where the row no longer fits (below 990px),
      // so smaller screens still see every message instead of hiding them.
      this.query = window.matchMedia(this.mode === 'rotate' ? 'all' : '(max-width: 989px)');
      this.onQuery = this.sync.bind(this);
      if (this.query.addEventListener) this.query.addEventListener('change', this.onQuery);
      this.addEventListener('mouseenter', () => (this.paused = true));
      this.addEventListener('mouseleave', () => (this.paused = false));
      this.addEventListener('focusin', () => (this.paused = true));
      this.addEventListener('focusout', () => (this.paused = false));
      this.sync();
    }

    disconnectedCallback() {
      clearInterval(this.timer);
      if (this.query && this.query.removeEventListener) this.query.removeEventListener('change', this.onQuery);
    }

    sync() {
      clearInterval(this.timer);
      // Reduced motion: never auto-rotate; every message stays visible (scrollable row).
      var rotating = this.query.matches && !reduceMotion;
      this.classList.toggle('is-rotating', rotating);
      this.items.forEach((item, i) => item.classList.toggle('is-active', !rotating || i === this.index));
      if (!rotating) return;
      this.timer = setInterval(() => {
        if (this.paused) return;
        this.items[this.index].classList.remove('is-active');
        this.index = (this.index + 1) % this.items.length;
        this.items[this.index].classList.add('is-active');
      }, this.speed);
    }
  }
  define('vx-announcement', VxAnnouncement);

  /* ------------------------------------------------ background video toggle */
  // Pause/play control for decorative autoplay video (WCAG 2.2.2). The button
  // sits next to the video's frame inside the same section.
  function initVideoToggles(scope) {
    (scope || document).querySelectorAll('[data-vx-video-toggle]:not([data-vx-bound])').forEach(function (btn) {
      btn.setAttribute('data-vx-bound', '');
      var host = btn.closest('.shopify-section') || btn.parentElement;
      var video = host && host.querySelector('video');
      if (!video) {
        btn.hidden = true;
        return;
      }
      if (reduceMotion) {
        video.pause();
        video.removeAttribute('autoplay');
      }
      btn.addEventListener('click', function () {
        var paused = btn.getAttribute('aria-pressed') !== 'true';
        if (paused) video.pause();
        else video.play().catch(function () {});
        btn.setAttribute('aria-pressed', String(paused));
        btn.setAttribute('aria-label', paused ? btn.dataset.labelPlay || 'Play' : btn.dataset.labelPause || 'Pause');
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    initVideoToggles();
  });
  document.addEventListener('shopify:section:load', function (event) {
    initVideoToggles(event.target);
  });

  /* -------------------------------------------------------- scroll progress */
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('[data-vx-scroll-progress]');
    if (!bar || reduceMotion) return;
    var ticking = false;
    function tick() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
    }
    function request() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(tick);
      }
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    tick();

    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link || event.defaultPrevented) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (e) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      bar.classList.add('is-loading');
    });
    window.addEventListener('pageshow', function () {
      bar.classList.remove('is-loading');
    });
  });

  /* -------------------------------------------------------------- load more */
  class VxLoadMore extends HTMLElement {
    connectedCallback() {
      // The trigger is a real link to the next page, so crawlers and no-JS
      // visitors still paginate; with JS the next page is appended in place.
      this.trigger = this.querySelector('[data-vx-load-more-trigger]');
      if (!this.trigger) return;
      this.onClick = this.onClick.bind(this);
      this.trigger.addEventListener('click', this.onClick);
    }

    disconnectedCallback() {
      if (this.trigger) this.trigger.removeEventListener('click', this.onClick);
    }

    onClick(event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      if (this.busy) return;
      this.load();
    }

    setBusy(busy, label) {
      this.busy = busy;
      this.trigger.setAttribute('aria-disabled', busy ? 'true' : 'false');
      this.trigger.classList.toggle('loading', busy);
      if (label != null) this.trigger.innerHTML = label;
    }

    load() {
      var next = this.trigger.getAttribute('href');
      var grid = document.getElementById(this.dataset.gridId || 'product-grid');
      if (!next || !grid) {
        if (next) window.location.href = next;
        return;
      }
      var label = this.trigger.innerHTML;
      this.setBusy(true, strings.loading || 'Loading…');
      var url = new URL(next, window.location.href);
      if (this.dataset.sectionId) url.searchParams.set('section_id', this.dataset.sectionId);

      fetch(url.toString())
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        })
        .then((html) => {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var incomingGrid = doc.getElementById(this.dataset.gridId || 'product-grid');
          var items = incomingGrid ? Array.prototype.slice.call(incomingGrid.children) : [];
          var firstNew = null;
          items.forEach(function (node) {
            // Reveal-on-scroll classes would keep appended cards invisible.
            node.querySelectorAll('.scroll-trigger').forEach(function (el) {
              el.classList.remove('scroll-trigger', 'animate--slide-in', 'animate--fade-in');
            });
            node.classList.remove('scroll-trigger', 'animate--slide-in');
            grid.appendChild(node);
            if (!firstNew) firstNew = node;
          });

          var status = this.querySelector('[data-vx-load-more-status]');
          if (status && this.dataset.total) {
            status.textContent = (strings.showing || 'Showing [shown] of [total] products')
              .replace('[shown]', grid.children.length)
              .replace('[total]', this.dataset.total);
          }

          var following = doc.querySelector('vx-load-more [data-vx-load-more-trigger]');
          if (following && following.getAttribute('href')) {
            this.trigger.setAttribute('href', following.getAttribute('href'));
            this.setBusy(false, label);
          } else {
            this.trigger.remove();
          }
          history.replaceState(history.state, '', next);
          // Move focus to the first new product for keyboard and screen reader users.
          var focusTarget = firstNew && firstNew.querySelector('a[href]');
          if (focusTarget) focusTarget.focus({ preventScroll: true });
          document.dispatchEvent(new CustomEvent('vennix:content-added', { detail: { container: grid } }));
        })
        .catch(() => {
          this.setBusy(false, label);
          toast(strings.loadError || 'Could not load more products. Please try again.');
        });
    }
  }
  define('vx-load-more', VxLoadMore);

  /* ------------------------------------------------------ cart: discount code */
  document.addEventListener('submit', function (event) {
    var form = event.target.closest && event.target.closest('[data-vx-discount-form]');
    if (!form) return;
    var input = form.querySelector('[name="discount"]');
    var code = input ? input.value.trim() : '';
    event.preventDefault();
    if (!code) {
      if (input) input.focus();
      return;
    }
    // /discount/<code> stores the code on the session; Shopify applies and
    // validates it at checkout. Redirect back to where the shopper was.
    var back = window.location.pathname + window.location.search;
    window.location.href = root + 'discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(back);
  });

  /* ---------------------------------------------- cart: attribute (gift note) */
  class VxCartAttribute extends HTMLElement {
    connectedCallback() {
      this.field = this.querySelector('textarea, input');
      if (!this.field) return;
      this.onInput = debounce(this.save.bind(this), 400);
      this.field.addEventListener('input', this.onInput);
    }

    save() {
      var body = {};
      body[this.dataset.attribute || 'Gift message'] = this.field.value;
      var url = (window.routes && window.routes.cart_update_url) || root + 'cart/update';
      fetch(url + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ attributes: body }),
      }).catch(function () {
        /* the value is re-sent on the next keystroke */
      });
    }
  }
  define('vx-cart-attribute', VxCartAttribute);

  /* ------------------------------------------------------ delivery estimate */
  class VxDeliveryEstimate extends HTMLElement {
    connectedCallback() {
      var out = this.querySelector('[data-vx-delivery-window]');
      if (!out) return;
      var min = parseInt(this.dataset.min, 10);
      var max = parseInt(this.dataset.max, 10);
      if (isNaN(min) || isNaN(max)) return;
      var skipWeekends = this.dataset.skipWeekends === 'true';
      var cutoff = parseInt(this.dataset.cutoff, 10);
      var now = new Date();
      var start = new Date(now);
      if (!isNaN(cutoff) && cutoff > 0 && now.getHours() >= cutoff) start.setDate(start.getDate() + 1);

      function addDays(from, days) {
        var d = new Date(from);
        var added = 0;
        while (added < days) {
          d.setDate(d.getDate() + 1);
          if (!skipWeekends || (d.getDay() !== 0 && d.getDay() !== 6)) added++;
        }
        return d;
      }
      var locale = document.documentElement.lang || undefined;
      var fmt = function (d) {
        return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
      };
      out.textContent = fmt(addDays(start, min)) + ' – ' + fmt(addDays(start, Math.max(min, max)));

      var countdown = this.querySelector('[data-vx-delivery-countdown]');
      if (countdown && !isNaN(cutoff) && cutoff > 0 && now.getHours() < cutoff) {
        var end = new Date(now);
        end.setHours(cutoff, 0, 0, 0);
        var mins = Math.round((end - now) / 60000);
        var label = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm';
        countdown.textContent = (countdown.dataset.template || '[time]').replace('[time]', label);
        countdown.hidden = false;
      }
    }
  }
  define('vx-delivery-estimate', VxDeliveryEstimate);

  /* --------------------------------------------------------- back in stock */
  function readVariants(el) {
    var json = el.querySelector('script[type="application/json"]');
    if (!json) return [];
    try {
      return JSON.parse(json.textContent) || [];
    } catch (e) {
      return [];
    }
  }

  class VxBackInStock extends HTMLElement {
    connectedCallback() {
      this.variants = readVariants(this);
      this.formId = this.dataset.productFormId;
      this.idInput = document.querySelector('#' + this.formId + ' input[name="id"]');
      this.subject = this.querySelector('[name="contact[subject]"]');
      this.body = this.querySelector('[name="contact[body]"]');
      this.onChange = this.update.bind(this);
      if (this.idInput) this.idInput.addEventListener('change', this.onChange);
      this.update();
    }

    disconnectedCallback() {
      if (this.idInput) this.idInput.removeEventListener('change', this.onChange);
    }

    update() {
      if (this.dataset.posted === 'true') {
        this.hidden = false;
        return;
      }
      var id = this.idInput ? String(this.idInput.value) : this.dataset.variantId;
      var variant = this.variants.find(function (v) { return String(v.id) === id; });
      // The request form only exists while the chosen option is sold out.
      var show = !!variant && !variant.available;
      this.hidden = !show;
      if (show && this.body) {
        this.body.value = (this.dataset.bodyTemplate || '')
          .replace('[product]', this.dataset.productTitle || '')
          .replace('[variant]', variant.title);
      }
    }
  }
  define('vx-back-in-stock', VxBackInStock);
})();
