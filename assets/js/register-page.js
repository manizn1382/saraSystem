function registerPage() {
      return {
        form: {
          username: "",
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
          username: "",
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

        async submitRegister() {
          if (!this.validateForm()) return;

          this.loading = true;
          this.clearAlert();

          try {
            const data = await window.SaraAPI.post("/api/accounts/register/", this.registrationPayload(), {
              auth: false,
              retryOnUnauthorized: false,
              redirectOnExpired: false
            });
            this.handleRegisterSuccess(data);
          } catch (error) {
            this.handleRegisterError(error.status || 0, error.data || { message: error.message });
          } finally {
            this.loading = false;
          }
        },

        validateBeforeSubmit(event) {
          if (!this.validateForm()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },

        validateForm() {
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
          } else if (!this.form.student_id) {
            this.errors.student_id = "وارد کردن شماره دانشجویی الزامی است.";
          }

          if (!this.form.phone) {
            this.errors.phone = "وارد کردن شماره تماس الزامی است.";
          } else if (!this.isDigits(this.form.phone) || this.toEnglishDigits(this.form.phone).length < 10) {
            this.errors.phone = "شماره تماس باید عددی و معتبر باشد.";
          }

          if (!this.form.gender) {
            this.errors.gender = "انتخاب جنسیت الزامی است.";
          }

          if (!this.form.username) {
            this.errors.username = "وارد کردن نام کاربری الزامی است.";
          } else if (!this.isValidUsername(this.form.username)) {
            this.errors.username = "نام کاربری باید ۳ تا ۳۰ کاراکتر و شامل حروف انگلیسی، عدد، خط تیره، نقطه یا زیرخط باشد.";
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
            return false;
          }

          return true;
        },

        registrationPayload() {
          return {
            username: this.form.username.trim(),
            email: this.form.email.trim(),
            password: this.form.password,
            confirm_password: this.form.password_confirm,
            first_name: this.form.first_name.trim(),
            last_name: this.form.last_name.trim(),
            profile: {
              nationalId: this.toEnglishDigits(this.form.national_id),
              studentId: this.toEnglishDigits(this.form.student_id),
              phone: this.toEnglishDigits(this.form.phone),
              gender: this.toApiGender(this.form.gender),
              profileImage: ""
            }
          };
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
            409: "حسابی با این نام کاربری، ایمیل، کد ملی یا شماره دانشجویی قبلاً ثبت شده است.",
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
            "username",
            "first_name",
            "last_name",
            "national_id",
            "student_id",
            "phone",
            "email",
            "gender",
            "password",
            "password_confirm",
            "confirm_password"
          ];

          fields.forEach((field) => {
            if (data?.[field]) {
              const target = field === "confirm_password" ? "password_confirm" : field;
              this.errors[target] = this.normalizeError(data[field]);
            }
          });

          const profileErrors = data?.profile || {};
          const profileMap = {
            nationalId: "national_id",
            national_id: "national_id",
            studentId: "student_id",
            student_id: "student_id",
            phone: "phone",
            gender: "gender"
          };

          Object.entries(profileMap).forEach(([apiField, formField]) => {
            if (profileErrors?.[apiField]) {
              this.errors[formField] = this.normalizeError(profileErrors[apiField]);
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

        isValidUsername(value) {
          return /^[A-Za-z0-9_.-]{3,30}$/.test(String(value || "").trim());
        },

        toApiGender(value) {
          const normalized = String(value || "").toLowerCase();
          if (["male", "man", "m"].includes(normalized)) return "m";
          if (["female", "woman", "f"].includes(normalized)) return "f";
          return normalized;
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
