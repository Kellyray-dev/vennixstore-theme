/**
 * Vennix — premium cart note
 * ------------------------------------------------------------------
 * Always-visible order note for the cart drawer.
 *   • Debounced Ajax save to {{ routes.cart_update_url }} ({ note })
 *   • Live character counter with soft-limit warning
 *   • Status pill: Saving… / Saved ✓ / Couldn't save
 *
 * Built as a custom element so every cart-drawer re-render re-initialises
 * itself automatically (Dawn swaps the #CartDrawer innerHTML).
 */
if (!customElements.get('vnx-cart-note')) {
  customElements.define(
    'vnx-cart-note',
    class VnxCartNote extends HTMLElement {
      static DEBOUNCE_MS = 450;

      connectedCallback() {
        if (this.dataset.ready === 'true') return;
        this.dataset.ready = 'true';

        this.input = this.querySelector('textarea');
        if (!this.input || !window.routes || !window.routes.cart_update_url) return;

        this.statusEl = this.querySelector('[data-vnx-status]');
        this.countEl = this.querySelector('[data-vnx-count]');

        this.maxLength = parseInt(this.input.getAttribute('maxlength'), 10) || 200;
        this.savedValue = this.input.value;
        this.pendingValue = null;
        this.debounceId = null;
        this.requestId = 0;

        this.updateCount();

        // A prefilled note was already persisted — reflect it without a flash.
        if (this.savedValue.length > 0) {
          this.setStatus('saved', { silent: true });
        }

        this.input.addEventListener('input', (event) => {
          const value = event.currentTarget.value;
          this.updateCount();

          if (value === this.savedValue) {
            clearTimeout(this.debounceId);
            this.pendingValue = null;
            this.setStatus('saved');
            return;
          }

          clearTimeout(this.debounceId);
          this.pendingValue = value;
          this.setStatus('saving');
          this.debounceId = setTimeout(() => {
            this.pendingValue = null;
            this.save(value);
          }, VnxCartNote.DEBOUNCE_MS);
        });

        // Never lose keystrokes when focus leaves mid-debounce.
        this.input.addEventListener('blur', () => {
          if (this.pendingValue !== null && this.input.value !== this.savedValue) {
            clearTimeout(this.debounceId);
            this.pendingValue = null;
            this.save(this.input.value);
          }
        });
      }

      async save(value) {
        const token = ++this.requestId;
        this.setStatus('saving');

        try {
          const response = await fetch(window.routes.cart_update_url, {
            ...fetchConfig('json'),
            body: JSON.stringify({ note: value }),
          });
          const cart = await response.json().catch(() => null);
          if (!response.ok || !cart || typeof cart.status === 'number') {
            throw new Error(cart && cart.description ? cart.description : 'Cart note update failed');
          }
          // Ignore stale responses once a newer request has been issued.
          if (token !== this.requestId) return;

          this.savedValue = value;
          this.setStatus('saved');
        } catch (error) {
          if (token !== this.requestId) return;
          console.error('[Vennix] Cart note:', error);
          this.setStatus('error');
        }
      }

      setStatus(state, options = {}) {
        if (!this.statusEl) return;

        const labels = {
          saving: this.dataset.labelSaving,
          saved: this.dataset.labelSaved,
          error: this.dataset.labelError,
        };

        this.statusEl.classList.remove(
          'vnx-status-pill--saving',
          'vnx-status-pill--saved',
          'vnx-status-pill--error'
        );
        this.statusEl.classList.add(`vnx-status-pill--${state}`);

        const textEl = this.statusEl.querySelector('.vnx-status-pill__text');
        if (textEl) textEl.textContent = labels[state] || '';

        if (options.silent) {
          this.statusEl.classList.add('is-visible');
        } else {
          requestAnimationFrame(() => this.statusEl.classList.add('is-visible'));
        }
      }

      updateCount() {
        if (!this.countEl) return;
        const length = this.input.value.length;
        this.countEl.textContent = String(length);
        this.countEl.classList.toggle('is-near-limit', length / this.maxLength >= 0.9);
      }
    }
  );
}
