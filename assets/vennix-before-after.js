if (!customElements.get('vennix-before-after')) {
  class VennixBeforeAfter extends HTMLElement {
    connectedCallback() {
      this.stage = this.hasAttribute('data-ba-stage') ? this : (this.querySelector('[data-ba-stage]') || this);
      this.clip = this.querySelector('[data-ba-clip]');
      this.divider = this.querySelector('[data-ba-divider]');
      if (!this.clip || !this.divider) return;

      this.position = 50;
      this.frame = null;

      if (!this.stage.hasAttribute('role')) this.stage.setAttribute('role', 'slider');
      if (!this.stage.hasAttribute('tabindex')) this.stage.setAttribute('tabindex', '0');
      if (!this.stage.hasAttribute('aria-label')) {
        this.stage.setAttribute('aria-label', 'Before and after comparison slider');
      }
      this.stage.setAttribute('aria-valuemin', '0');
      this.stage.setAttribute('aria-valuemax', '100');
      this.stage.setAttribute('aria-orientation', 'horizontal');
      if (!this.stage.hasAttribute('aria-valuenow')) {
        this.stage.setAttribute('aria-valuenow', '50');
      }

      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);

      this.stage.addEventListener('pointerdown', this.onPointerDown);
      this.stage.addEventListener('keydown', this.onKeyDown);
    }

    disconnectedCallback() {
      this.stage?.removeEventListener('pointerdown', this.onPointerDown);
      this.stage?.removeEventListener('keydown', this.onKeyDown);
      this.stage?.removeEventListener('pointermove', this.onPointerMove);
      this.stage?.removeEventListener('pointerup', this.onPointerUp);
      this.stage?.removeEventListener('pointercancel', this.onPointerUp);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerUp);
      if (this.frame) window.cancelAnimationFrame(this.frame);
    }

    onPointerDown(event) {
      /* Don't hijack scrolling on touch unless the drag starts on the handle area */
      this.stage.setPointerCapture(event.pointerId);
      window.addEventListener('pointerup', this.onPointerUp, { once: true });
      window.addEventListener('pointercancel', this.onPointerUp, { once: true });
      this.update(event);
      this.dragging = true;
      window.addEventListener('pointermove', this.onPointerMove);
    }

    onPointerMove(event) {
      if (!this.dragging) return;
      this.update(event);
    }

    onPointerUp(event) {
      this.dragging = false;
      window.removeEventListener('pointermove', this.onPointerMove);
      if (this.stage.hasPointerCapture && this.stage.hasPointerCapture(event.pointerId)) {
        this.stage.releasePointerCapture(event.pointerId);
      }
    }

    onKeyDown(event) {
      const step = event.shiftKey ? 10 : 3;
      let handled = true;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          this.setPosition(this.position - step);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          this.setPosition(this.position + step);
          break;
        case 'PageDown':
          this.setPosition(this.position - 10);
          break;
        case 'PageUp':
          this.setPosition(this.position + 10);
          break;
        case 'Home':
          this.setPosition(0);
          break;
        case 'End':
          this.setPosition(100);
          break;
        default:
          handled = false;
      }

      if (handled) event.preventDefault();
    }

    update(event) {
      const rect = this.stage.getBoundingClientRect();
      const x = event.clientX - rect.left;
      this.setPosition((x / rect.width) * 100);
    }

    setPosition(value) {
      this.position = Math.min(100, Math.max(0, value));

      if (this.frame) window.cancelAnimationFrame(this.frame);
      this.frame = window.requestAnimationFrame(() => {
        const pct = `${this.position.toFixed(2)}%`;
        this.clip.style.clipPath = `inset(0 ${100 - parseFloat(pct)}% 0 0)`;
        this.divider.style.left = pct;
        this.stage.setAttribute('aria-valuenow', Math.round(this.position));
        this.frame = null;
      });
    }
  }

  customElements.define('vennix-before-after', VennixBeforeAfter);
}
