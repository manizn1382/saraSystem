/* Shared Alpine controllers for lightweight SaraSystem dashboard shell pages. */
(function () {
  function tableMixin() {
    return {
      tableState: {},
      queryItems(resource, items, keys) {
        const state = this.tableState[resource];
        return window.SaraUI?.searchList?.(items, state?.query, keys) || items;
      },
      sortedItems(resource, items) {
        return window.SaraUI?.sortList?.(items, this.tableState[resource]?.sort) || items;
      },
      pageItems(resource, items) {
        const state = this.tableState[resource];
        const page = window.SaraUI?.pageList?.(items, state?.page, state?.pageSize) || {
          items,
          page: 1,
          pageSize: items.length || 1,
          totalPages: 1,
          totalItems: items.length
        };
        if (state && state.page !== page.page) state.page = page.page;
        return page;
      },
      tablePage(resource, items, keys) {
        return this.pageItems(resource, this.sortedItems(resource, this.queryItems(resource, items, keys)));
      },
      setSort(resource, key) {
        this.tableState[resource].sort = window.SaraUI?.toggleSort?.(this.tableState[resource].sort, key) || { key, direction: 'asc' };
        this.tableState[resource].page = 1;
      },
      resetPage(resource) {
        if (this.tableState[resource]) this.tableState[resource].page = 1;
      },
      sortIcon(resource, key) {
        const sort = this.tableState[resource]?.sort;
        if (sort?.key !== key) return '↕';
        return sort.direction === 'asc' ? '↑' : '↓';
      }
    };
  }

  function requestStateMixin() {
    return {
      resourceStates: {},
      setResourceLoading(resource) {
        if (this.resourceStates[resource]) window.SaraUI?.setLoading?.(this.resourceStates[resource]);
      },
      setResourceSuccess(resource, data) {
        if (this.resourceStates[resource]) window.SaraUI?.setSuccess?.(this.resourceStates[resource], data);
      },
      setResourceError(resource, error) {
        if (this.resourceStates[resource]) window.SaraUI?.setError?.(this.resourceStates[resource], error);
      },
      resourceError(resource) {
        return this.resourceStates[resource]?.error || '';
      },
      isResourceLoading(resource) {
        return Boolean(this.resourceStates[resource]?.loading);
      }
    };
  }

  function dashboardRouter() {
    return {
      user: window.SaraAuth?.getStoredUser?.() || {},
      dashboards: [
        { icon: '🎓', title: 'دانشجو', description: 'درخواست اسکان، پرداخت‌ها، تعمیرات و اطلاعیه‌ها', href: './student.html', enabled: true },
        { icon: '🛡️', title: 'مسئول خوابگاه', description: 'بررسی درخواست‌ها، ظرفیت و تخصیص تخت', href: './dormitory-admin.html', enabled: true },
        { icon: '📊', title: 'مدیر سیستم', description: 'مدیریت کاربران، نقش‌ها، خوابگاه‌ها و گزارش‌ها', href: './admin.html', enabled: true },
        { icon: '🧰', title: 'واحد پشتیبانی', description: 'صف درخواست‌های تعمیرات و پیگیری وضعیت', href: './support.html', enabled: true }
      ],
      fullName() {
        return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim()
          || this.user.username
          || this.user.email
          || 'کاربر';
      },
      rolesText() {
        const roles = window.SaraAuth?.getUserRoles(this.user) || [];
        return roles.length ? roles.join(', ') : 'نامشخص';
      },
      logout() {
        window.SaraAuth?.logout?.('../login.html');
      }
    };
  }

  function adminPanel() {
    return {
      ...window.SaraPage.basePanelState(),
      ...tableMixin(),
      ...requestStateMixin(),
      users: [],
      roles: [],
      forms: {
        role: { loading: false, name: '', description: '', errors: {}, message: '', success: false }
      },
      tableState: {
        users: { query: '', sort: { key: 'last_name', direction: 'asc' }, page: 1, pageSize: 10 },
        roles: { query: '', sort: { key: 'name', direction: 'asc' }, page: 1, pageSize: 10 }
      },
      resourceStates: {
        users: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: '', retryable: false },
        roles: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: '', retryable: false }
      },
      stats: [
        { icon: '👥', value: '—', label: 'کاربران' },
        { icon: '🔐', value: '—', label: 'نقش‌ها' },
        { icon: '✅', value: '—', label: 'حساب‌های فعال' },
        { icon: '⏳', value: '—', label: 'در انتظار تایید' }
      ],
      init() {
        window.SaraPage.bindGlobalAlert(this);
        document.body.addEventListener('htmx:beforeRequest', (event) => {
          const resource = event.detail?.elt?.dataset?.resource;
          if (['users', 'roles'].includes(resource)) this.setResourceLoading(resource);
        });
        document.body.addEventListener('htmx:afterRequest', (event) => {
          const resource = event.detail?.elt?.dataset?.resource;
          if (!['users', 'roles'].includes(resource)) return;
          const data = this.parseJson(event.detail.xhr.responseText);
          if (event.detail.xhr.status >= 200 && event.detail.xhr.status < 300) {
            if (resource === 'users') this.applyUsers(data);
            if (resource === 'roles') this.applyRoles(data);
            this.setResourceSuccess(resource, data);
            return;
          }
          this.setResourceError(resource, { status: event.detail.xhr.status, data, message: window.SaraUI?.apiErrorMessage?.(event.detail.xhr.status, data), retryable: true });
        });
        document.body.addEventListener('htmx:sendError', (event) => {
          const resource = event.detail?.elt?.dataset?.resource;
          if (['users', 'roles'].includes(resource)) this.setResourceError(resource, { status: 0, message: 'ارتباط با سرور برقرار نشد.', retryable: true });
        });
        document.body.addEventListener('htmx:timeout', (event) => {
          const resource = event.detail?.elt?.dataset?.resource;
          if (['users', 'roles'].includes(resource)) this.setResourceError(resource, { status: 504, message: 'زمان پاسخ‌گویی سرور به پایان رسید.', retryable: true });
        });
      },
      applyUsers(data) {
        this.users = window.SaraAPI?.list?.(data) || [];
        this.updateAccountStats();
      },
      applyRoles(data) {
        this.roles = window.SaraAPI?.list?.(data) || [];
        this.updateAccountStats();
      },
      updateAccountStats() {
        this.stats[0].value = this.users.length ? this.toPersianNumber(this.users.length) : '—';
        this.stats[1].value = this.roles.length ? this.toPersianNumber(this.roles.length) : '—';
        this.stats[2].value = this.users.length ? this.toPersianNumber(this.users.filter((user) => user.is_active !== false).length) : '—';
        this.stats[3].value = this.users.length ? this.toPersianNumber(this.users.filter((user) => user.is_verified === false).length) : '—';
      },
      userList() {
        return this.tablePage('users', this.users, ['first_name', 'last_name', 'username', 'email', 'student_id', 'national_id']).items;
      },
      userPage() {
        return this.tablePage('users', this.users, ['first_name', 'last_name', 'username', 'email', 'student_id', 'national_id']);
      },
      roleList() {
        return this.tablePage('roles', this.roles, ['name', 'description']).items;
      },
      rolePage() {
        return this.tablePage('roles', this.roles, ['name', 'description']);
      },
      async createRole() {
        this.forms.role.errors = {};
        this.forms.role.message = '';
        this.forms.role.success = false;

        if (!this.forms.role.name.trim()) {
          this.forms.role.errors.name = 'نام نقش الزامی است.';
          return;
        }

        this.forms.role.loading = true;
        try {
          const role = await window.SaraAPI.post('/api/accounts/roles/', {
            name: this.forms.role.name.trim(),
            description: this.forms.role.description.trim()
          });
          this.roles = [role, ...this.roles.filter((item) => item.id !== role?.id)];
          this.resetPage('roles');
          this.updateAccountStats();
          this.forms.role.success = true;
          this.forms.role.message = 'نقش جدید با موفقیت ثبت شد.';
          this.forms.role.name = '';
          this.forms.role.description = '';
        } catch (error) {
          this.forms.role.errors = error.fields || {};
          this.forms.role.message = error.message || 'ثبت نقش ناموفق بود.';
        } finally {
          this.forms.role.loading = false;
        }
      },
      roleDescription(role) {
        return role.description || '—';
      },
      fullName(user) {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '—';
      },
      roleText(user) {
        const roles = window.SaraAuth?.getUserRoles(user) || [];
        return roles.length ? roles.join('، ') : '—';
      }
    };
  }

  function supportPanel() {
    return {
      ...window.SaraPage.basePanelState(),
      ...tableMixin(),
      ...requestStateMixin(),
      tickets: [],
      filters: { priority: 'all', status: 'all' },
      tableState: {
        maintenance: { query: '', sort: { key: 'created_at', direction: 'desc' }, page: 1, pageSize: 10 }
      },
      resourceStates: {
        maintenance: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: '', retryable: false }
      },
      stats: [
        { icon: '📌', value: '—', label: 'درخواست‌های باز' },
        { icon: '🚨', value: '—', label: 'فوری' },
        { icon: '🛠️', value: '—', label: 'در حال رسیدگی' },
        { icon: '✅', value: '—', label: 'حل‌شده' }
      ],
      init() {
        window.SaraPage.bindGlobalAlert(this);
        document.body.addEventListener('htmx:beforeRequest', (event) => {
          if (event.detail?.elt?.dataset?.resource === 'maintenance') this.setResourceLoading('maintenance');
        });
        document.body.addEventListener('htmx:afterRequest', (event) => {
          if (event.detail?.elt?.dataset?.resource !== 'maintenance') return;
          const data = this.parseJson(event.detail.xhr.responseText);
          if (event.detail.xhr.status >= 200 && event.detail.xhr.status < 300) {
            this.tickets = window.SaraAdapters?.adaptList?.(data, window.SaraAdapters.maintenanceRequest) || this.asList(data);
            this.updateStats();
            this.setResourceSuccess('maintenance', data);
            return;
          }
          this.setResourceError('maintenance', { status: event.detail.xhr.status, data, message: window.SaraUI?.apiErrorMessage?.(event.detail.xhr.status, data), retryable: true });
        });
        document.body.addEventListener('htmx:sendError', () => this.setResourceError('maintenance', { status: 0, message: 'ارتباط با سرور برقرار نشد.', retryable: true }));
        document.body.addEventListener('htmx:timeout', () => this.setResourceError('maintenance', { status: 504, message: 'زمان پاسخ‌گویی سرور به پایان رسید.', retryable: true }));
      },
      filteredTickets() {
        const filtered = this.tickets.filter((ticket) =>
          (this.filters.priority === 'all' || ticket.priority === this.filters.priority)
          && (this.filters.status === 'all' || ticket.status === this.filters.status)
        );
        return this.tablePage('maintenance', filtered, ['title', 'description', 'location', 'assigned_to', 'created_at']).items;
      },
      ticketPage() {
        const filtered = this.tickets.filter((ticket) =>
          (this.filters.priority === 'all' || ticket.priority === this.filters.priority)
          && (this.filters.status === 'all' || ticket.status === this.filters.status)
        );
        return this.tablePage('maintenance', filtered, ['title', 'description', 'location', 'assigned_to', 'created_at']);
      },
      updateStats() {
        const open = this.tickets.filter((ticket) => !['resolved', 'closed'].includes(ticket.status)).length;
        this.stats[0].value = this.toPersianNumber(open);
        this.stats[1].value = this.toPersianNumber(this.tickets.filter((ticket) => ticket.priority === 'urgent').length);
        this.stats[2].value = this.toPersianNumber(this.tickets.filter((ticket) => ['progress', 'in_progress'].includes(ticket.status)).length);
        this.stats[3].value = this.toPersianNumber(this.tickets.filter((ticket) => ticket.status === 'resolved').length);
      },
      locationText(ticket) {
        return ticket.location
          || [ticket.room_id ? `اتاق ${ticket.room_id}` : '', ticket.bed_id ? `تخت ${ticket.bed_id}` : ''].filter(Boolean).join('، ')
          || '—';
      },
      priorityText(priority) {
        return window.SaraStatus?.get?.('priority', priority).label || priority || '—';
      },
      priorityClass(priority) {
        return window.SaraStatus?.get?.('priority', priority).className?.replace('ss-status-badge ', '') || '';
      },
      statusText(status) {
        return window.SaraStatus?.get?.('maintenance', status).label || status || '—';
      }
    };
  }

  window.dashboardRouter = dashboardRouter;
  window.adminPanel = adminPanel;
  window.supportPanel = supportPanel;
})();
