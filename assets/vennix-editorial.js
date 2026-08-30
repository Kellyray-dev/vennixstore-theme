if (!customElements.get('vennix-editorial')) {
  class VennixEditorial extends HTMLElement {
    connectedCallback() {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.zoomEnabled = this.dataset.zoom === 'true';
      this.parallaxEnabled = this.dataset.parallax === 'true';
      this.media = this.querySelector('[data-editorial-media]');

      this.reveal();

      if (this.reducedMotion || !this.media || (!this.zoomEnabled && !this.parallaxEnabled)) return;

      this.frame = null;
      this.onScroll = () => this.requestUpdate();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.requestUpdate();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
      if (this.frame) window.cancelAnimationFrame(this.frame);
    }

    /* Staggered fade-up reveal driven by IntersectionObserver */
    reveal() {
      const items = this.querySelectorAll('.vx-esplit__reveal');
      if (!items.length) return;

      if (this.reducedMotion || !('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.25 }
      );

      items.forEach((item, index) => {
        item.style.setProperty('--vx-esplit-delay', `${(index * 0.12).toFixed(2)}s`);
        observer.observe(item);
      });
    }

    requestUpdate() {
      if (this.frame) return;
      this.frame = window.requestAnimationFrame(() => {
        this.update();
        this.frame = null;
      });
    }

    update() {
      const rect = this.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewH) return;

      /* Progress of the section through the viewport: 0 (entering) → 1 (leaving) */
      const progress = Math.min(1, Math.max(0, (viewH - rect.top) / (viewH + rect.height)));

      if (this.zoomEnabled) {
        this.media.style.setProperty('--vx-esplit-zoom', (1.06 + progress * 0.06).toFixed(4));
      }

      if (this.parallaxEnabled && window.matchMedia('(pointer: fine)').matches) {
        const drift = (progress - 0.5) * 36;
        this.media.style.setProperty('--vx-esplit-y', `${drift.toFixed(1)}px`);
      }
    }
  }

  customElements.define('vennix-editorial', VennixEditorial);
}
