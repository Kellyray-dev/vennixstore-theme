if (!customElements.get('vennix-press')) {
  /* Press carousel enhancement: seamless loop requires the track content to be
     duplicated; native scroll snapping + drag support under reduced motion. */
  class VennixPress extends HTMLElement {
    connectedCallback() {
      this.viewport = this.querySelector('[data-press-viewport]');
      this.track = this.querySelector('[data-press-track]');
      if (!this.viewport || !this.track) return;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const items = Array.from(this.track.children);
      if (!items.length) return;

      if (reducedMotion || items.length < 4) {
        /* Static/manual mode: no duplication, native horizontal scroll */
        this.track.style.animation = 'none';
        this.viewport.style.overflowX = 'auto';
        return;
      }

      /* Duplicate items once for the seamless -50% translate loop */
      const clone = document.createDocumentFragment();
      items.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
        clone.appendChild(copy);
      });
      this.track.appendChild(clone);
    }
  }

  customElements.define('vennix-press', VennixPress);
}
