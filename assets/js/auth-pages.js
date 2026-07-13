/* Shared Alpine controllers for SaraSystem authentication pages. */
(function () {
  function forgotPasswordPage() {
    return {
      endpoint: '/api/v1/users/password/reset',
      form: {
        username: '',
        new_password: '',
        confirm_password: ''
      },
      errors: {
        username: '',
        new_password: '',
        confirm_password: ''
      },
      loading: false,
      alert: { type: 'danger', message: '' },

      init() {},

      validate() {
        this.errors = {
          username: '',
          new_password: '',
          confirm_password: ''
        };
        this.alert.message = '';

        if (!this.form.username) {
          this.errors.username = 'وارد کردن نام کاربری الزامی است.';
        }

        if (!this.form.new_password) {
          this.errors.new_password = 'وارد کردن رمز عبور جدید الزامی است.';
        }

        if (!this.form.confirm_password) {
          this.errors.confirm_password = 'تکرار رمز عبور جدید الزامی است.';
        }

        if (this.form.new_password && this.form.confirm_password && this.form.new_password !== this.form.confirm_password) {
          this.errors.confirm_password = 'رمز عبور جدید و تکرار آن یکسان نیستند.';
        }

        return !Object.values(this.errors).some(Boolean);
      },

      async submitUsernameReset() {
        if (!this.validate()) return;

        this.loading = true;
        try {
          const response = await window.SaraAPI.put(this.endpoint, {
            username: this.form.username,
            new_password: this.form.new_password,
            confirm_password: this.form.confirm_password
          }, { auth: false });

          this.alert = {
            type: 'success',
            message: response?.message || 'رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.'
          };
          this.form.new_password = '';
          this.form.confirm_password = '';
        } catch (error) {
          this.applyErrors(error);
          this.alert = {
            type: 'danger',
            message: error?.message || 'تغییر رمز عبور ناموفق بود.'
          };
        } finally {
          this.loading = false;
        }
      },

      applyErrors(error) {
        const fields = error?.fields || error?.data?.errors || error?.data?.field_errors || {};
        ['username', 'new_password', 'confirm_password'].forEach((field) => {
          const value = fields?.[field] || error?.data?.[field];
          if (value) {
            this.errors[field] = window.SaraUI?.normalizeError?.(value) || String(value);
          }
        });
      }
    };
  }

  window.forgotPasswordPage = forgotPasswordPage;
})();
