if (!customElements.get('vennix-sticky-atc')) {
  class VennixStickyAtc extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.sectionId;
      this.productInfo = document.getElementById(`MainProduct-${this.sectionId}`);
      this.mainButton = this.productInfo?.querySelector('product-form .product-form__submit');
      this.stickyButton = this.querySelector('[data-sticky-atc-button]');
      this.price = this.querySelector('[data-sticky-atc-price]');
      this.label = this.querySelector('[data-sticky-atc-label]');

      if (!this.mainButton || !this.stickyButton) return;

      this.handleStickyClick = () => {
        if (this.mainButton.disabled || this.mainButton.getAttribute('aria-disabled') === 'true') return;
        this.mainButton.click();
      };
      this.stickyButton.addEventListener('click', this.handleStickyClick);

      this.mainButtonObserver = new MutationObserver(() => this.syncState());
      this.mainButtonObserver.observe(this.mainButton, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled'],
        childList: true,
        subtree: true,
      });

      this.visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          this.hasScrolledPastButton = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          this.updateVisibility();
        },
        { threshold: 0.05 }
      );
      this.visibilityObserver.observe(this.mainButton);

      const footer = document.querySelector('.footer');
      if (footer) {
        this.footerObserver = new IntersectionObserver(
          ([entry]) => {
            this.footerIsVisible = entry.isIntersecting;
            this.updateVisibility();
          },
          { threshold: 0.01 }
        );
        this.footerObserver.observe(footer);
      }

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        this.variantUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (String(event?.data?.sectionId) !== String(this.sectionId)) return;
          window.requestAnimationFrame(() => this.syncState(event?.data?.variant));
        });
      }

      this.syncState();
      this.setVisible(false);
    }

    disconnectedCallback() {
      this.stickyButton?.removeEventListener('click', this.handleStickyClick);
      this.mainButtonObserver?.disconnect();
      this.visibilityObserver?.disconnect();
      this.footerObserver?.disconnect();
      this.variantUnsubscriber?.();
    }

    updateVisibility() {
      this.setVisible(Boolean(this.hasScrolledPastButton && !this.footerIsVisible));
    }

    setVisible(visible) {
      this.classList.toggle('is-visible', visible);
      this.setAttribute('aria-hidden', visible ? 'false' : 'true');
      this.stickyButton.tabIndex = visible ? 0 : -1;
    }

    syncState(variant) {
      const disabled =
        this.mainButton.disabled ||
        this.mainButton.getAttribute('aria-disabled') === 'true' ||
        variant?.available === false;

      this.stickyButton.disabled = disabled;
      const mainLabel = this.mainButton.querySelector('span:not(.sold-out-message)')?.textContent?.trim();
      if (this.label) {
        this.label.textContent = mainLabel || (disabled ? window.variantStrings.soldOut : window.variantStrings.addToCart);
      }

      const priceRoot = document.getElementById(`price-${this.sectionId}`);
      const activePrice =
        priceRoot?.querySelector('.price--on-sale .price-item--sale') ||
        priceRoot?.querySelector('.price__regular .price-item--regular') ||
        priceRoot?.querySelector('.price-item');
      if (this.price && activePrice) this.price.textContent = activePrice.textContent.trim();
    }
  }

  customElements.define('vennix-sticky-atc', VennixStickyAtc);
}
