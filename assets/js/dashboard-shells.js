/* Shared Alpine controllers for lightweight SaraSystem dashboard shell pages. */
(function () {
  function dashboardRouter() {
    return {
      user: window.SaraAuth?.getStoredUser?.() || {},
      dashboards: [
        { icon: '🎓', title: 'دانشجو', description: 'درخواست اسکان، پرداخت‌ها، تعمیرات و اطلاعیه‌ها', href: './student.html', enabled: true },
        { icon: '🛡️', title: 'مسئول خوابگاه', description: 'بررسی درخواست‌ها، ظرفیت و تخصیص تخت', href: './dormitory-admin.html', enabled: true },
        { icon: '📊', title: 'مدیر سیستم', description: 'صفحه پایه؛ جزئیات مدیریتی در مراحل بعد تکمیل می‌شود', href: './admin.html', enabled: true },
        { icon: '🧰', title: 'واحد پشتیبانی', description: 'صفحه پایه؛ صف تعمیرات در مراحل بعد تکمیل می‌شود', href: './support.html', enabled: true }
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
      users: [],
      stats: [
        { icon: '👥', value: '—', label: 'کاربران' },
        { icon: '🏢', value: '—', label: 'خوابگاه‌ها' },
        { icon: '🛏️', value: '—', label: 'تخت‌ها' },
        { icon: '📌', value: '—', label: 'درخواست‌های فعال' }
      ],
      init() {
        window.SaraPage.bindGlobalAlert(this);
        document.body.addEventListener('htmx:afterRequest', (event) => {
          if (event.detail?.elt?.dataset?.resource !== 'users') return;
          const data = this.parseJson(event.detail.xhr.responseText);
          this.users = this.asList(data);
          this.stats[0].value = this.users.length ? this.toPersianNumber(this.users.length) : '—';
        });
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
      tickets: [],
      filters: { priority: 'all', status: 'all' },
      stats: [
        { icon: '📌', value: '—', label: 'درخواست‌های باز' },
        { icon: '🚨', value: '—', label: 'فوری' },
        { icon: '🛠️', value: '—', label: 'در حال رسیدگی' },
        { icon: '✅', value: '—', label: 'حل‌شده' }
      ],
      init() {
        window.SaraPage.bindGlobalAlert(this);
        document.body.addEventListener('htmx:afterRequest', (event) => {
          if (event.detail?.elt?.dataset?.resource !== 'maintenance') return;
          const data = this.parseJson(event.detail.xhr.responseText);
          this.tickets = this.asList(data);
          this.updateStats();
        });
      },
      filteredTickets() {
        return this.tickets.filter((ticket) =>
          (this.filters.priority === 'all' || ticket.priority === this.filters.priority)
          && (this.filters.status === 'all' || ticket.status === this.filters.status)
        );
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
