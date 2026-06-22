function accountPage() {
      return {
        profile: {},
        profileImage: null,
        profileLoading: false,
        passwordLoading: false,
        isDemo: false,
        accountStatus: { label: 'نامشخص', className: 'badge-neutral', message: '' },
        alert: { type: 'info', message: '' },
        password: { current_password: '', new_password: '', confirm_password: '' },

        async init() {
          this.isDemo = window.SaraAuth?.isDemoMode?.() === true;
          this.profile = { ...(window.SaraAuth?.getStoredUser?.() || {}) };
          this.accountStatus = window.SaraAuth?.getAccountStatus?.(this.profile) || this.accountStatus;

          const sessionMessage = window.SaraAuth?.consumeSessionMessage?.();
          if (sessionMessage?.message) this.showAlert(sessionMessage.type || 'info', sessionMessage.message);

          const user = await window.SaraAuth?.loadCurrentUser?.();
          if (user) {
            this.profile = { ...this.profile, ...user };
            this.accountStatus = window.SaraAuth?.getAccountStatus?.(this.profile) || this.accountStatus;
          }
        },

        async saveProfile() {
          this.profileLoading = true;
          try {
            if (this.isDemo) {
              this.profile = window.SaraAuth?.updateStoredUser?.(this.profile) || this.profile;
              this.showAlert('success', 'پروفایل نمایشی به‌صورت محلی به‌روزرسانی شد.');
              return;
            }

            const payload = this.profileImage ? this.toFormData() : this.profilePayload();
            const updated = await window.SaraAPI.patch('/api/users/me/', payload);
            this.profile = window.SaraAuth?.updateStoredUser?.(updated || this.profile) || this.profile;
            this.accountStatus = window.SaraAuth?.getAccountStatus?.(this.profile) || this.accountStatus;
            this.showAlert('success', 'پروفایل با موفقیت ذخیره شد.');
          } catch (error) {
            this.showAlert('danger', error.message || 'ذخیره پروفایل ناموفق بود.');
          } finally {
            this.profileLoading = false;
          }
        },

        async changePassword() {
          if (!this.password.current_password || !this.password.new_password) {
            this.showAlert('warning', 'رمز فعلی و رمز جدید را وارد کنید.');
            return;
          }

          if (this.password.new_password !== this.password.confirm_password) {
            this.showAlert('warning', 'رمز جدید و تکرار آن برابر نیستند.');
            return;
          }

          if (this.password.new_password.length < 8) {
            this.showAlert('warning', 'رمز جدید باید حداقل ۸ کاراکتر باشد.');
            return;
          }

          this.passwordLoading = true;
          try {
            if (this.isDemo) {
              this.password = { current_password: '', new_password: '', confirm_password: '' };
              this.showAlert('success', 'در حالت نمایشی، تغییر رمز فقط شبیه‌سازی شد.');
              return;
            }

            await window.SaraAPI.post('/api/auth/change-password/', this.password);
            this.password = { current_password: '', new_password: '', confirm_password: '' };
            this.showAlert('success', 'رمز ورود با موفقیت تغییر کرد.');
          } catch (error) {
            this.showAlert('danger', error.message || 'تغییر رمز ورود ناموفق بود.');
          } finally {
            this.passwordLoading = false;
          }
        },

        profilePayload() {
          const fields = ['first_name', 'last_name', 'email', 'phone', 'student_id', 'national_id', 'gender'];
          return Object.fromEntries(fields.map((field) => [field, this.profile[field] || '']));
        },

        toFormData() {
          const formData = new FormData();
          Object.entries(this.profilePayload()).forEach(([key, value]) => formData.append(key, value));
          if (this.profileImage) formData.append('profile_image', this.profileImage);
          return formData;
        },

        dashboardPath() {
          const requestedPanel = new URLSearchParams(window.location.search).get('from');
          const knownPanels = {
            student: './dashboard/student.html',
            dormitory_admin: './dashboard/dormitory-admin.html',
            admin: './dashboard/admin.html',
            support: './dashboard/support.html'
          };
          if (knownPanels[requestedPanel]) return knownPanels[requestedPanel];

          const roles = window.SaraAuth?.getUserRoles?.(this.profile) || [];
          if (roles.includes('student') || roles.includes('resident')) return './dashboard/student.html';
          if (roles.includes('dormitory_admin') || roles.includes('dormitory_supervisor') || roles.includes('supervisor')) return './dashboard/dormitory-admin.html';
          if (roles.includes('system_admin') || roles.includes('admin') || roles.includes('university_manager')) return './dashboard/admin.html';
          if (roles.includes('support_staff') || roles.includes('support')) return './dashboard/support.html';
          return './dashboard/index.html';
        },

        fullName() {
          return `${this.profile.first_name || ''} ${this.profile.last_name || ''}`.trim() || this.profile.username || 'کاربر سراسیستم';
        },

        initials() {
          const first = this.profile.first_name || this.profile.username || 'س';
          const last = this.profile.last_name || 'س';
          return `${first.charAt(0)}${last.charAt(0)}`;
        },

        rolesText() {
          const roles = window.SaraAuth?.getUserRoles?.(this.profile) || [];
          return roles.length ? roles.join('، ') : '—';
        },

        permissionsText() {
          const permissions = window.SaraAuth?.getPermissions?.(this.profile) || [];
          return permissions.length ? permissions.join('، ') : '—';
        },

        showAlert(type, message) {
          this.alert = { type, message };
        },

        logout() {
          window.SaraAuth?.logout?.('./login.html');
        }
      };
    }
