/**
 * VennixStore — slide-style product rail
 *
 * Two custom elements, both defined defensively so a partial load never throws:
 *
 *  - <vennix-rail-slider>  Scroll-snapping "slide" rail. Shared by the store-wide
 *                          left rail (sections/vennix-product-rail.liquid) and the
 *                          homepage showcase (sections/vennix-product-showcase.liquid).
 *                          Dawn's SliderComponent (assets/global.js) is horizontal-only
 *                          (scrollLeft / offsetLeft / clientWidth), so the geometry lives
 *                          here instead of forking that class. The axis is declared in
 *                          markup (data-rail-axis / data-rail-axis-mobile) and re-read on
 *                          the matching media query, so the same markup can be a vertical
 *                          rail on desktop and a horizontal swipe strip on mobile.
 *
 *  - <vennix-product-rail> Off-canvas panel docked to the left edge. Mirrors the
 *                          interaction contract of CartDrawer (assets/cart-drawer.js):
 *                          escape to close, overlay click to close, focus trapped on
 *                          open, focus returned to the opener on close, and
 *                          body.overflow-hidden while open.
 *
 * Depends on trapFocus / removeTrapFocus from assets/global.js. Both are feature-detected
 * so the rail still opens if global.js is blocked.
 */

const VX_REDUCED_MOTION =
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const VX_MOBILE_QUERY = window.matchMedia ? window.matchMedia('(max-width: 749px)') : null;

class VennixRailSlider extends HTMLElement {
  constructor() {
    super();

    this.track = this.querySelector('[data-rail-track]');
    if (!this.track) return;

    this.slides = Array.from(this.track.querySelectorAll('[data-rail-slide]'));
    this.prevButton = this.querySelector('[data-rail-prev]');
    this.nextButton = this.querySelector('[data-rail-next]');
    this.currentEl = this.querySelector('[data-rail-counter-current]');
    this.totalEl = this.querySelector('[data-rail-counter-total]');
    this.dotsWrap = this.querySelector('[data-rail-dots]');
    this.index = 0;

    if (this.totalEl) this.totalEl.textContent = String(this.slides.length);
    this.buildDots();

    this.track.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    if (this.prevButton) this.prevButton.addEventListener('click', () => this.step(-1));
    if (this.nextButton) this.nextButton.addEventListener('click', () => this.step(1));

    // The showcase flips axis at the mobile breakpoint; re-read geometry when it does.
    this.onBreakpointChange = () => this.sync();
    if (VX_MOBILE_QUERY) {
      if (typeof VX_MOBILE_QUERY.addEventListener === 'function') {
        VX_MOBILE_QUERY.addEventListener('change', this.onBreakpointChange);
      } else if (typeof VX_MOBILE_QUERY.addListener === 'function') {
        VX_MOBILE_QUERY.addListener(this.onBreakpointChange);
      }
    }

    if (typeof ResizeObserver === 'function') {
      // Slide offsets move when images decode, fonts swap, or the viewport resizes.
      const observer = new ResizeObserver(() => this.sync());
      observer.observe(this.track);
    }

    this.sync();
  }

  /** 'vertical' or 'horizontal', following the markup declaration and the breakpoint. */
  get axis() {
    const mobileAxis = this.dataset.railAxisMobile;
    if (mobileAxis && VX_MOBILE_QUERY && VX_MOBILE_QUERY.matches) return mobileAxis;
    return this.dataset.railAxis || 'vertical';
  }

  buildDots() {
    if (!this.dotsWrap) return;
    this.dotsWrap.innerHTML = '';
    this.dots = this.slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'vx-rail-dot';
      dot.setAttribute('data-rail-dot', String(i));
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsWrap.appendChild(dot);
      return dot;
    });
  }

  /** Absolute scroll offset of each slide, relative to the first slide. */
  offsets() {
    const base = this.slides.length ? this.slides[0][this.axis === 'horizontal' ? 'offsetLeft' : 'offsetTop'] : 0;
    return this.slides.map((slide) => {
      const offset = slide[this.axis === 'horizontal' ? 'offsetLeft' : 'offsetTop'];
      return Math.max(0, offset - base);
    });
  }

  scrollPosition() {
    return this.axis === 'horizontal' ? this.track.scrollLeft : this.track.scrollTop;
  }

  scrollTo(offset) {
    const options = { behavior: VX_REDUCED_MOTION ? 'auto' : 'smooth' };
    if (this.axis === 'horizontal') {
      this.track.scrollTo({ left: offset, ...options });
    } else {
      this.track.scrollTo({ top: offset, ...options });
    }
  }

  nearestIndex() {
    const offsets = this.offsets();
    if (!offsets.length) return 0;
    const position = this.scrollPosition();
    let nearest = 0;
    let smallest = Infinity;
    offsets.forEach((offset, i) => {
      const distance = Math.abs(offset - position);
      if (distance < smallest) {
        smallest = distance;
        nearest = i;
      }
    });
    return nearest;
  }

  goTo(i, focus = false) {
    if (!this.slides.length) return;
    const target = Math.min(Math.max(i, 0), this.slides.length - 1);
    this.scrollTo(this.offsets()[target]);
    this.index = target;
    this.render();
    if (focus) this.slides[target].querySelector('a, button')?.focus();
  }

  step(direction) {
    // Step to the next slide boundary rather than paging by a fixed distance —
    // product cards are not all the same size.
    const offsets = this.offsets();
    const position = this.scrollPosition();
    let target = this.index + direction;

    if (direction > 0) {
      const forward = offsets.findIndex((offset) => offset > position + 2);
      target = forward === -1 ? offsets.length - 1 : forward;
    } else {
      let back = 0;
      offsets.forEach((offset, i) => {
        if (offset < position - 2) back = i;
      });
      target = back;
    }
    this.goTo(target);
  }

  onScroll() {
    this.index = this.nearestIndex();
    this.render();
  }

  render() {
    const last = this.slides.length - 1;
    if (this.currentEl) this.currentEl.textContent = String(this.index + 1);

    if (this.prevButton) this.prevButton.disabled = this.index <= 0;
    if (this.nextButton) this.nextButton.disabled = this.index >= last;

    if (this.dots) {
      this.dots.forEach((dot, i) => {
        const active = i === this.index;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }
  }

  /** Re-read geometry and clamp the active index (viewport / image-size changes). */
  sync() {
    if (!this.slides.length) return;
    this.index = Math.min(this.nearestIndex(), this.slides.length - 1);
    this.render();
  }
}

if (!customElements.get('vennix-rail-slider')) {
  customElements.define('vennix-rail-slider', VennixRailSlider);
}

class VennixProductRail extends HTMLElement {
  constructor() {
    super();

    this.tab = this.querySelector('[data-rail-tab]');
    this.panel = this.querySelector('[data-rail-panel]');
    this.overlay = this.querySelector('[data-rail-overlay]');
    this.closeButton = this.querySelector('[data-rail-close]');
    this.activeElement = null;

    if (this.tab) {
      this.tab.addEventListener('click', () => this.toggle());
      this.tab.addEventListener('keydown', (event) => {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          this.toggle();
        }
      });
    }
    if (this.closeButton) this.closeButton.addEventListener('click', () => this.close());
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());
    this.addEventListener('keyup', (event) => event.code === 'Escape' && this.isOpen && this.close());

    // The panel starts out of the accessibility tree and the tab order until it is
    // opened, so a closed rail never leaks focusable content.
    this.setHidden(true);

    const autoDelay = parseInt(this.dataset.autoOpen, 10);
    if (autoDelay > 0) this.scheduleAutoOpen(autoDelay * 1000);
  }

  get isOpen() {
    return this.classList.contains('is-open');
  }

  scheduleAutoOpen(delay) {
    // Never fight the merchant in the theme editor, never re-open on every page of
    // one visit, and never auto-open for visitors who asked for reduced motion.
    if (window.Shopify?.designMode || VX_REDUCED_MOTION) return;
    try {
      if (sessionStorage.getItem('vx-rail-shown')) return;
      sessionStorage.setItem('vx-rail-shown', '1');
    } catch (error) {
      /* Private mode or blocked storage — just skip the auto-open. */
      return;
    }

    setTimeout(() => {
      // A visitor already reading the cart drawer does not want a second panel.
      if (document.querySelector('cart-drawer.active')) return;
      if (document.visibilityState !== 'visible') return;
      this.open();
    }, delay);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Run `callback` once the panel transition settles.
   *
   * `transitionend` bubbles, so a naive listener also fires for hover transitions
   * on buttons *inside* the panel — hence the `event.target === this` guard. And
   * no transition runs at all when the panel is `display: none` (below 750px) or
   * when transitions are globally disabled, so a timer is the fallback.
   */
  afterTransition(callback) {
    if (VX_REDUCED_MOTION) {
      callback();
      return;
    }
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      this.removeEventListener('transitionend', onEnd);
      clearTimeout(timer);
      callback();
    };
    const onEnd = (event) => {
      if (event.target === this) run();
    };
    this.addEventListener('transitionend', onEnd);
    const timer = setTimeout(run, 500);
  }

  open() {
    if (this.isOpen) return;
    this.classList.add('is-open');
    this.setHidden(false);
    if (this.tab) this.tab.setAttribute('aria-expanded', 'true');
    document.body.classList.add('overflow-hidden');
    this.activeElement = document.activeElement;

    // Trap after the transition so focus never lands on a mid-animation panel.
    this.afterTransition(() => {
      if (!this.panel) return;
      const initial = this.panel.querySelector('[data-rail-initial-focus]') || this.panel;
      if (typeof trapFocus === 'function') {
        trapFocus(this.panel, initial);
      } else if (typeof initial.focus === 'function') {
        initial.focus();
      }
    });
  }

  close() {
    if (!this.isOpen) return;
    this.classList.remove('is-open');
    if (this.tab) this.tab.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('overflow-hidden');
    if (typeof removeTrapFocus === 'function') removeTrapFocus(this.activeElement);
    this.activeElement = null;
    // Keep the panel in the DOM but remove it from the tab order once the slide-out
    // finishes, so the transition is not cut short.
    this.afterTransition(() => this.setHidden(true));
  }

  setHidden(hidden) {
    if (!this.panel) return;
    this.panel.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    this.panel.inert = hidden;
    if (this.tab) this.tab.setAttribute('aria-expanded', hidden ? 'false' : 'true');
  }
}

if (!customElements.get('vennix-product-rail')) {
  customElements.define('vennix-product-rail', VennixProductRail);
}
