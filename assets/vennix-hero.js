if (!customElements.get('vennix-hero')) {
  class VennixHero extends HTMLElement {
    connectedCallback() {
      this.media = this.querySelector('[data-hero-media]');
      this.motionEnabled = this.dataset.motion === 'true';
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.finePointer = window.matchMedia('(pointer: fine)').matches;

      if (!this.media || !this.motionEnabled || this.reducedMotion || !this.finePointer) return;

      this.frame = null;
      this.handlePointerMove = this.onPointerMove.bind(this);
      this.handlePointerLeave = this.onPointerLeave.bind(this);
      this.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      this.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
    }

    disconnectedCallback() {
      this.removeEventListener('pointermove', this.handlePointerMove);
      this.removeEventListener('pointerleave', this.handlePointerLeave);
      if (this.frame) window.cancelAnimationFrame(this.frame);
    }

    onPointerMove(event) {
      if (this.frame) return;

      this.frame = window.requestAnimationFrame(() => {
        const bounds = this.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -10;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -7;
        this.media.style.setProperty('--hero-shift-x', `${x.toFixed(2)}px`);
        this.media.style.setProperty('--hero-shift-y', `${y.toFixed(2)}px`);
        this.frame = null;
      });
    }

    onPointerLeave() {
      if (!this.media) return;
      this.media.style.setProperty('--hero-shift-x', '0px');
      this.media.style.setProperty('--hero-shift-y', '0px');
    }
  }

  customElements.define('vennix-hero', VennixHero);
}
