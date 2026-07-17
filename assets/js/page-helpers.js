/* Shared page-level helpers for SaraSystem static front-end pages. */
(function () {
  function parseJson(value, fallback = {}) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function htmxRequestPath(event) {
    return event.detail?.path
      || event.detail?.pathInfo?.requestPath
      || event.detail?.requestConfig?.path
      || event.detail?.elt?.getAttribute?.('hx-get')
      || event.detail?.elt?.getAttribute?.('hx-post')
      || '';
  }

  function htmxFallbackMessage(status, data) {
    return data?.detail
      || data?.message
      || data?.error
      || window.SaraUI?.apiErrorMessage?.(status, data)
      || 'درخواست با خطا روبه‌رو شد.';
  }

  function htmxFallbackType(status) {
    return Number(status) >= 500 || Number(status) === 0 ? 'danger' : 'warning';
  }

  function installHtmxErrorAlerts(options = {}) {
    const target = options.target || document.body;
    if (!target || target.dataset.saraHtmxAlerts === 'true') return;
    target.dataset.saraHtmxAlerts = 'true';

    target.addEventListener('htmx:responseError', function (event) {
      const status = event.detail?.xhr?.status;
      const data = parseJson(event.detail?.xhr?.responseText, null);
      const message = htmxFallbackMessage(status, data);
      window.dispatchEvent(new CustomEvent('sara:alert', { detail: { type: htmxFallbackType(status), message } }));
    });

    target.addEventListener('htmx:sendError', function () {
      window.dispatchEvent(new CustomEvent('sara:alert', {
        detail: { type: htmxFallbackType(0), message: htmxFallbackMessage(0, null) }
      }));
    });

    target.addEventListener('htmx:timeout', function () {
      window.dispatchEvent(new CustomEvent('sara:alert', {
        detail: { type: htmxFallbackType(504), message: htmxFallbackMessage(504, null) }
      }));
    });
  }

  function installBootstrapModalFocusReturn(options = {}) {
    const target = options.target || document;
    if (!target || target.documentElement?.dataset.saraModalFocusReturn === 'true') return;
    if (target.documentElement) target.documentElement.dataset.saraModalFocusReturn = 'true';

    target.addEventListener('show.bs.modal', function (event) {
      event.target.__saraReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    });

    target.addEventListener('hidden.bs.modal', function (event) {
      const returnTo = event.target.__saraReturnFocus;
      if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) {
        returnTo.focus({ preventScroll: true });
      }
      event.target.__saraReturnFocus = null;
    });
  }

  function basePanelState() {
    return {
      alert: { type: 'info', message: '' },
      parseJson,
      asList(data) {
        return window.SaraUI?.asList?.(data) || [];
      },
      toPersianNumber(value) {
        return window.SaraUI?.toPersianNumber?.(value) || String(value ?? '');
      },
      clearAlert() {
        this.alert.message = '';
      },
      showAlert(type, message) {
        this.alert = { type, message };
      },
      logout(path = '../login.html') {
        window.SaraAuth?.logout?.(path);
      }
    };
  }

  function bindGlobalAlert(component) {
    window.addEventListener('sara:alert', (event) => {
      component?.showAlert?.(event.detail?.type || 'danger', event.detail?.message || 'عملیات ناموفق بود.');
    });
  }

  window.SaraPage = {
    parseJson,
    installHtmxErrorAlerts,
    installBootstrapModalFocusReturn,
    basePanelState,
    bindGlobalAlert
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      installHtmxErrorAlerts();
      installBootstrapModalFocusReturn();
    }, { once: true });
  } else {
    installHtmxErrorAlerts();
    installBootstrapModalFocusReturn();
  }
})();
