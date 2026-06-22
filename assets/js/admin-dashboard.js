/* System-admin dashboard controller. API authorization remains server-side. */
(function () {
  const USER_ENDPOINT = '/api/accounts/users/';
  const ROLE_ENDPOINT = '/api/accounts/roles/';
  const DORMITORY_ENDPOINT = '/api/dormitories/';

  function asArray(data) {
    return window.SaraUI?.asList?.(data)
      || (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
  }

  function systemAdminPanel() {
    return {
      ...window.SaraPage.basePanelState(),
      user: window.SaraAuth?.getStoredUser?.() || {},
      sidebarOpen: false,
      profileOpen: false,
      activeSection: '#overview',
      users: [],
      roles: [],
      dormitories: [],
      loading: { users: false, roles: false, dormitories: false, saving: false },
      errors: { users: '', roles: '', dormitories: '' },
      filters: { query: '', role: 'all', status: 'all', page: 1, pageSize: 10 },
      dialog: { open: false, type: '', subject: null },
      userForm: {},
      roleForm: { name: '', description: '' },
      stats: [
        { label: 'کل کاربران', value: '—', icon: 'کاربر' },
        { label: 'کاربران فعال', value: '—', icon: 'فعال' },
        { label: 'نقش‌های تعریف‌شده', value: '—', icon: 'نقش' },
        { label: 'خوابگاه‌ها', value: '—', icon: 'خوابگاه' }
      ],
      operations: [
        { title: 'درخواست‌های اسکان', anchor: '#operations', endpoint: '/api/accommodation-requests/' },
        { title: 'تخصیص تخت', anchor: '#operations', endpoint: '/api/bed-assignments/' },
        { title: 'پرداخت‌ها', anchor: '#operations', endpoint: '/api/payments/' },
        { title: 'تعمیرات', anchor: '#operations', endpoint: '/api/maintenance-requests/' },
        { title: 'اطلاعیه‌ها', anchor: '#operations', endpoint: '/api/announcements/' },
        { title: 'ظرفیت خوابگاه', anchor: '#dormitories', endpoint: DORMITORY_ENDPOINT }
      ],

      init() {
        window.SaraPage.bindGlobalAlert(this);
        this.loadAll();
        this.watchSections();
      },

      watchSections() {
        if (!('IntersectionObserver' in window)) return;
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) this.activeSection = `#${entry.target.id}`;
          });
        }, { rootMargin: '-22% 0px -66% 0px', threshold: 0.01 });
        document.querySelectorAll('.admin-section').forEach((section) => observer.observe(section));
      },

      userInitials() {
        const first = (this.user.first_name || this.user.email || 'م').trim().charAt(0);
        const last = (this.user.last_name || '').trim().charAt(0);
        return `${first}${last}`.toUpperCase();
      },

      activeLabel() {
        return {
          '#overview': 'نمای کلی', '#users': 'کاربران', '#roles': 'نقش‌ها',
          '#dormitories': 'خوابگاه‌ها', '#operations': 'عملیات', '#reports': 'گزارش‌ها'
        }[this.activeSection] || 'مدیریت سامانه';
      },

      async loadAll() {
        await Promise.all([this.loadUsers(), this.loadRoles(), this.loadDormitories()]);
      },

      async loadUsers() {
        this.loading.users = true;
        this.errors.users = '';
        try {
          this.users = asArray(await window.SaraAPI.get(USER_ENDPOINT));
          this.updateStats();
        } catch (error) {
          this.errors.users = this.apiMessage(error);
        } finally {
          this.loading.users = false;
        }
      },

      async loadRoles() {
        this.loading.roles = true;
        this.errors.roles = '';
        try {
          this.roles = asArray(await window.SaraAPI.get(ROLE_ENDPOINT));
          this.updateStats();
        } catch (error) {
          this.errors.roles = this.apiMessage(error);
        } finally {
          this.loading.roles = false;
        }
      },

      async loadDormitories() {
        this.loading.dormitories = true;
        this.errors.dormitories = '';
        try {
          this.dormitories = asArray(await window.SaraAPI.get(DORMITORY_ENDPOINT));
          this.updateStats();
        } catch (error) {
          this.errors.dormitories = this.apiMessage(error);
        } finally {
          this.loading.dormitories = false;
        }
      },

      updateStats() {
        this.stats[0].value = this.toPersianNumber(this.users.length);
        this.stats[1].value = this.toPersianNumber(this.users.filter((item) => item.is_active !== false).length);
        this.stats[2].value = this.toPersianNumber(this.roles.length);
        this.stats[3].value = this.dormitories.length ? this.toPersianNumber(this.dormitories.length) : '—';
      },

      filteredUsers() {
        const query = this.filters.query.trim().toLowerCase();
        return this.users.filter((item) => {
          const matchesQuery = !query || [
            item.first_name, item.last_name, item.email, item.student_id, item.national_id, item.phone
          ].join(' ').toLowerCase().includes(query);
          const userRoles = this.rolesFor(item);
          const matchesRole = this.filters.role === 'all' || userRoles.includes(this.filters.role);
          const matchesStatus = this.filters.status === 'all'
            || (this.filters.status === 'active' && item.is_active !== false)
            || (this.filters.status === 'inactive' && item.is_active === false)
            || (this.filters.status === 'unverified' && item.is_verified === false);
          return matchesQuery && matchesRole && matchesStatus;
        });
      },

      pagedUsers() {
        const items = this.filteredUsers();
        const totalPages = this.totalPages();
        if (this.filters.page > totalPages) this.filters.page = totalPages;
        const start = (this.filters.page - 1) * Number(this.filters.pageSize);
        return items.slice(start, start + Number(this.filters.pageSize));
      },

      totalPages() {
        return Math.max(1, Math.ceil(this.filteredUsers().length / Number(this.filters.pageSize)));
      },

      resetPage() {
        this.filters.page = 1;
      },

      rolesFor(user) {
        return window.SaraAuth?.getUserRoles?.(user) || [];
      },

      roleLabel(user) {
        const roles = this.rolesFor(user);
        return roles.length ? roles.join('، ') : '—';
      },

      fullName(user) {
        return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '—';
      },

      statusLabel(user) {
        if (user?.is_active === false) return 'غیرفعال';
        return user?.is_verified === false ? 'در انتظار تایید' : 'فعال';
      },

      statusClass(user) {
        if (user?.is_active === false) return 'ss-status-danger';
        return user?.is_verified === false ? 'ss-status-warning' : 'ss-status-success';
      },

      openUserDetails(user) {
        this.dialog = { open: true, type: 'details', subject: user };
      },

      openUserForm(user = null) {
        this.userForm = user ? {
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          national_id: user.national_id || '',
          student_id: user.student_id || '',
          phone: user.phone || '',
          gender: user.gender || '',
          is_active: user.is_active !== false,
          is_verified: Boolean(user.is_verified),
          password: ''
        } : {
          first_name: '', last_name: '', email: '', national_id: '', student_id: '', phone: '',
          gender: '', is_active: true, is_verified: false, password: ''
        };
        this.dialog = { open: true, type: 'user-form', subject: user };
      },

      openRoleForm(role = null) {
        this.roleForm = role
          ? { id: role.id, name: role.name || '', description: role.description || '' }
          : { name: '', description: '' };
        this.dialog = { open: true, type: 'role-form', subject: role };
      },

      closeDialog() {
        if (this.loading.saving) return;
        this.dialog = { open: false, type: '', subject: null };
      },

      userPayload() {
        const payload = { ...this.userForm };
        delete payload.id;
        if (!payload.student_id) delete payload.student_id;
        if (!payload.password) delete payload.password;
        return payload;
      },

      async saveUser() {
        this.loading.saving = true;
        try {
          const payload = this.userPayload();
          const existing = this.userForm.id;
          const saved = existing
            ? await window.SaraAPI.patch(`${USER_ENDPOINT}${existing}/`, payload)
            : await window.SaraAPI.post(USER_ENDPOINT, payload);
          const index = this.users.findIndex((item) => String(item.id) === String(saved.id));
          if (index >= 0) this.users.splice(index, 1, saved);
          else this.users.unshift(saved);
          this.updateStats();
          this.dialog = { open: false, type: '', subject: null };
          this.showAlert('success', existing ? 'اطلاعات کاربر بروزرسانی شد.' : 'کاربر جدید ایجاد شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async toggleUserActivity(user) {
        const nextActive = user.is_active === false;
        this.loading.saving = true;
        try {
          const saved = await window.SaraAPI.patch(`${USER_ENDPOINT}${user.id}/`, { is_active: nextActive });
          Object.assign(user, saved);
          this.updateStats();
          this.showAlert('success', nextActive ? 'کاربر فعال شد.' : 'کاربر غیرفعال شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async deleteUser(user) {
        if (!window.confirm(`حذف کاربر ${this.fullName(user)} انجام شود؟`)) return;
        this.loading.saving = true;
        try {
          await window.SaraAPI.delete(`${USER_ENDPOINT}${user.id}/`);
          this.users = this.users.filter((item) => String(item.id) !== String(user.id));
          this.updateStats();
          this.showAlert('success', 'کاربر حذف شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async saveRole() {
        this.loading.saving = true;
        try {
          const existing = this.roleForm.id;
          const payload = { name: this.roleForm.name, description: this.roleForm.description };
          const role = existing
            ? await window.SaraAPI.patch(`${ROLE_ENDPOINT}${existing}/`, payload)
            : await window.SaraAPI.post(ROLE_ENDPOINT, payload);
          const index = this.roles.findIndex((item) => String(item.id) === String(role.id));
          if (index >= 0) this.roles.splice(index, 1, role);
          else this.roles.unshift(role);
          this.updateStats();
          this.dialog = { open: false, type: '', subject: null };
          this.showAlert('success', existing ? 'نقش بروزرسانی شد.' : 'نقش جدید ایجاد شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async deleteRole(role) {
        if (!window.confirm(`حذف نقش ${role.name} انجام شود؟`)) return;
        this.loading.saving = true;
        try {
          await window.SaraAPI.delete(`${ROLE_ENDPOINT}${role.id}/`);
          this.roles = this.roles.filter((item) => String(item.id) !== String(role.id));
          this.updateStats();
          this.showAlert('success', 'نقش حذف شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      apiMessage(error) {
        return error?.data?.detail || error?.data?.message || error?.message || 'ارتباط با API برقرار نشد.';
      },

      logout() {
        window.SaraAuth?.logout?.('../login.html');
      }
    };
  }

  window.systemAdminPanel = systemAdminPanel;
})();
