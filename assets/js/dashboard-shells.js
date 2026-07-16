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
        this.users = (window.SaraAPI?.list?.(data) || []).map((user) => window.SaraAuth?.normalizeAccountUser?.(user) || user);
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
          const response = await window.SaraAPI.post('/api/accounts/roles/', {
            name: this.forms.role.name.trim(),
            description: this.forms.role.description.trim()
          });
          const role = response?.role || response;
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
      user: window.SaraAuth?.getStoredUser?.() || {},
      sidebarOpen: false,
      profileOpen: false,
      activeSection: '#overview',
      tickets: [],
      selectedTicket: null,
      ticketAction: { status: '', resolution_note: '', notice: '' },
      filters: { priority: 'all', status: 'all', assigned: 'all' },
      tableState: {
        maintenance: { query: '', sort: { key: 'created_at', direction: 'desc' }, page: 1, pageSize: 10 }
      },
      resourceStates: {
        maintenance: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: '', retryable: false }
      },
      stats: [
        { icon: '📌', value: '—', label: 'درخواست‌های باز', description: 'همه مواردی که هنوز بسته نشده‌اند' },
        { icon: '🚨', value: '—', label: 'موارد فوری', description: 'نیازمند رسیدگی سریع پشتیبانی' },
        { icon: '🛠️', value: '—', label: 'در حال رسیدگی', description: 'درخواست‌های فعال در جریان کار' },
        { icon: '✅', value: '—', label: 'حل‌شده', description: 'موارد تکمیل‌شده و بسته‌شده' }
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
        return this.ticketPage().items;
      },
      resolvedTickets() {
        return this.tickets.filter((ticket) => ticket.status === 'resolved');
      },
      ticketPage() {
        const filtered = this.filteredTicketItems();
        return this.tablePage('maintenance', filtered, ['title', 'description', 'location', 'assigned_to', 'created_at']);
      },
      filteredTicketItems() {
        return this.tickets.filter((ticket) =>
          (this.filters.priority === 'all' || ticket.priority === this.filters.priority)
          && (this.filters.status === 'all' || ticket.status === this.filters.status)
          && (this.filters.assigned === 'all'
            || (this.filters.assigned === 'me' && this.isAssignedToMe(ticket))
            || (this.filters.assigned === 'unassigned' && !this.assigneeText(ticket)))
        );
      },
      supportFilterChips() {
        const chips = [];
        const query = this.tableState.maintenance?.query?.trim();
        if (query) chips.push(`جستجو: ${query}`);
        if (this.filters.priority !== 'all') chips.push(`اولویت: ${this.priorityText(this.filters.priority)}`);
        if (this.filters.status !== 'all') chips.push(`وضعیت: ${this.statusText(this.filters.status)}`);
        if (this.filters.assigned !== 'all') {
          chips.push({
            me: 'ارجاع: به من',
            unassigned: 'ارجاع: بدون مسئول'
          }[this.filters.assigned] || this.filters.assigned);
        }
        return chips;
      },
      clearSupportFilters() {
        this.tableState.maintenance.query = '';
        this.filters = { priority: 'all', status: 'all', assigned: 'all' };
        this.resetPage('maintenance');
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
      currentUserName() {
        return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || this.user.username || this.user.email || 'واحد پشتیبانی';
      },
      userInitials() {
        const first = (this.user.first_name || this.user.firstName || this.user.username || this.user.email || 'پ').trim().charAt(0);
        const last = (this.user.last_name || this.user.lastName || '').trim().charAt(0);
        return `${first}${last}`.toUpperCase();
      },
      accountPath() {
        const params = new URLSearchParams({ from: 'support' });
        if (window.SaraAuth?.isDemoMode?.()) params.set('demo', 'support');
        return `../account.html?${params.toString()}`;
      },
      currentUserId() {
        return this.user.id || this.user.user_id || this.user.pk || '';
      },
      assigneeText(ticket) {
        return ticket.assigned_to?.name || ticket.assigned_to || '';
      },
      isAssignedToMe(ticket) {
        const assignee = String(this.assigneeText(ticket) || '').toLowerCase();
        const assignedId = String(ticket.assigned_to_id || '');
        const ids = [this.user.id, this.user.user_id].filter(Boolean).map(String);
        const names = [this.currentUserName(), this.user.username, this.user.email].filter(Boolean).map((item) => String(item).toLowerCase());
        return Boolean((assignedId && ids.includes(assignedId)) || (assignee && names.some((name) => assignee.includes(name))));
      },
      openTicket(ticket) {
        this.selectedTicket = ticket;
        this.ticketAction = {
          status: ticket.status || 'pending',
          resolution_note: ticket.resolution_note || '',
          notice: ''
        };
      },
      closeTicket() {
        this.selectedTicket = null;
        this.ticketAction = { status: '', resolution_note: '', notice: '' };
      },
      mergeTicketUpdate(ticket, data = {}, fallback = {}) {
        if (!ticket) return;
        const payload = data?.data || data || {};
        const adapted = {};
        if (payload.id !== undefined) adapted.id = payload.id;
        if (payload.title !== undefined) adapted.title = payload.title;
        if (payload.description !== undefined) {
          adapted.description = payload.description;
          if (fallback.resolution_note) adapted.resolution_note = fallback.resolution_note;
        }
        if (payload.priority !== undefined) adapted.priority = payload.priority;
        if (payload.status !== undefined) adapted.status = payload.status;
        if (payload.assigned_to !== undefined) {
          adapted.assigned_to_id = payload.assigned_to?.id || payload.assigned_to;
          adapted.assigned_to = String(adapted.assigned_to_id) === String(this.currentUserId())
            ? this.currentUserName()
            : String(adapted.assigned_to_id || '');
        }
        if (payload.updated_at !== undefined) adapted.updated_at = payload.updated_at || fallback.updated_at;
        if (payload.resolved_at !== undefined) adapted.resolved_at = payload.resolved_at || fallback.resolved_at;
        if (payload.createAt !== undefined || payload.created_at !== undefined) adapted.created_at = payload.created_at || payload.createAt;
        const updated = {
          ...ticket,
          ...fallback,
          ...adapted,
          id: ticket.id
        };
        Object.assign(ticket, updated);
        this.tickets = this.tickets.map((item) => String(item.id) === String(ticket.id) ? ticket : item);
        if (this.selectedTicket && String(this.selectedTicket.id) === String(ticket.id)) {
          this.selectedTicket = ticket;
        }
        this.updateStats();
      },
      maintenanceActionError(error, fallback) {
        return error?.message || window.SaraUI?.apiErrorMessage?.(error?.status, error?.data) || fallback;
      },
      async assignSelectedToMe() {
        if (!this.selectedTicket) return;
        const userId = this.currentUserId();
        if (!userId) {
          this.ticketAction.notice = 'شناسه کاربر فعلی برای ارجاع در دسترس نیست.';
          return;
        }

        this.ticketAction.loading = true;
        this.ticketAction.notice = '';

        try {
          const data = await window.SaraAPI.patch(`/api/maintenance-requests/${encodeURIComponent(this.selectedTicket.id)}/assign/`, {
            assigned_to: userId
          });
          const fallback = {
            assigned_to: this.currentUserName(),
            assigned_to_id: userId,
            status: this.selectedTicket.status === 'pending' ? 'assigned' : this.selectedTicket.status,
            updated_at: new Date().toISOString().slice(0, 10)
          };
          this.mergeTicketUpdate(this.selectedTicket, data, fallback);
          if (this.selectedTicket.status === 'pending') this.selectedTicket.status = 'assigned';
          if (this.ticketAction.status === 'pending') this.ticketAction.status = this.selectedTicket.status || 'assigned';
          this.ticketAction.notice = data?.message || 'ارجاع درخواست در API تعمیرات ثبت شد.';
        } catch (error) {
          this.ticketAction.notice = this.maintenanceActionError(error, 'ارجاع درخواست ناموفق بود.');
        } finally {
          this.ticketAction.loading = false;
        }
      },
      async applyTicketUpdate() {
        if (!this.selectedTicket) return;
        const nextStatus = this.ticketAction.status || this.selectedTicket.status;
        const resolutionNote = this.ticketAction.resolution_note || '';
        this.ticketAction.loading = true;
        this.ticketAction.notice = '';

        try {
          const responses = [];
          if (nextStatus && nextStatus !== this.selectedTicket.status) {
            responses.push(await window.SaraAPI.patch(`/api/maintenance-requests/${encodeURIComponent(this.selectedTicket.id)}/status/`, {
              status: nextStatus
            }));
          }

          if (resolutionNote && resolutionNote !== this.selectedTicket.resolution_note) {
            responses.push(await window.SaraAPI.patch(`/api/maintenance-requests/${encodeURIComponent(this.selectedTicket.id)}/comments/`, {
              resolution_note: resolutionNote
            }));
          }

          if (!responses.length) {
            this.ticketAction.notice = 'تغییری برای ثبت وجود ندارد.';
            return;
          }

          const updatedAt = new Date().toISOString().slice(0, 10);
          const fallback = {
            status: nextStatus,
            resolution_note: resolutionNote,
            updated_at: updatedAt,
            resolved_at: nextStatus === 'resolved' ? this.selectedTicket.resolved_at || updatedAt : this.selectedTicket.resolved_at
          };
          responses.forEach((data) => this.mergeTicketUpdate(this.selectedTicket, data, fallback));
          this.ticketAction.notice = responses[responses.length - 1]?.message || 'تغییرات درخواست در API تعمیرات ثبت شد.';
        } catch (error) {
          this.ticketAction.notice = this.maintenanceActionError(error, 'ثبت تغییرات درخواست ناموفق بود.');
        } finally {
          this.ticketAction.loading = false;
        }
      },
      ticketTimeline(ticket = this.selectedTicket) {
        if (!ticket) return [];
        return [
          { title: 'ثبت درخواست', date: ticket.created_at || '—', text: ticket.requested_by ? `ثبت توسط ${ticket.requested_by}` : 'درخواست در صف تعمیرات ثبت شد.' },
          { title: 'ارجاع', date: ticket.updated_at || ticket.created_at || '—', text: this.assigneeText(ticket) ? `ارجاع به ${this.assigneeText(ticket)}` : 'هنوز به کارشناس مشخص ارجاع نشده است.' },
          { title: 'وضعیت فعلی', date: ticket.updated_at || '—', text: this.statusText(ticket.status) },
          { title: 'یادداشت حل مشکل', date: ticket.resolved_at || 'وابسته به API', text: ticket.resolution_note || 'یادداشت حل مشکل ثبت نشده است.' }
        ];
      },
      priorityText(priority) {
        return window.SaraStatus?.get?.('priority', priority).label || priority || '—';
      },
      priorityClass(priority) {
        return window.SaraStatus?.get?.('priority', priority).className || 'ss-status-badge ss-status-muted';
      },
      statusText(status) {
        return window.SaraStatus?.get?.('maintenance', status).label || status || '—';
      },
      statusClass(status) {
        return window.SaraStatus?.get?.('maintenance', status).className || 'ss-status-badge ss-status-muted';
      }
    };
  }

  window.dashboardRouter = dashboardRouter;
  window.adminPanel = adminPanel;
  window.supportPanel = supportPanel;
})();
