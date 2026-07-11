/* System-admin dashboard controller. API authorization remains server-side. */
(function () {
  const USER_LIST_ENDPOINT = '/api/v1/users/list';
  const USER_CREATE_ENDPOINT = '/api/v1/users/create';
  const USER_ADMIN_UPDATE_ENDPOINT = '/api/v1/users/adminUpdate';
  const USER_DELETE_ENDPOINT = '/api/v1/users/delete';
  const USER_STATUS_ENDPOINT = '/api/v1/users/status/change';
  const ROLE_CREATE_ENDPOINT = '/api/v1/role/create';
  const ROLE_LIST_ENDPOINT = '/api/v1/role/list';
  const ROLE_UPDATE_ENDPOINT = '/api/v1/role/update';
  const ROLE_DELETE_ENDPOINT = '/api/v1/role/delete';
  const PERMISSION_CREATE_ENDPOINT = '/api/v1/permission/create';
  const PERMISSION_LIST_ENDPOINT = '/api/v1/permission/list';
  const ROLE_PERMISSION_CREATE_ENDPOINT = '/api/v1/rolePermission/create';
  const USER_ROLE_CREATE_ENDPOINT = '/api/v1/userRole/create';
  const DORMITORY_ENDPOINT = '/api/dormitory/listAll/';

  function asArray(data) {
    return window.SaraUI?.asList?.(data)
      || (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
  }

  function unwrap(data, key) {
    return data?.[key] || data?.data?.[key] || data;
  }

  function normalizeUser(item = {}, index = 0) {
    const profile = item.profile || item.userprofile || {};
    const normalized = window.SaraAuth?.normalizeAccountUser?.({
      ...item,
      id: item.id ?? item.user_id ?? item.pk ?? '',
      username: item.username || '',
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      profile
    }) || item;

    return {
      ...normalized,
      row_id: normalized.id || normalized.username || normalized.email || `user-${index + 1}`,
      national_id: normalized.national_id || profile.nationalId || profile.national_id || '',
      student_id: normalized.student_id || profile.studentId || profile.student_id || '',
      phone: normalized.phone || profile.phone || '',
      gender: normalized.gender || profile.gender || '',
      is_active: normalized.is_active !== false,
      is_verified: normalized.is_verified ?? normalized.isVerified ?? profile.isVerified ?? profile.is_verified
    };
  }

  function normalizeRole(item = {}) {
    if (typeof item === 'string') return { id: '', name: item, description: '' };
    return {
      id: item.id ?? item.role_id ?? '',
      name: item.name || item.roleName || '',
      description: item.description || ''
    };
  }

  function normalizePermission(item = {}) {
    if (typeof item === 'string') return { id: '', code: item, label: item, description: '' };
    return {
      id: item.id ?? item.permission_id ?? '',
      code: item.code || item.name || '',
      label: item.name || item.label || item.code || '',
      description: item.description || ''
    };
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
      loading: { users: false, roles: false, dormitories: false, permissions: false, saving: false },
      errors: { users: '', roles: '', dormitories: '', permissions: '' },
      filters: { query: '', role: 'all', status: 'all', page: 1, pageSize: 10 },
      dialog: { open: false, type: '', subject: null },
      userForm: {},
      roleForm: { name: '', description: '' },
      accessControl: { userId: '', roleId: '', roleName: '', notice: '' },
      permissionForm: { name: '', code: '', description: '', permissionId: '', roleId: '', notice: '', loading: false },
      permissionCatalog: [
        { code: 'users.manage', label: 'مدیریت کاربران' },
        { code: 'dormitories.manage', label: 'مدیریت خوابگاه‌ها' },
        { code: 'accommodation.review', label: 'بررسی درخواست‌های اسکان' },
        { code: 'payments.manage', label: 'مدیریت پرداخت‌ها' },
        { code: 'maintenance.manage', label: 'مدیریت تعمیرات' },
        { code: 'announcements.manage', label: 'مدیریت اطلاعیه‌ها' }
      ],
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

      accountPath() {
        const params = new URLSearchParams({ from: 'admin' });
        if (window.SaraAuth?.isDemoMode?.()) params.set('demo', 'admin');
        return `../account.html?${params.toString()}`;
      },

      async loadAll() {
        await Promise.all([this.loadUsers(), this.loadRoles(), this.loadPermissions(), this.loadDormitories()]);
        this.syncRolesFromUsers();
        this.updateStats();
      },

      async loadUsers() {
        this.loading.users = true;
        this.errors.users = '';
        try {
          this.users = asArray(await window.SaraAPI.get(USER_LIST_ENDPOINT)).map(normalizeUser);
          this.syncRolesFromUsers();
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
          const storedRoles = JSON.parse(localStorage.getItem('sarasystem.account.roles') || '[]');
          const remoteRoles = asArray(await window.SaraAPI.get(ROLE_LIST_ENDPOINT)).map(normalizeRole).filter((role) => role.name);
          const rolesByName = new Map();
          [...remoteRoles, ...asArray(storedRoles).map(normalizeRole)].forEach((role) => {
            if (!role.name) return;
            const current = rolesByName.get(role.name) || {};
            rolesByName.set(role.name, {
              ...current,
              ...role,
              id: role.id || current.id || ''
            });
          });
          this.roles = Array.from(rolesByName.values());
          this.syncRolesFromUsers();
          this.updateStats();
        } catch (error) {
          this.errors.roles = this.apiMessage(error);
        } finally {
          this.loading.roles = false;
        }
      },

      async loadPermissions() {
        this.loading.permissions = true;
        this.errors.permissions = '';
        try {
          const remotePermissions = asArray(await window.SaraAPI.get(PERMISSION_LIST_ENDPOINT))
            .map(normalizePermission)
            .filter((permission) => permission.code || permission.label);
          const permissionsByCode = new Map();
          [...this.permissionCatalog.map(normalizePermission), ...remotePermissions].forEach((permission) => {
            const key = permission.code || permission.label || permission.id;
            if (!key) return;
            const current = permissionsByCode.get(key) || {};
            permissionsByCode.set(key, {
              ...current,
              ...permission,
              id: permission.id || current.id || ''
            });
          });
          this.permissionCatalog = Array.from(permissionsByCode.values());
        } catch (error) {
          this.errors.permissions = this.apiMessage(error);
        } finally {
          this.loading.permissions = false;
        }
      },

      persistRoles() {
        localStorage.setItem('sarasystem.account.roles', JSON.stringify(this.roles.filter((role) => role.id)));
      },

      syncRolesFromUsers() {
        const existing = new Map(this.roles.map((role) => [role.name, role]));
        this.users.forEach((user) => {
          this.rolesFor(user).forEach((roleName) => {
            if (!existing.has(roleName)) existing.set(roleName, normalizeRole(roleName));
          });
        });
        this.roles = Array.from(existing.values()).filter((role) => role.name);
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
            item.first_name, item.last_name, item.username, item.email, item.student_id, item.national_id, item.phone
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
        this.userForm = user
          ? {
              id: user.id || '',
              username: user.username || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              email: user.email || '',
              national_id: user.national_id || user.nationalId || user.profile?.nationalId || '',
              student_id: user.student_id || user.studentId || user.profile?.studentId || '',
              phone: user.phone || user.profile?.phone || '',
              gender: window.SaraAuth?.normalizeGender?.(user.gender || user.profile?.gender || '') || 'm',
              password: ''
            }
          : {
              username: '', first_name: '', last_name: '', email: '', national_id: '', student_id: '', phone: '',
              gender: 'm', password: ''
            };
        this.dialog = { open: true, type: 'user-form', subject: user };
      },

      openRoleForm(role = null) {
        if (role && !role.id) {
          this.showAlert('danger', 'این نقش از فهرست کاربران استخراج شده و شناسه id برای ویرایش یا اتصال API ندارد.');
          return;
        }
        this.roleForm = role
          ? { id: role.id, name: role.name || '', description: role.description || '' }
          : { name: '', description: '' };
        this.dialog = { open: true, type: 'role-form', subject: role };
      },

      selectedAccessUser() {
        return this.users.find((item) => String(item.id || item.row_id) === String(this.accessControl.userId)) || null;
      },

      async requestRoleAssignment() {
        if (!this.accessControl.userId || !this.accessControl.roleId) {
          this.accessControl.notice = 'کاربر و نقش را انتخاب کنید.';
          return;
        }

        const user = this.selectedAccessUser();
        if (!user?.id) {
          this.accessControl.notice = 'این کاربر در پاسخ API شناسه id ندارد و امکان ارسال به userRole/create نیست.';
          return;
        }

        this.loading.saving = true;
        try {
          const data = await window.SaraAPI.post(USER_ROLE_CREATE_ENDPOINT, {
            user: user.id,
            role: this.accessControl.roleId
          });
          const role = this.roles.find((item) => String(item.id) === String(this.accessControl.roleId));
          user.roles = Array.from(new Set([...(user.roles || []), role?.name || data?.userRole?.roleName].filter(Boolean)));
          this.accessControl.notice = data?.message || 'نقش برای کاربر ثبت شد.';
          this.updateStats();
        } catch (error) {
          this.accessControl.notice = this.apiMessage(error);
        } finally {
          this.loading.saving = false;
        }
      },

      closeDialog() {
        if (this.loading.saving) return;
        this.dialog = { open: false, type: '', subject: null };
      },

      userPayload() {
        const password = this.userForm.password || '';
        const payload = {
          username: this.userForm.username,
          email: this.userForm.email,
          first_name: this.userForm.first_name || '',
          last_name: this.userForm.last_name || '',
          profile: {
            nationalId: this.userForm.national_id || '',
            studentId: this.userForm.student_id || '',
            phone: this.userForm.phone || '',
            gender: window.SaraAuth?.normalizeGender?.(this.userForm.gender) || this.userForm.gender || 'm',
            profileImage: ''
          }
        };

        if (this.userForm.id) {
          payload.id = this.userForm.id;
          return payload;
        }

        return {
          ...payload,
          password,
          confirm_password: password
        };
      },

      async saveUser() {
        this.loading.saving = true;
        try {
          const payload = this.userPayload();
          if (this.userForm.id) {
            const response = await window.SaraAPI.put(USER_ADMIN_UPDATE_ENDPOINT, payload);
            const index = this.users.findIndex((item) => String(item.id) === String(this.userForm.id));
            const current = index >= 0 ? this.users[index] : {};
            const saved = normalizeUser({ ...current, ...payload, profile: { ...(current.profile || {}), ...(payload.profile || {}) } });
            if (index >= 0) this.users.splice(index, 1, saved);
            else this.users.unshift(saved);
            this.syncRolesFromUsers();
            this.updateStats();
            this.dialog = { open: false, type: '', subject: null };
            this.showAlert('success', response?.message || 'اطلاعات کاربر به‌روزرسانی شد.');
            return;
          }

          const response = await window.SaraAPI.post(USER_CREATE_ENDPOINT, payload);
          const saved = normalizeUser(unwrap(response, 'user'));
          this.users.unshift(saved);
          this.syncRolesFromUsers();
          this.updateStats();
          this.dialog = { open: false, type: '', subject: null };
          this.showAlert('success', response?.message || 'کاربر جدید ایجاد شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async toggleUserActivity(user) {
        if (!user?.id) {
          this.showAlert('danger', 'این کاربر در پاسخ API شناسه id ندارد و تغییر وضعیت ممکن نیست.');
          return;
        }

        const nextStatus = user.is_active === false;
        this.loading.saving = true;
        try {
          const response = await window.SaraAPI.patch(USER_STATUS_ENDPOINT, {
            id: user.id,
            is_active: nextStatus
          });
          user.is_active = nextStatus;
          this.updateStats();
          this.showAlert('success', response?.message || 'وضعیت کاربر به‌روزرسانی شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async deleteUser(user) {
        if (!user?.id) {
          this.showAlert('danger', 'این کاربر در پاسخ API شناسه id ندارد و حذف ممکن نیست.');
          return;
        }

        if (!window.confirm(`کاربر ${this.fullName(user)} حذف شود؟`)) return;

        this.loading.saving = true;
        try {
          const response = await window.SaraAPI.delete(`${USER_DELETE_ENDPOINT}/${encodeURIComponent(user.id)}`);
          this.users = this.users.filter((item) => String(item.id) !== String(user.id));
          this.updateStats();
          this.dialog = { open: false, type: '', subject: null };
          this.showAlert('success', response?.message || 'کاربر حذف شد.');
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
          if (existing) {
            const response = await window.SaraAPI.patch(`${ROLE_UPDATE_ENDPOINT}/${encodeURIComponent(existing)}`, payload);
            const role = normalizeRole(unwrap(response, 'role'));
            const index = this.roles.findIndex((item) => String(item.id) === String(existing));
            if (index >= 0) this.roles.splice(index, 1, role);
            this.persistRoles();
            this.updateStats();
            this.dialog = { open: false, type: '', subject: null };
            this.showAlert('success', response?.message || 'نقش به‌روزرسانی شد.');
            return;
          }

          const response = await window.SaraAPI.post(ROLE_CREATE_ENDPOINT, payload);
          const role = normalizeRole(unwrap(response, 'role'));
          const index = this.roles.findIndex((item) => String(item.id) === String(role.id));
          if (index >= 0) this.roles.splice(index, 1, role);
          else this.roles.unshift(role);
          this.persistRoles();
          this.updateStats();
          this.dialog = { open: false, type: '', subject: null };
          this.showAlert('success', response?.message || 'نقش جدید ایجاد شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async deleteRole(role) {
        if (!role?.id) {
          this.showAlert('danger', 'این نقش شناسه id ندارد و حذف آن از طریق API ممکن نیست.');
          return;
        }

        if (!window.confirm(`نقش ${role.name} حذف شود؟`)) return;

        this.loading.saving = true;
        try {
          const response = await window.SaraAPI.delete(`${ROLE_DELETE_ENDPOINT}/${encodeURIComponent(role.id)}`);
          this.roles = this.roles.filter((item) => String(item.id) !== String(role.id));
          this.persistRoles();
          this.updateStats();
          this.showAlert('success', response?.message || 'نقش حذف شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      async createPermission() {
        if (!this.permissionForm.name || !this.permissionForm.code) {
          this.permissionForm.notice = 'نام و کد مجوز الزامی است.';
          return;
        }

        this.permissionForm.loading = true;
        try {
          const response = await window.SaraAPI.post(PERMISSION_CREATE_ENDPOINT, {
            name: this.permissionForm.name,
            code: this.permissionForm.code,
            description: this.permissionForm.description || ''
          });
          const permission = normalizePermission(response?.permission || {
            code: this.permissionForm.code,
            name: this.permissionForm.name,
            description: this.permissionForm.description || ''
          });
          const permissionKey = permission.id || permission.code;
          this.permissionCatalog = [
            permission,
            ...this.permissionCatalog.filter((item) => String(item.id || item.code) !== String(permissionKey))
          ];
          if (permission.id) this.permissionForm.permissionId = permission.id;
          this.permissionForm.notice = response?.message || 'مجوز جدید ثبت شد. اگر API شناسه برگرداند، برای اتصال به نقش استفاده می‌شود.';
          this.permissionForm.name = '';
          this.permissionForm.code = '';
          this.permissionForm.description = '';
        } catch (error) {
          this.permissionForm.notice = this.apiMessage(error);
        } finally {
          this.permissionForm.loading = false;
        }
      },

      async assignPermissionToRole() {
        if (!this.permissionForm.roleId || !this.permissionForm.permissionId) {
          this.permissionForm.notice = 'شناسه نقش و شناسه مجوز برای RolePermission الزامی است.';
          return;
        }

        this.permissionForm.loading = true;
        try {
          const response = await window.SaraAPI.post(ROLE_PERMISSION_CREATE_ENDPOINT, {
            role: this.permissionForm.roleId,
            permission: this.permissionForm.permissionId
          });
          this.permissionForm.notice = response?.message || 'مجوز به نقش متصل شد.';
        } catch (error) {
          this.permissionForm.notice = this.apiMessage(error);
        } finally {
          this.permissionForm.loading = false;
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
