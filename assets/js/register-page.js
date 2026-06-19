function registerPage() {
      return {
        form: {
          first_name: "",
          last_name: "",
          national_id: "",
          student_id: "",
          phone: "",
          email: "",
          gender: "",
          password: "",
          password_confirm: ""
        },

        errors: {
          first_name: "",
          last_name: "",
          national_id: "",
          student_id: "",
          phone: "",
          email: "",
          gender: "",
          password: "",
          password_confirm: "",
          terms: ""
        },

        alert: {
          type: "danger",
          message: ""
        },

        loading: false,
        acceptedTerms: false,
        showPassword: false,
        showPasswordConfirm: false,

        init() {
          document.body.addEventListener("htmx:beforeRequest", (event) => {
            if (!this.isRegisterRequest(event)) return;

            this.loading = true;
            this.clearErrors();
            this.clearAlert();
          });

          document.body.addEventListener("htmx:afterRequest", (event) => {
            if (!this.isRegisterRequest(event)) return;

            this.loading = false;

            const xhr = event.detail.xhr;
            const data = this.parseJson(xhr.responseText);

            if (xhr.status >= 200 && xhr.status < 300) {
              this.handleRegisterSuccess(data);
              return;
            }

            this.handleRegisterError(xhr.status, data);
          });

          document.body.addEventListener("htmx:sendError", (event) => {
            if (!this.isRegisterRequest(event)) return;

            this.loading = false;
            this.showAlert(
              "danger",
              "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت یا آدرس API را بررسی کنید."
            );
          });

          document.body.addEventListener("htmx:timeout", (event) => {
            if (!this.isRegisterRequest(event)) return;

            this.loading = false;
            this.showAlert(
              "danger",
              "زمان پاسخ‌گویی سرور به پایان رسید. لطفاً دوباره تلاش کنید."
            );
          });
        },

        validateBeforeSubmit(event) {
          this.clearErrors();
          this.clearAlert();

          if (!this.form.first_name) {
            this.errors.first_name = "وارد کردن نام الزامی است.";
          }

          if (!this.form.last_name) {
            this.errors.last_name = "وارد کردن نام خانوادگی الزامی است.";
          }

          if (!this.form.national_id) {
            this.errors.national_id = "وارد کردن کد ملی الزامی است.";
          } else if (!this.isDigits(this.form.national_id) || this.toEnglishDigits(this.form.national_id).length !== 10) {
            this.errors.national_id = "کد ملی باید عددی و ۱۰ رقم باشد.";
          }

          if (this.form.student_id && !this.isDigits(this.form.student_id)) {
            this.errors.student_id = "شماره دانشجویی باید فقط شامل عدد باشد.";
          }

          if (!this.form.phone) {
            this.errors.phone = "وارد کردن شماره تماس الزامی است.";
          } else if (!this.isDigits(this.form.phone) || this.toEnglishDigits(this.form.phone).length < 10) {
            this.errors.phone = "شماره تماس باید عددی و معتبر باشد.";
          }

          if (!this.form.gender) {
            this.errors.gender = "انتخاب جنسیت الزامی است.";
          }

          if (!this.form.email) {
            this.errors.email = "وارد کردن ایمیل الزامی است.";
          } else if (!this.isValidEmail(this.form.email)) {
            this.errors.email = "فرمت ایمیل معتبر نیست.";
          }

          if (!this.form.password) {
            this.errors.password = "وارد کردن رمز ورود الزامی است.";
          } else if (this.form.password.length < 8) {
            this.errors.password = "رمز ورود باید حداقل ۸ کاراکتر باشد.";
          }

          if (!this.form.password_confirm) {
            this.errors.password_confirm = "تکرار رمز ورود الزامی است.";
          } else if (this.form.password_confirm !== this.form.password) {
            this.errors.password_confirm = "تکرار رمز ورود با رمز ورود برابر نیست.";
          }

          if (!this.acceptedTerms) {
            this.errors.terms = "برای ادامه باید صحت اطلاعات را تأیید کنید.";
          }

          if (this.hasErrors()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },

        handleRegisterSuccess(data) {
          this.showAlert(
            "success",
            data?.message || "ثبت‌نام با موفقیت انجام شد. در حال انتقال به صفحه ورود..."
          );

          window.setTimeout(() => {
            window.location.assign("./login.html");
          }, 1100);
        },

        handleRegisterError(status, data) {
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
            401: "برای انجام این عملیات باید دوباره وارد سامانه شوید.",
            403: "شما مجوز ثبت‌نام از این مسیر را ندارید.",
            404: "آدرس API ثبت‌نام پیدا نشد.",
            409: "حسابی با این ایمیل، کد ملی یا شماره دانشجویی قبلاً ثبت شده است.",
            422: "برخی اطلاعات فرم قابل پذیرش نیست. لطفاً دوباره بررسی کنید.",
            429: "تعداد تلاش‌های ثبت‌نام زیاد است. کمی بعد دوباره تلاش کنید.",
            500: "خطای داخلی سرور رخ داده است. لطفاً بعداً دوباره تلاش کنید."
          };

          this.showAlert(
            "danger",
            messages[status] || "ثبت‌نام ناموفق بود. لطفاً دوباره تلاش کنید."
          );
        },

        applyServerFieldErrors(data) {
          const fields = [
            "first_name",
            "last_name",
            "national_id",
            "student_id",
            "phone",
            "email",
            "gender",
            "password",
            "password_confirm"
          ];

          fields.forEach((field) => {
            if (data?.[field]) {
              this.errors[field] = this.normalizeError(data[field]);
            }
          });
        },

        isRegisterRequest(event) {
          return event?.detail?.elt?.id === "registerForm";
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

        toEnglishDigits(value) {
          return window.SaraUI?.toEnglishDigits?.(value) || String(value);
        },

        isDigits(value) {
          return /^\d+$/.test(this.toEnglishDigits(value));
        },

        isValidEmail(value) {
          return window.SaraValidate?.email?.(value) ?? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },

        hasErrors() {
          return Object.values(this.errors).some(Boolean);
        },

        clearErrors() {
          Object.keys(this.errors).forEach((key) => {
            this.errors[key] = "";
          });
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
