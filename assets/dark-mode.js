/**
 * VennixStore — site-wide dark mode
 *
 * The initial theme is applied by a tiny inline script in layout/theme.liquid
 * (before first paint, so there is no flash of the wrong theme). This file adds
 * the interactive layer:
 *
 *   • a <dark-mode-toggle> custom element for the header sun/moon button
 *   • live following of the OS preference until the visitor overrides it
 *   • persistence of the visitor's choice in localStorage
 */

(function () {
  var STORAGE_KEY = 'vx-color-scheme';
  var DARK = 'dark';
  var LIGHT = 'light';
  var THEME_COLORS = { dark: '#131211', light: '#1A1A1A' };

  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function storedPreference() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return value === DARK || value === LIGHT ? value : null;
    } catch (error) {
      return null;
    }
  }

  function persistPreference(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      /* Private browsing / storage disabled — the choice just won't stick. */
    }
  }

  function currentMode() {
    return document.documentElement.getAttribute('data-theme') === DARK ? DARK : LIGHT;
  }

  function applyMode(mode, remember) {
    var root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && THEME_COLORS[mode]) {
      themeColor.setAttribute('content', THEME_COLORS[mode]);
    }

    if (remember) persistPreference(mode);

    document.dispatchEvent(
      new CustomEvent('vx:themechange', {
        detail: { mode: mode, remembered: Boolean(remember) },
      })
    );
  }

  /* Keep following the OS setting until the visitor makes their own choice. */
  function watchSystemPreference() {
    var query = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (event) {
      if (storedPreference()) return;
      applyMode(event.matches ? DARK : LIGHT, false);
    };

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
    } else if (typeof query.addListener === 'function') {
      query.addListener(onChange); // Safari < 14
    }
  }

  /* Keep multiple tabs in sync. */
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue === DARK || event.newValue === LIGHT) {
      applyMode(event.newValue, false);
    }
  });

  if (!customElements.get('dark-mode-toggle')) {
    customElements.define(
      'dark-mode-toggle',
      class DarkModeToggle extends HTMLElement {
        connectedCallback() {
          this.button = this.querySelector('[data-theme-toggle-button]');
          if (!this.button) return;

          this.syncLabel = this.syncLabel.bind(this);
          this.onClick = this.onClick.bind(this);

          this.button.addEventListener('click', this.onClick);
          document.addEventListener('vx:themechange', this.syncLabel);
          this.syncLabel();
        }

        disconnectedCallback() {
          if (!this.button) return;
          this.button.removeEventListener('click', this.onClick);
          document.removeEventListener('vx:themechange', this.syncLabel);
        }

        onClick() {
          applyMode(currentMode() === DARK ? LIGHT : DARK, true);
        }

        syncLabel() {
          var next = currentMode() === DARK ? LIGHT : DARK;
          var label = this.button.getAttribute('data-label-' + next) || '';

          if (label) {
            this.button.setAttribute('aria-label', label);
            this.button.setAttribute('title', label);
          }
          this.button.setAttribute('aria-pressed', currentMode() === DARK ? 'true' : 'false');
        }
      }
    );
  }

  watchSystemPreference();

  /* Expose a small API so theme sections can react if they need to. */
  window.VennixDarkMode = {
    get mode() {
      return currentMode();
    },
    get systemPrefersDark() {
      return systemPrefersDark();
    },
    get isOverridden() {
      return Boolean(storedPreference());
    },
    set: function (mode) {
      applyMode(mode === DARK ? DARK : LIGHT, true);
    },
    reset: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* no-op */
      }
      applyMode(systemPrefersDark() ? DARK : LIGHT, false);
    },
  };
})();
