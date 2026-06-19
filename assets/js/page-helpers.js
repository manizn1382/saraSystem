/* Shared page-level helpers for SaraSystem static front-end pages. */
(function () {
  function parseJson(value, fallback = {}) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function installHtmxErrorAlerts(options = {}) {
    const target = options.target || document.body;
    if (!target || target.dataset.saraHtmxAlerts === 'true') return;
    target.dataset.saraHtmxAlerts = 'true';

    target.addEventListener('htmx:responseError', function (event) {
      const status = event.detail?.xhr?.status;
      const message = window.SaraUI?.apiErrorMessage?.(status, parseJson(event.detail?.xhr?.responseText, null))
        || 'درخواست با خطا روبه‌رو شد.';
      window.dispatchEvent(new CustomEvent('sara:alert', { detail: { type: 'danger', message } }));
    });

    target.addEventListener('htmx:sendError', function () {
      window.dispatchEvent(new CustomEvent('sara:alert', {
        detail: { type: 'danger', message: 'ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کنید.' }
      }));
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
    basePanelState,
    bindGlobalAlert
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => installHtmxErrorAlerts(), { once: true });
  } else {
    installHtmxErrorAlerts();
  }
})();
