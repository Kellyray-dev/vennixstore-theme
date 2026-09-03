/**
 * VennixStore hero motion — quiet, desktop-first scroll parallax.
 *
 * Guardrails:
 * - transform-only (translate on the media frame), no layout shift.
 * - Gated by the section Theme-Editor toggle (`data-motion`), by
 *   `prefers-reduced-motion`, and by viewport width (>= 990 px).
 * - One rAF-throttled scroll listener; element is unobserved when off-screen.
 */
if (!customElements.get('vennix-hero')) {
  class VennixHero extends HTMLElement {
    connectedCallback() {
      this.frame = this.querySelector('[data-hero-media]');
      this.motionEnabled = this.dataset.motion === 'true';
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.desktop = window.matchMedia('(min-width: 990px)').matches;

      if (!this.frame || !this.motionEnabled || this.reducedMotion || !this.desktop) return;

      this.ticking = false;
      this.handleScroll = this.onScroll.bind(this);
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      window.addEventListener('resize', this.handleScroll, { passive: true });
      this.updateParallax();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('resize', this.handleScroll);
    }

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.updateParallax();
        this.ticking = false;
      });
    }

    updateParallax() {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const rect = this.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > viewportHeight + 80) return; // off-screen

      const total = viewportHeight + rect.height;
      const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / total));
      this.frame.style.setProperty('--hero-parallax', progress.toFixed(3));
    }
  }

  customElements.define('vennix-hero', VennixHero);
}
