/**
 * Vennix — in-store pickup / shipping picker
 * ------------------------------------------------------------------
 * Segmented delivery-method control for the cart drawer.
 *   • Persists the choice as a cart attribute via /cart/update.js
 *     ({ attributes: { fulfillment: 'shipping' | 'pickup' } })
 *   • Accessible radiogroup (roving tabindex, Arrow/Home/End keys)
 *   • Optimistically syncs UI: hides/free-shipping card + shipping
 *     note while pickup is active; restores on error.
 *
 * Server renders the persisted state (cart.attributes.fulfillment),
 * so section re-renders stay in sync automatically.
 */
if (!customElements.get('vnx-fulfillment-picker')) {
  customElements.define(
    'vnx-fulfillment-picker',
    class VnxFulfillmentPicker extends HTMLElement {
      connectedCallback() {
        if (this.dataset.ready === 'true') return;
        this.dataset.ready = 'true';

        this.statusEl = this.querySelector('[data-vnx-status]');
        this.control = this.querySelector('[data-vnx-control]');
        this.options = Array.from(this.querySelectorAll('[data-vnxFulfillmentOption]'));
        this.drawer = this.closest('cart-drawer');
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.value = this.getAttribute('data-vnx-value') === 'pickup' ? 'pickup' : 'shipping';
        this.busy = false;
        this.cardHidden = this.pickupCardHidden();

        if (!this.options.length || !window.routes || !window.routes.cart_update_url) return;

        this.options.forEach((option) => {
          option.addEventListener('click', () => this.select(option.dataset.vnxValue));
        });
        this.control.addEventListener('keydown', this.onKeydown.bind(this));

        this.syncState();
        this.syncDrawerMode();
      }

      get pickupCard() {
        return this.drawer ? this.drawer.querySelector('.vx-shipping-progress') : null;
      }

      pickupCardHidden() {
        const card = this.pickupCard;
        if (!card) return true;
        return card.hidden || this.drawer.classList.contains('vnx-pickup-mode');
      }

      select(value) {
        if (this.busy || !value || value === this.value) return;
        const previous = this.value;
        this.value = value === 'pickup' ? 'pickup' : 'shipping';

        this.syncState();
        this.syncDrawerMode();
        this.updateShippingVisibility();
        this.persist(value, previous);
      }

      async persist(value, previous) {
        this.busy = true;
        this.syncState();
        this.setStatus('saving');

        try {
          const response = await fetch(window.routes.cart_update_url, {
            ...fetchConfig('json'),
            body: JSON.stringify({ attributes: { fulfillment: value } }),
          });
          const cart = await response.json().catch(() => null);
          if (!response.ok || !cart || typeof cart.status === 'number') {
            throw new Error(cart && cart.description ? cart.description : 'Fulfillment update failed');
          }

          this.busy = false;
          this.syncState();
          this.setStatus('saved');
          this.dispatchEvent(
            new CustomEvent('vnx-fulfillment-change', { bubbles: true, detail: { value } })
          );
        } catch (error) {
          console.error('[Vennix] Delivery method:', error);
          this.busy = false;
          this.value = previous;
          this.syncState();
          this.syncDrawerMode();
          this.updateShippingVisibility();
          this.setStatus('error');
        }
      }

      syncState() {
        this.classList.toggle('is-busy', this.busy);
        this.setAttribute('aria-busy', String(this.busy));

        this.options.forEach((option) => {
          const isActive = option.dataset.vnxValue === this.value;
          option.classList.toggle('is-selected', isActive);
          option.setAttribute('aria-checked', String(isActive));
          option.tabIndex = isActive ? 0 : -1;
        });

        if (this.control) this.control.dataset.selected = this.value;
      }

      syncDrawerMode() {
        if (!this.drawer) return;
        this.drawer.classList.toggle('vnx-pickup-mode', this.value === 'pickup');
      }

      updateShippingVisibility() {
        const card = this.pickupCard;
        if (!card) return;

        const shouldHide = this.value === 'pickup';
        if (shouldHide === this.cardHidden) return;

        if (shouldHide) this.collapse(card);
        else this.expand(card);

        this.cardHidden = shouldHide;
      }

      collapse(card) {
        if (this.reducedMotion) {
          card.hidden = true;
          return;
        }

        card.style.height = `${card.offsetHeight}px`;
        card.style.marginTop = '0px';
        card.style.marginBottom = '0px';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.classList.add('is-collapsing');
            card.style.height = '0px';
            card.addEventListener(
              'transitionend',
              (event) => {
                if (event.propertyName !== 'height') return;
                card.hidden = true;
                card.removeAttribute('style');
                card.classList.remove('is-collapsing');
              },
              { once: true }
            );
          });
        });
      }

      expand(card) {
        if (this.reducedMotion) {
          card.hidden = false;
          return;
        }

        card.hidden = false;
        card.style.marginTop = '0px';
        card.style.marginBottom = '0px';
        card.style.height = '0px';
        card.classList.add('is-collapsing');

        const target = card.scrollHeight;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.style.height = `${target}px`;
            card.addEventListener(
              'transitionend',
              (event) => {
                if (event.propertyName !== 'height') return;
                card.removeAttribute('style');
                card.classList.remove('is-collapsing');
              },
              { once: true }
            );
          });
        });
      }

      onKeydown(event) {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();

        const index = Math.max(0, this.options.indexOf(document.activeElement));
        let next;
        switch (event.key) {
          case 'Home':
            next = 0;
            break;
          case 'End':
            next = this.options.length - 1;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            next = (index - 1 + this.options.length) % this.options.length;
            break;
          default:
            next = (index + 1) % this.options.length;
        }

        const target = this.options[next];
        target.focus();
        if (target.dataset.vnxValue !== this.value) this.select(target.dataset.vnxValue);
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
    }
  );
}
