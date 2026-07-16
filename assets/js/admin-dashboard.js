/* System-admin dashboard controller. API authorization remains server-side. */
(function () {
  const USER_LIST_ENDPOINT = '/api/accounts/users/';
  const USER_CREATE_ENDPOINT = '/api/accounts/users/';
  const USER_ADMIN_UPDATE_ENDPOINT = '/api/accounts/users';
  const USER_DELETE_ENDPOINT = '/api/accounts/users';
  const USER_STATUS_ENDPOINT = '/api/accounts/users';
  const ROLE_CREATE_ENDPOINT = '/api/accounts/roles/';
  const ROLE_LIST_ENDPOINT = '/api/accounts/roles/';
  const ROLE_UPDATE_ENDPOINT = '/api/accounts/roles';
  const ROLE_DELETE_ENDPOINT = '/api/accounts/roles';
  const PERMISSION_CREATE_ENDPOINT = '/api/accounts/permissions/';
  const PERMISSION_LIST_ENDPOINT = '/api/accounts/permissions/';
  const ROLE_PERMISSION_CREATE_ENDPOINT = '/api/accounts/role-permissions/';
  const USER_ROLE_CREATE_ENDPOINT = '/api/accounts/user-roles/';
  const DORMITORY_ENDPOINT = '/api/dormitories/';
  const ROOM_ENDPOINT = '/api/rooms/';
  const BED_ENDPOINT = '/api/beds/';
  const ACCOMMODATION_REQUEST_ENDPOINT = '/api/accommodation-requests/';
  const BED_ASSIGNMENT_ENDPOINT = '/api/bed-assignments/';
  const PAYMENT_ENDPOINT = '/api/payments/';

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

  function normalizeDormitory(item = {}, index = 0) {
    const adapted = window.SaraAdapters?.dormitory?.(item, index) || {};
    return {
      ...item,
      ...adapted,
      id: adapted.id || item.id || item.dormitory_id || String(index + 1),
      total_rooms: Number(adapted.total_rooms ?? item.total_rooms ?? item.totalRoom ?? item.rooms_count ?? 0),
      occupied_beds: Number(adapted.occupied_beds ?? item.occupied_beds ?? item.currentOccupancy ?? 0),
      available_beds: Number(adapted.available_beds ?? item.available_beds ?? item.available_capacity ?? 0),
      occupancy: Number(adapted.occupancy ?? item.occupancy ?? item.occupancy_percent ?? item.occupancy_percentage ?? 0)
    };
  }

  function normalizeRoom(item = {}, index = 0) {
    const adapted = window.SaraAdapters?.room?.(item, index) || {};
    return {
      ...item,
      ...adapted,
      id: adapted.id || item.id || item.room_id || String(index + 1),
      dormitory_id: adapted.dormitory_id || item.dormitory_id || item.dormitory?.id || item.dormitory || '',
      capacity: Number(adapted.capacity ?? item.capacity ?? 0),
      occupied: Number(adapted.occupied ?? item.occupied ?? item.currentOccupancy ?? item.occupied_beds ?? 0)
    };
  }

  function normalizeBed(item = {}, index = 0) {
    const adapted = window.SaraAdapters?.bed?.(item, index) || {};
    return {
      ...item,
      ...adapted,
      id: adapted.id || item.id || item.bed_id || String(index + 1),
      room_id: adapted.room_id || item.room_id || item.room?.id || item.room || ''
    };
  }

  function normalizeAccommodationRequest(item = {}, index = 0) {
    return window.SaraAdapters?.accommodationRequest?.(item, index) || {
      id: item.id || String(index + 1),
      code: item.code || item.request_code || `REQ-${item.id || index + 1}`,
      student_name: item.student_name || item.user?.full_name || '',
      student_id: item.student_id || item.user?.student_id || '',
      dormitory: item.dormitory_name || item.requested_dormitory?.name || '',
      requested_dormitory_id: item.requested_dormitory_id || item.requested_dormitory?.id || item.dormitory_id || '',
      preferred_room_type: item.preferred_room_type || '',
      semester: item.semester || item.term || '',
      status: item.status || 'pending',
      request_date: item.request_date || item.created_at || ''
    };
  }

  function normalizeBedAssignment(item = {}, index = 0) {
    return window.SaraAdapters?.bedAssignment?.(item, index) || {
      id: item.id || String(index + 1),
      request_id: item.request_id || item.request?.id || '',
      user_id: item.user_id || item.user?.id || '',
      student_name: item.student_name || item.user?.full_name || '',
      dormitory: item.dormitory_name || item.dormitory?.name || '',
      room: item.room_number || item.room?.room_number || '',
      bed: item.bed_number || item.bed?.bed_number || item.bed || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      status: item.status || 'active',
      notes: item.notes || ''
    };
  }

  function normalizePayment(item = {}, index = 0) {
    return window.SaraAdapters?.payment?.(item, index) || {
      id: item.id || item.reference || item.transaction_ref || `PAY-${index + 1}`,
      user_id: item.user_id || item.user?.id || '',
      student_name: item.student_name || item.user?.full_name || '',
      student_id: item.student_id || item.user?.student_id || '',
      payment_type: item.payment_type || item.title || item.type || 'پرداخت خوابگاه',
      amount: item.amount_display || window.SaraUI?.formatAmount?.(item.amount) || item.amount || '',
      amount_value: item.amount || '',
      due_date: item.due_date || '',
      paid_at: item.paid_at || '',
      transaction_ref: item.transaction_ref || item.reference || '',
      status: item.status || 'unpaid',
      description: item.description || item.notes || ''
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
      rooms: [],
      beds: [],
      accommodationRequests: [],
      bedAssignments: [],
      payments: [],
      loading: {
        users: false,
        roles: false,
        dormitories: false,
        rooms: false,
        beds: false,
        accommodationRequests: false,
        bedAssignments: false,
        payments: false,
        permissions: false,
        saving: false
      },
      errors: {
        users: '',
        roles: '',
        dormitories: '',
        rooms: '',
        beds: '',
        accommodationRequests: '',
        bedAssignments: '',
        payments: '',
        permissions: ''
      },
      filters: { query: '', role: 'all', status: 'all', page: 1, pageSize: 10 },
      operationFilters: {
        requestQuery: '',
        requestStatus: 'all',
        assignmentQuery: '',
        assignmentStatus: 'all',
        dormitoryId: 'all'
      },
      paymentFilters: { query: '', status: 'all', due: 'all' },
      paymentAction: { status: '', transaction_ref: '', note: '' },
      selectedDormitoryId: '',
      selectedRoomId: '',
      dormitoryForm: { id: '', name: '', address: '', totalRoom: '', gender: '', currentOccupancy: '' },
      dialog: { open: false, type: '', subject: null },
      nationalIdReview: { image: null, loading: false, type: 'info', message: '' },
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
        await Promise.all([
          this.loadUsers(),
          this.loadRoles(),
          this.loadPermissions(),
          this.loadDormitories(),
          this.loadRooms(),
          this.loadBeds(),
          this.loadAccommodationRequests(),
          this.loadBedAssignments(),
          this.loadPayments()
        ]);
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
          this.dormitories = asArray(await window.SaraAPI.get(DORMITORY_ENDPOINT)).map(normalizeDormitory);
          if (!this.selectedDormitoryId && this.dormitories.length) {
            this.selectedDormitoryId = this.dormitories[0].id;
          }
          this.updateStats();
        } catch (error) {
          this.errors.dormitories = this.apiMessage(error);
        } finally {
          this.loading.dormitories = false;
        }
      },

      async loadRooms() {
        this.loading.rooms = true;
        this.errors.rooms = '';
        try {
          this.rooms = asArray(await window.SaraAPI.get(ROOM_ENDPOINT)).map(normalizeRoom);
          if (!this.selectedRoomId && this.roomsForSelectedDormitory().length) {
            this.selectedRoomId = this.roomsForSelectedDormitory()[0].id;
          }
        } catch (error) {
          this.errors.rooms = this.apiMessage(error);
        } finally {
          this.loading.rooms = false;
        }
      },

      async loadBeds() {
        this.loading.beds = true;
        this.errors.beds = '';
        try {
          this.beds = asArray(await window.SaraAPI.get(BED_ENDPOINT)).map(normalizeBed);
          this.updateStats();
        } catch (error) {
          this.errors.beds = this.apiMessage(error);
        } finally {
          this.loading.beds = false;
        }
      },

      async loadAccommodationRequests() {
        this.loading.accommodationRequests = true;
        this.errors.accommodationRequests = '';
        try {
          this.accommodationRequests = asArray(await window.SaraAPI.get(ACCOMMODATION_REQUEST_ENDPOINT)).map(normalizeAccommodationRequest);
          this.updateStats();
        } catch (error) {
          this.errors.accommodationRequests = this.apiMessage(error);
        } finally {
          this.loading.accommodationRequests = false;
        }
      },

      async loadBedAssignments() {
        this.loading.bedAssignments = true;
        this.errors.bedAssignments = '';
        try {
          this.bedAssignments = asArray(await window.SaraAPI.get(BED_ASSIGNMENT_ENDPOINT)).map(normalizeBedAssignment);
          this.updateStats();
        } catch (error) {
          this.errors.bedAssignments = this.apiMessage(error);
        } finally {
          this.loading.bedAssignments = false;
        }
      },

      async loadPayments() {
        this.loading.payments = true;
        this.errors.payments = '';
        try {
          this.payments = asArray(await window.SaraAPI.get(PAYMENT_ENDPOINT)).map(normalizePayment);
        } catch (error) {
          this.errors.payments = this.apiMessage(error);
        } finally {
          this.loading.payments = false;
        }
      },

      updateStats() {
        this.stats[0].value = this.toPersianNumber(this.users.length);
        this.stats[1].value = this.toPersianNumber(this.users.filter((item) => item.is_active !== false).length);
        this.stats[2].value = this.toPersianNumber(this.roles.length);
        this.stats[3].value = this.dormitories.length ? this.toPersianNumber(this.dormitories.length) : '—';
      },

      selectedDormitory() {
        return this.dormitories.find((item) => String(item.id) === String(this.selectedDormitoryId)) || null;
      },

      selectedRoom() {
        return this.rooms.find((item) => String(item.id) === String(this.selectedRoomId)) || null;
      },

      selectDormitory(dormitory) {
        if (!dormitory) return;
        this.selectedDormitoryId = dormitory.id;
        this.selectedRoomId = this.roomsForSelectedDormitory()[0]?.id || '';
      },

      startDormitoryCreate() {
        this.dormitoryForm = { id: '', name: '', address: '', totalRoom: '', gender: '', currentOccupancy: '' };
      },

      editDormitory(dormitory) {
        this.selectDormitory(dormitory);
        this.dormitoryForm = {
          id: dormitory.id || '',
          name: dormitory.name || '',
          address: dormitory.address || '',
          totalRoom: dormitory.total_rooms || dormitory.totalRoom || '',
          gender: dormitory.gender_type || dormitory.gender || '',
          currentOccupancy: dormitory.occupied_beds || dormitory.currentOccupancy || ''
        };
      },

      dormitoryPayload() {
        const totalRoom = Number(window.SaraUI?.toEnglishDigits?.(this.dormitoryForm.totalRoom || '0') || 0);
        const currentOccupancy = Number(window.SaraUI?.toEnglishDigits?.(this.dormitoryForm.currentOccupancy || '0') || 0);
        return {
          name: this.dormitoryForm.name,
          address: this.dormitoryForm.address || '',
          totalRoom,
          gender: this.dormitoryForm.gender || '',
          currentOccupancy
        };
      },

      async saveDormitory() {
        if (!this.dormitoryForm.name) {
          this.showAlert('danger', 'نام خوابگاه الزامی است.');
          return;
        }

        this.loading.saving = true;
        try {
          const payload = this.dormitoryPayload();
          const endpoint = this.dormitoryForm.id
            ? `${DORMITORY_ENDPOINT}${encodeURIComponent(this.dormitoryForm.id)}/`
            : DORMITORY_ENDPOINT;
          const response = this.dormitoryForm.id
            ? await window.SaraAPI.patch(endpoint, payload)
            : await window.SaraAPI.post(endpoint, payload);
          const saved = normalizeDormitory(unwrap(response, 'dormitory'), this.dormitories.length);
          const existingIndex = this.dormitories.findIndex((item) => String(item.id) === String(saved.id || this.dormitoryForm.id));
          if (existingIndex >= 0) this.dormitories.splice(existingIndex, 1, { ...this.dormitories[existingIndex], ...saved });
          else this.dormitories.unshift(saved);
          this.selectedDormitoryId = saved.id || this.selectedDormitoryId;
          this.startDormitoryCreate();
          this.updateStats();
          this.showAlert('success', response?.message || 'اطلاعات خوابگاه ثبت شد.');
        } catch (error) {
          this.showAlert('danger', this.apiMessage(error));
        } finally {
          this.loading.saving = false;
        }
      },

      roomDormitoryId(room) {
        return room?.dormitory_id || room?.dormitory?.id || room?.dormitory || '';
      },

      roomsForSelectedDormitory() {
        if (!this.selectedDormitoryId) return this.rooms;
        return this.rooms.filter((room) => String(this.roomDormitoryId(room)) === String(this.selectedDormitoryId));
      },

      bedsForRoom(roomId = this.selectedRoomId) {
        if (!roomId) return [];
        return this.beds.filter((bed) => String(bed.room_id) === String(roomId));
      },

      bedCountForDormitory(dormitoryId, status = '') {
        const roomIds = new Set(this.rooms.filter((room) => String(this.roomDormitoryId(room)) === String(dormitoryId)).map((room) => String(room.id)));
        return this.beds.filter((bed) => roomIds.has(String(bed.room_id)) && (!status || bed.status === status)).length;
      },

      matchesText(item, query, fields) {
        const needle = String(window.SaraUI?.toEnglishDigits?.(query || '') || query || '').toLowerCase().trim();
        if (!needle) return true;
        const haystack = fields.map((field) => String(item?.[field] || '')).join(' ');
        return String(window.SaraUI?.toEnglishDigits?.(haystack) || haystack).toLowerCase().includes(needle);
      },

      filteredAccommodationRequests() {
        return this.accommodationRequests.filter((request) => {
          const selectedFilterDormitory = this.dormitories.find((dormitory) => String(dormitory.id) === String(this.operationFilters.dormitoryId));
          const matchesStatus = this.operationFilters.requestStatus === 'all' || request.status === this.operationFilters.requestStatus;
          const matchesDormitory = this.operationFilters.dormitoryId === 'all' || String(request.requested_dormitory_id) === String(this.operationFilters.dormitoryId) || request.dormitory === selectedFilterDormitory?.name;
          return matchesStatus && matchesDormitory && this.matchesText(request, this.operationFilters.requestQuery, ['code', 'student_name', 'student_id', 'dormitory', 'semester']);
        });
      },

      filteredBedAssignments() {
        return this.bedAssignments.filter((assignment) => {
          const selectedFilterDormitory = this.dormitories.find((dormitory) => String(dormitory.id) === String(this.operationFilters.dormitoryId));
          const matchesStatus = this.operationFilters.assignmentStatus === 'all' || assignment.status === this.operationFilters.assignmentStatus;
          const matchesDormitory = this.operationFilters.dormitoryId === 'all' || assignment.dormitory === selectedFilterDormitory?.name;
          return matchesStatus && matchesDormitory && this.matchesText(assignment, this.operationFilters.assignmentQuery, ['student_name', 'dormitory', 'room', 'bed', 'request_id']);
        });
      },

      filteredPayments() {
        return this.payments.filter((payment) => {
          const matchesStatus = this.paymentFilters.status === 'all' || payment.status === this.paymentFilters.status;
          const dueState = this.paymentDueState(payment);
          const matchesDue = this.paymentFilters.due === 'all' || dueState === this.paymentFilters.due;
          return matchesStatus && matchesDue && this.matchesText(payment, this.paymentFilters.query, ['id', 'student_name', 'student_id', 'payment_type', 'transaction_ref', 'description']);
        });
      },

      paymentDueState(payment) {
        if (payment.status === 'paid') return 'paid';
        if (!payment.due_date || payment.due_date === '—') return 'unknown';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(payment.due_date);
        if (Number.isNaN(due.getTime())) return 'unknown';
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 7) return 'due-soon';
        return 'upcoming';
      },

      paymentDueLabel(payment) {
        return {
          paid: 'پرداخت شده',
          overdue: 'سررسید گذشته',
          'due-soon': 'نزدیک سررسید',
          upcoming: 'در مهلت',
          unknown: 'بدون سررسید'
        }[this.paymentDueState(payment)] || 'نامشخص';
      },

      paymentDueClass(payment) {
        return {
          paid: 'ss-status-badge ss-status-success',
          overdue: 'ss-status-badge ss-status-danger',
          'due-soon': 'ss-status-badge ss-status-warning',
          upcoming: 'ss-status-badge ss-status-info',
          unknown: 'ss-status-badge ss-status-muted'
        }[this.paymentDueState(payment)] || 'ss-status-badge ss-status-muted';
      },

      openPaymentDetail(payment) {
        this.paymentAction = {
          status: payment.status || 'unpaid',
          transaction_ref: payment.transaction_ref || '',
          note: ''
        };
        this.dialog = { open: true, type: 'payment-detail', subject: payment };
      },

      applyPaymentShellUpdate() {
        const payment = this.dialog.subject;
        if (!payment) return;
        payment.status = this.paymentAction.status || payment.status;
        payment.transaction_ref = this.paymentAction.transaction_ref || payment.transaction_ref;
        if (payment.status === 'paid' && !payment.paid_at) payment.paid_at = new Date().toISOString().slice(0, 10);
        this.paymentAction.note = 'وضعیت پرداخت در فرانت‌اند به‌روزرسانی شد؛ ثبت دائمی به endpoint پرداخت‌ها وابسته است.';
      },

      openPaymentStudent(payment) {
        const student = this.users.find((user) =>
          String(user.id || '') === String(payment.user_id || '')
          || String(user.student_id || '') === String(payment.student_id || '')
          || this.fullName(user) === payment.student_name
        );
        if (student) {
          this.openUserDetails(student);
          return;
        }
        this.showAlert('danger', 'دانشجوی مرتبط در فهرست کاربران بارگذاری‌شده پیدا نشد.');
      },

      statusBadgeClass(type, status) {
        const badge = window.SaraStatus?.get?.(type, status);
        return badge?.className || 'ss-status-badge ss-status-muted';
      },

      statusBadgeLabel(type, status) {
        const badge = window.SaraStatus?.get?.(type, status);
        return badge?.label || status || 'نامشخص';
      },

      computedReports() {
        const occupiedBeds = this.beds.filter((bed) => bed.status === 'occupied').length || this.dormitories.reduce((sum, dormitory) => sum + Number(dormitory.occupied_beds || 0), 0);
        const availableBeds = this.beds.filter((bed) => bed.status === 'available').length || this.dormitories.reduce((sum, dormitory) => sum + Number(dormitory.available_beds || 0), 0);
        const totalBeds = occupiedBeds + availableBeds;
        const occupancy = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : this.averageDormitoryOccupancy();
        const pending = this.accommodationRequests.filter((request) => request.status === 'pending').length;
        const approved = this.accommodationRequests.filter((request) => request.status === 'approved').length;
        const rejected = this.accommodationRequests.filter((request) => request.status === 'rejected').length;
        const assignedStudents = new Set(this.bedAssignments.filter((item) => ['active', 'assigned'].includes(String(item.status || '').toLowerCase())).map((item) => item.user_id || item.student_name || item.id)).size;

        return [
          { title: 'نرخ اشغال', value: totalBeds || occupancy ? `${this.toPersianNumber(occupancy || 0)}٪` : '—', note: `${this.toPersianNumber(occupiedBeds)} تخت اشغال از ${this.toPersianNumber(totalBeds)} تخت قابل محاسبه`, type: 'computed' },
          { title: 'تخت‌های آزاد', value: this.toPersianNumber(availableBeds), note: 'محاسبه از endpoint تخت‌ها یا ظرفیت خوابگاه', type: 'computed' },
          { title: 'درخواست‌های در انتظار', value: this.toPersianNumber(pending), note: 'از فهرست سراسری درخواست‌های اسکان', type: 'computed' },
          { title: 'تایید / رد شده', value: `${this.toPersianNumber(approved)} / ${this.toPersianNumber(rejected)}`, note: 'تفکیک وضعیت درخواست‌های اسکان', type: 'computed' },
          { title: 'دانشجویان تخصیص‌خورده', value: this.toPersianNumber(assignedStudents), note: 'بر پایه تاریخچه تخصیص تخت', type: 'computed' },
          { title: 'پرداخت‌ها، تعمیرات و خواندن اطلاعیه', value: 'وابسته به API', note: 'پس از تکمیل endpointهای گزارش قابل محاسبه است.', type: 'api' }
        ];
      },

      averageDormitoryOccupancy() {
        const values = this.dormitories.map((item) => Number(item.occupancy || 0)).filter((value) => value > 0);
        return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
      },

      openRequestDetail(request) {
        this.dialog = {
          open: true,
          type: 'generic-details',
          title: 'جزئیات درخواست اسکان',
          fields: [
            { label: 'کد درخواست', value: request.code || request.id },
            { label: 'دانشجو', value: request.student_name },
            { label: 'شماره دانشجویی', value: request.student_id },
            { label: 'خوابگاه', value: request.dormitory },
            { label: 'نیم‌سال', value: request.semester },
            { label: 'نوع اتاق', value: request.preferred_room_type },
            { label: 'وضعیت', value: this.statusBadgeLabel('accommodation', request.status) },
            { label: 'تاریخ', value: request.request_date },
            { label: 'یادداشت', value: request.notes || request.description }
          ]
        };
      },

      openAssignmentDetail(assignment) {
        this.dialog = {
          open: true,
          type: 'generic-details',
          title: 'جزئیات تخصیص تخت',
          fields: [
            { label: 'دانشجو', value: assignment.student_name },
            { label: 'درخواست', value: assignment.request_id },
            { label: 'خوابگاه', value: assignment.dormitory },
            { label: 'اتاق', value: assignment.room },
            { label: 'تخت', value: assignment.bed },
            { label: 'شروع', value: assignment.start_date },
            { label: 'پایان', value: assignment.end_date },
            { label: 'وضعیت', value: this.statusBadgeLabel('assignment', assignment.status) },
            { label: 'یادداشت', value: assignment.notes }
          ]
        };
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
        this.resetNationalIdReview();
        this.dialog = { open: true, type: 'details', subject: user };
      },

      handleNationalIdReviewImage(event) {
        this.nationalIdReview.image = event?.target?.files?.[0] || null;
        this.nationalIdReview.message = '';
      },

      resetNationalIdReview() {
        this.nationalIdReview = { image: null, loading: false, type: 'info', message: '' };
      },

      dialogNationalId() {
        const user = this.dialog.subject || {};
        const nationalId = user.national_id || user.nationalId || user.profile?.nationalId || '';
        return window.SaraUI?.toEnglishDigits?.(nationalId) || String(nationalId);
      },

      async verifyDialogNationalIdCard() {
        const nationalId = this.dialogNationalId();

        if (window.SaraAuth?.isDemoMode?.()) {
          this.showNationalIdReviewStatus('warning', 'در حالت نمایشی درخواست به سرویس تأیید کارت ملی ارسال نمی‌شود.');
          return;
        }

        if (!nationalId) {
          this.showNationalIdReviewStatus('warning', 'کد ملی کاربر برای بررسی کارت ملی در دسترس نیست.');
          return;
        }

        if (!this.nationalIdReview.image) {
          this.showNationalIdReviewStatus('warning', 'ابتدا تصویر کارت ملی را انتخاب کنید.');
          return;
        }

        const formData = new FormData();
        formData.append('id', nationalId);
        formData.append('image', this.nationalIdReview.image);

        this.nationalIdReview.loading = true;
        this.showNationalIdReviewStatus('info', 'در حال بررسی کارت ملی...');

        try {
          const response = await window.SaraAPI.post('/api/national-id/verify/', formData, {
            auth: false,
            retryOnUnauthorized: false,
            redirectOnExpired: false
          });
          const succeeded = response?.success !== false;
          this.showNationalIdReviewStatus(
            succeeded ? 'success' : 'warning',
            response?.log || response?.message || (succeeded ? 'کارت ملی تأیید شد.' : 'کد ملی با تصویر کارت تطبیق ندارد.')
          );
        } catch (error) {
          this.showNationalIdReviewStatus('danger', error.message || 'ارتباط با سرویس تأیید کارت ملی برقرار نشد.');
        } finally {
          this.nationalIdReview.loading = false;
        }
      },

      showNationalIdReviewStatus(type, message) {
        this.nationalIdReview = { ...this.nationalIdReview, type, message };
      },

      nationalIdReviewAlertClass() {
        return {
          success: 'alert-success',
          warning: 'alert-warning',
          danger: 'alert-danger',
          info: 'alert-info'
        }[this.nationalIdReview.type] || 'alert-info';
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
        this.resetNationalIdReview();
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
            const response = await window.SaraAPI.put(`${USER_ADMIN_UPDATE_ENDPOINT}/${encodeURIComponent(this.userForm.id)}/`, payload);
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
          const response = await window.SaraAPI.patch(`${USER_STATUS_ENDPOINT}/${encodeURIComponent(user.id)}/status/`, {
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
