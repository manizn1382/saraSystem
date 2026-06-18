/* Shared Alpine controllers for SaraSystem authentication pages. */
(function () {
  function forgotPasswordPage() {
    return {
      identifier: '',
      error: '',
      loading: false,
      alert: { type: 'danger', message: '' },

      init() {
        document.body.addEventListener('htmx:beforeRequest', (event) => {
          if (!this.isForgotRequest(event)) return;
          this.loading = true;
          this.error = '';
          this.alert.message = '';
        });

        document.body.addEventListener('htmx:afterRequest', (event) => {
          if (!this.isForgotRequest(event)) return;
          this.loading = false;
          const xhr = event.detail.xhr;
          const data = this.parseJson(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            this.alert = {
              type: 'success',
              message: data?.message || 'درخواست بازیابی ثبت شد. در صورت معتبر بودن اطلاعات، راهنمای ادامه ارسال می‌شود.'
            };
            return;
          }

          this.error = window.SaraUI?.normalizeError?.(data?.identifier || data?.email || data?.username || '') || '';
          this.alert = {
            type: 'danger',
            message: data?.detail || data?.message || window.SaraUI?.apiErrorMessage?.(xhr.status, data) || 'ثبت درخواست بازیابی ناموفق بود.'
          };
        });

        document.body.addEventListener('htmx:sendError', (event) => {
          if (!this.isForgotRequest(event)) return;
          this.loading = false;
          this.alert = { type: 'danger', message: 'ارتباط با سرور برقرار نشد. آدرس API یا اتصال شبکه را بررسی کنید.' };
        });

        document.body.addEventListener('htmx:timeout', (event) => {
          if (!this.isForgotRequest(event)) return;
          this.loading = false;
          this.alert = { type: 'danger', message: 'زمان پاسخ‌گویی سرور به پایان رسید. دوباره تلاش کنید.' };
        });
      },

      validateBeforeSubmit(event) {
        this.error = '';
        this.alert.message = '';

        if (!this.identifier) {
          this.error = 'وارد کردن ایمیل یا شناسه کاربری الزامی است.';
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },

      isForgotRequest(event) {
        return event?.detail?.elt?.id === 'forgotPasswordForm';
      },

      parseJson(value) {
        return window.SaraPage?.parseJson?.(value, {}) || {};
      }
    };
  }

  window.forgotPasswordPage = forgotPasswordPage;
})();
