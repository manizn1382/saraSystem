/* SaraSystem shared day/night theme controller. */
(function () {
  const STORAGE_KEY = 'sarasystem.theme';
  const THEMES = ['day', 'night'];

  function readStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return '';
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme still applies for the current page even when storage is unavailable.
    }
  }

  function preferredTheme() {
    const stored = readStoredTheme();
    if (THEMES.includes(stored)) return stored;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'day' : 'night';
  }

  function applyTheme(theme) {
    const nextTheme = THEMES.includes(theme) ? theme : 'night';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme === 'day' ? 'light' : 'dark';
    updateToggle(nextTheme);
    return nextTheme;
  }

  function setTheme(theme) {
    const nextTheme = applyTheme(theme);
    writeStoredTheme(nextTheme);
    window.dispatchEvent(new CustomEvent('sara:theme-change', { detail: { theme: nextTheme } }));
    return nextTheme;
  }

  function toggleTheme() {
    return setTheme(document.documentElement.dataset.theme === 'day' ? 'night' : 'day');
  }

  function updateToggle(theme = document.documentElement.dataset.theme || preferredTheme()) {
    const isDay = theme === 'day';
    const nextLabel = isDay
      ? '\u062a\u063a\u064a\u064a\u0631 \u0628\u0647 \u062d\u0627\u0644\u062a \u0634\u0628'
      : '\u062a\u063a\u064a\u064a\u0631 \u0628\u0647 \u062d\u0627\u0644\u062a \u0631\u0648\u0632';
    const currentLabel = isDay ? '\u0631\u0648\u0632' : '\u0634\u0628';
    const icon = isDay ? '\u2600' : '\u25d0';

    document.querySelectorAll('[data-sara-theme-toggle]').forEach((button) => {
      const iconNode = button.querySelector('[data-sara-theme-icon]');
      const textNode = button.querySelector('[data-sara-theme-label]');

      if (iconNode) iconNode.textContent = icon;
      if (textNode) textNode.textContent = currentLabel;

      button.title = nextLabel;
      button.setAttribute('aria-label', nextLabel);
      button.setAttribute('aria-pressed', String(isDay));
    });
  }

  function createToggle(className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.saraThemeToggle = 'true';
    button.addEventListener('click', toggleTheme);

    const icon = document.createElement('span');
    icon.className = 'ss-theme-toggle-icon';
    icon.dataset.saraThemeIcon = 'true';
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'ss-theme-toggle-text';
    label.dataset.saraThemeLabel = 'true';

    button.append(icon, label);
    return button;
  }

  function mountToggle() {
    const slots = document.querySelectorAll('[data-sara-theme-slot]');

    if (slots.length) {
      slots.forEach((slot) => {
        if (!slot.querySelector('[data-sara-theme-toggle]')) {
          slot.appendChild(createToggle('ss-theme-toggle ss-theme-toggle-inline'));
        }
      });
      updateToggle();
      return;
    }

    if (!document.querySelector('[data-sara-theme-toggle]')) {
      document.body.appendChild(createToggle('ss-theme-toggle ss-theme-toggle-floating'));
    }

    updateToggle();
  }

  window.SaraTheme = {
    apply: applyTheme,
    set: setTheme,
    toggle: toggleTheme,
    current: () => document.documentElement.dataset.theme || preferredTheme()
  };

  applyTheme(preferredTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggle, { once: true });
  } else {
    mountToggle();
  }
})();
