function loginPage() {
      return {
        form: {
          username: "",
          password: ""
        },

        errors: {
          username: "",
          password: ""
        },

        alert: {
          type: "danger",
          message: ""
        },

        loading: false,
        remember: false,
        showPassword: false,
        demoModeEnabled: false,

        demoAccounts: [
          {
            key: "student",
            label: "ورود دانشجو",
            username: "student",
            email: "student@sarasystem.test",
            password: "demo1234",
            token: "demo-access-token-student",
            refresh: "demo-refresh-token-student",
            user: {
              id: 9001,
              first_name: "سارا",
              last_name: "دانشجو",
              student_id: "400123456",
              national_id: "0012345678",
              phone: "09120000001",
              email: "student@sarasystem.test",
              role: "student",
              roles: ["student"],
              is_active: true,
              is_verified: true
            }
          },
          {
            key: "supervisor",
            label: "ورود مسئول خوابگاه",
            username: "supervisor",
            email: "supervisor@sarasystem.test",
            password: "demo1234",
            token: "demo-access-token-dormitory-admin",
            refresh: "demo-refresh-token-dormitory-admin",
            user: {
              id: 9002,
              first_name: "مینا",
              last_name: "مسئول خوابگاه",
              staff_id: "DA-102",
              phone: "09120000002",
              email: "supervisor@sarasystem.test",
              assigned_dormitory: "خوابگاه یک",
              role: "dormitory_admin",
              roles: ["dormitory_admin"],
              is_active: true,
              is_verified: true
            }
          },
          {
            key: "admin",
            label: "ورود مدیر سیستم",
            username: "admin",
            email: "admin@sarasystem.test",
            password: "demo1234",
            token: "demo-access-token-system-admin",
            refresh: "demo-refresh-token-system-admin",
            user: {
              id: 9003,
              first_name: "علی",
              last_name: "مدیر سیستم",
              staff_id: "SA-001",
              phone: "09120000003",
              email: "admin@sarasystem.test",
              role: "system_admin",
              roles: ["system_admin"],
              is_active: true,
              is_verified: true
            }
          },
          {
            key: "support",
            label: "ورود پشتیبانی",
            username: "support",
            email: "support@sarasystem.test",
            password: "demo1234",
            token: "demo-access-token-support-staff",
            refresh: "demo-refresh-token-support-staff",
            user: {
              id: 9004,
              first_name: "رضا",
              last_name: "پشتیبان",
              staff_id: "SP-204",
              phone: "09120000004",
              email: "support@sarasystem.test",
              role: "support_staff",
              roles: ["support_staff"],
              is_active: true,
              is_verified: true
            }
          }
        ],

        init() {
          this.demoModeEnabled = window.SaraAuth?.isDemoMode?.() === true;
          const sessionMessage = window.SaraAuth?.consumeSessionMessage?.();
          if (sessionMessage?.message) {
            this.showAlert(sessionMessage.type || "warning", sessionMessage.message);
          }

          document.body.addEventListener("htmx:beforeRequest", (event) => {
            if (!this.isLoginRequest(event)) return;

            this.loading = true;
            this.clearErrors();
            this.clearAlert();
          });

          document.body.addEventListener("htmx:afterRequest", (event) => {
            if (!this.isLoginRequest(event)) return;

            this.loading = false;

            const xhr = event.detail.xhr;
            const data = this.parseJson(xhr.responseText);

            if (xhr.status >= 200 && xhr.status < 300) {
              this.handleLoginSuccess(data);
              return;
            }

            this.handleLoginError(xhr.status, data);
          });

          document.body.addEventListener("htmx:sendError", (event) => {
            if (!this.isLoginRequest(event)) return;

            this.loading = false;
            this.showAlert(
              "danger",
              "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت یا آدرس API را بررسی کنید."
            );
          });

          document.body.addEventListener("htmx:timeout", (event) => {
            if (!this.isLoginRequest(event)) return;

            this.loading = false;
            this.showAlert(
              "danger",
              "زمان پاسخ‌گویی سرور به پایان رسید. لطفاً دوباره تلاش کنید."
            );
          });
        },

        async submitLogin() {
          if (!this.validateForm()) return;

          const demoAccount = this.findDemoAccount(this.form.username, this.form.password);
          if (demoAccount) {
            this.loginAsDemo(demoAccount.key);
            return;
          }

          this.loading = true;
          this.clearErrors();
          this.clearAlert();

          try {
            const data = await window.SaraAPI.post('/api/v1/users/login', {
              username: this.form.username,
              password: this.form.password
            }, {
              auth: false,
              retryOnUnauthorized: false,
              redirectOnExpired: false
            });
            this.handleLoginSuccess(data);
          } catch (error) {
            this.handleLoginError(error.status || 0, error.data || { message: error.message });
          } finally {
            this.loading = false;
          }
        },

        validateBeforeSubmit(event) {
          const valid = this.validateForm();

          if (!valid) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }

          const demoAccount = this.findDemoAccount(this.form.username, this.form.password);

          if (demoAccount) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.loginAsDemo(demoAccount.key);
          }
        },

        validateForm() {
          this.clearErrors();
          this.clearAlert();

          if (!this.form.username) {
            this.errors.username = "وارد کردن شناسه کاربری الزامی است.";
          }

          if (!this.form.password) {
            this.errors.password = "وارد کردن رمز ورود الزامی است.";
          }

          if (this.errors.username || this.errors.password) {
            return false;
          }

          return true;
        },

        findDemoAccount(username, password) {
          if (!this.demoModeEnabled) return null;

          const normalizedUsername = String(username || "").toLowerCase().trim();
          const normalizedPassword = String(password || "");

          return this.demoAccounts.find((account) => {
            return normalizedPassword === account.password &&
              [account.key, account.username, account.email].includes(normalizedUsername);
          });
        },

        loginAsDemo(key) {
          const account = this.demoAccounts.find((item) => item.key === key);

          if (!account) {
            this.showAlert("danger", "حساب نمایشی انتخاب‌شده پیدا نشد.");
            return;
          }

          this.loading = true;
          this.clearErrors();
          this.clearAlert();

          const demoSession = window.SaraDemoAuth?.login?.(account.username || account.key, account.password, this.remember);
          if (!demoSession) {
            this.loading = false;
            this.showAlert("danger", "حالت نمایشی فعال نیست یا حساب نمایشی معتبر نیست.");
            return;
          }

          this.showAlert("success", `ورود نمایشی ${account.label} انجام شد. در حال انتقال به پنل...`);

          window.setTimeout(() => {
            window.location.assign(this.withDemoParam(this.getDashboardPath(demoSession.user), account.key));
          }, 350);
        },

        handleLoginSuccess(data) {
          const accessToken =
            data?.access ||
            data?.access_token ||
            data?.token ||
            data?.tokens?.access;

          const refreshToken =
            data?.refresh ||
            data?.refresh_token ||
            data?.tokens?.refresh;

          if (!accessToken) {
            this.showAlert(
              "danger",
              "ورود انجام شد، اما پاسخ سرور شامل توکن معتبر نیست."
            );
            return;
          }

          window.SaraAuth?.clearSession?.();
          window.SaraAuth?.setSession?.({
            accessToken,
            refreshToken,
            user: data?.user,
            demoMode: false
          }, { remember: this.remember });

          this.showAlert("success", "ورود موفق بود. در حال انتقال به داشبورد...");

          window.setTimeout(() => {
            window.location.assign(this.getDashboardPath(data?.user));
          }, 700);
        },

        handleLoginError(status, data) {
          this.applyServerFieldErrors(data);

          const serverMessage =
            data?.detail ||
            data?.message ||
            data?.error ||
            data?.non_field_errors?.[0];

          if (serverMessage) {
            this.showAlert("danger", serverMessage);
            return;
          }

          const messages = {
            400: "اطلاعات واردشده معتبر نیست. لطفاً فیلدها را بررسی کنید.",
            401: "شناسه کاربری یا رمز ورود اشتباه است.",
            403: "حساب شما مجوز ورود به این بخش را ندارد یا غیرفعال شده است.",
            404: "آدرس API ورود پیدا نشد.",
            429: "تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره تلاش کنید.",
            500: "خطای داخلی سرور رخ داده است. لطفاً بعداً دوباره تلاش کنید."
          };

          this.showAlert(
            "danger",
            messages[status] || "ورود ناموفق بود. لطفاً دوباره تلاش کنید."
          );
        },

        applyServerFieldErrors(data) {
          const usernameError =
            data?.username ||
            data?.email ||
            data?.student_id ||
            data?.national_id;

          const passwordError = data?.password;

          if (usernameError) {
            this.errors.username = this.normalizeError(usernameError);
          }

          if (passwordError) {
            this.errors.password = this.normalizeError(passwordError);
          }
        },

        getDashboardPath(user) {
          const normalizedRoles = window.SaraAuth?.getUserRoles?.(user) || [];

          if (normalizedRoles.includes("student") || normalizedRoles.includes("resident")) {
            return "./dashboard/student.html";
          }

          if (
            normalizedRoles.includes("dormitory_admin") ||
            normalizedRoles.includes("dormitory_supervisor") ||
            normalizedRoles.includes("supervisor")
          ) {
            return "./dashboard/dormitory-admin.html";
          }

          if (
            normalizedRoles.includes("system_admin") ||
            normalizedRoles.includes("admin") ||
            normalizedRoles.includes("university_manager")
          ) {
            return "./dashboard/admin.html";
          }

          if (normalizedRoles.includes("support_staff") || normalizedRoles.includes("support")) {
            return "./dashboard/support.html";
          }

          return "./dashboard/index.html";
        },

        withDemoParam(path, key) {
          const separator = path.includes("?") ? "&" : "?";
          return `${path}${separator}demo=${encodeURIComponent(key)}`;
        },

        isLoginRequest(event) {
          return event?.detail?.elt?.id === "loginForm";
        },

        parseJson(value) {
          try {
            return value ? JSON.parse(value) : {};
          } catch {
            return {};
          }
        },

        normalizeError(error) {
          return window.SaraUI?.normalizeError?.(error) || String(error);
        },

        clearStoredSession() {
          window.SaraAuth?.clearSession?.();
        },

        setDemoMode(enabled) {
          this.demoModeEnabled = Boolean(enabled);
          localStorage.removeItem("sarasystem.demoMode");
          sessionStorage.removeItem("sarasystem.demoMode");

          if (this.demoModeEnabled) {
            localStorage.setItem("sarasystem.demoMode", "true");
            this.showAlert("info", "حالت نمایشی فعال شد. اکنون می‌توانید با حساب‌های نمایشی وارد شوید.");
            return;
          }

          this.clearAlert();
        },

        clearErrors() {
          this.errors.username = "";
          this.errors.password = "";
        },

        clearAlert() {
          this.alert.message = "";
        },

        showAlert(type, message) {
          this.alert.type = type;
          this.alert.message = message;
        }
      };
    }
