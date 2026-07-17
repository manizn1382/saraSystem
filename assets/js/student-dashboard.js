function studentDashboard() {
      return {
        sidebarOpen: false,
        profileOpen: false,
        activeSection: "#overview",
        alert: {
          type: "info",
          message: ""
        },

        navItems: [
          { href: "#overview", icon: "📊", label: "داشبورد", badge: "", roles: ["student", "resident"] },
          { href: "#accommodation", icon: "🏠", label: "درخواست اسکان", badge: "", roles: ["student", "resident"], permissions: ["accommodation.request.view"] },
          { href: "#assignment", icon: "🛏️", label: "وضعیت اسکان", badge: "", roles: ["student", "resident"], permissions: ["bed_assignment.view_own"] },
          { href: "#payments", icon: "💳", label: "پرداخت‌ها", badge: "", roles: ["student", "resident"], permissions: ["payment.view_own"] },
          { href: "#maintenance", icon: "🛠️", label: "تعمیرات", badge: "", roles: ["student", "resident"], permissions: ["maintenance.request.create"] },
          { href: "#announcements", icon: "📣", label: "اطلاعیه‌ها", badge: "جدید", roles: ["student", "resident"], permissions: ["announcement.view"] },
          { href: "#profile", icon: "👤", label: "پروفایل", badge: "", roles: ["student", "resident"] }
        ],

        user: {
          first_name: "دانشجوی",
          last_name: "نمونه",
          student_id: "402123456",
          national_id: "0012345678",
          phone: "09123456789",
          email: "student@university.ac.ir",
          roles: ["student"],
          is_active: true
        },

        summary: {
          request_status: "pending",
          request_title: "در انتظار بررسی",
          unpaid_count: "۲ مورد",
          unpaid_total: "۳٬۵۰۰٬۰۰۰ تومان",
          unread_announcements: "۲"
        },

        assignment: {
          dormitory_id: "1",
          room_id: "212",
          bed_id: "3",
          dormitory: "خوابگاه یک",
          room: "۲۱۲",
          bed: "۳",
          start_date: "۱۴۰۴/۰۷/۰۱",
          end_date: "۱۴۰۵/۰۴/۳۰",
          status: "active",
          notes: "تخصیص فعال برای نیم‌سال جاری"
        },

        dormitories: [
          { id: "1", name: "خوابگاه یک" },
          { id: "2", name: "خوابگاه دو" },
          { id: "3", name: "خوابگاه سه" }
        ],
        rooms: [],
        beds: [],

        detail: {
          type: "",
          title: "",
          item: {}
        },

        resourceLoading: {
          accommodationRequests: true,
          dormitories: true,
          rooms: true,
          beds: true,
          assignment: true,
          payments: true,
          maintenanceRequests: true,
          announcements: true
        },

        resourceStates: {
          accommodationRequests: window.SaraUI?.createRequestState?.() || {
            loading: false,
            loaded: false,
            error: "",
            status: null,
            retryable: false,
            pagination: { count: null, next: null, previous: null, page: 1, pageSize: null, totalPages: 1 }
          },
          dormitories: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false },
          rooms: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false },
          beds: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false },
          assignment: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false },
          payments: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false },
          maintenanceRequests: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false },
          announcements: window.SaraUI?.createRequestState?.() || { loading: false, loaded: false, error: "", status: null, retryable: false }
        },
        announcementReadsSyncing: false,

        tableState: {
          accommodationRequests: { query: "", sort: { key: "request_date", direction: "desc" }, page: 1, pageSize: 5 },
          payments: { query: "", sort: { key: "due_date", direction: "desc" }, page: 1, pageSize: 6 },
          maintenanceRequests: { query: "", sort: { key: "created_at", direction: "desc" }, page: 1, pageSize: 6 },
          announcements: { query: "", sort: { key: "created_at", direction: "desc" }, page: 1, pageSize: 6 }
        },

        accommodationRequests: [
          {
            id: "۱",
            semester: "۱۴۰۴-۱۴۰۵ نیم‌سال اول",
            dormitory: "خوابگاه یک",
            preferred_room_type: "چندنفره",
            status: "pending",
            description: "درخواست در صف بررسی مسئول خوابگاه قرار دارد."
          },
          {
            id: "۲",
            semester: "۱۴۰۳-۱۴۰۴ نیم‌سال دوم",
            dormitory: "خوابگاه یک",
            preferred_room_type: "دونفره",
            status: "assigned",
            description: "درخواست تایید شده و تخصیص تخت انجام شده است."
          }
        ],

        payments: [
          {
            id: "PAY-1001",
            payment_type: "اجاره نیم‌سال",
            amount: "۲٬۵۰۰٬۰۰۰ تومان",
            due_date: "۱۴۰۴/۰۷/۱۵",
            status: "unpaid",
            description: "قسط اول"
          },
          {
            id: "PAY-1002",
            payment_type: "هزینه خدمات",
            amount: "۱٬۰۰۰٬۰۰۰ تومان",
            due_date: "۱۴۰۴/۰۸/۰۱",
            status: "pending",
            description: "در انتظار تایید"
          },
          {
            id: "PAY-0991",
            payment_type: "اجاره نیم‌سال قبل",
            amount: "۲٬۲۰۰٬۰۰۰ تومان",
            due_date: "۱۴۰۳/۱۲/۲۰",
            status: "paid",
            description: "پرداخت شده"
          }
        ],

        maintenanceRequests: [
          {
            id: "M-401",
            title: "خرابی چراغ اتاق",
            description: "چراغ اصلی اتاق روشن نمی‌شود.",
            location: "اتاق ۲۱۲، تخت ۳",
            priority: "medium",
            status: "progress",
            created_at: "۱۴۰۴/۰۷/۰۶"
          },
          {
            id: "M-389",
            title: "نشتی شیر آب",
            description: "شیر آب سرویس مشترک نشتی دارد.",
            location: "طبقه ۲",
            priority: "high",
            status: "pending",
            created_at: "۱۴۰۴/۰۷/۰۴"
          }
        ],

        announcements: [
          {
            id: "A-21",
            title: "زمان‌بندی پرداخت نیم‌سال جدید",
            content: "دانشجویان تا تاریخ اعلام‌شده فرصت دارند وضعیت پرداخت خود را از پنل بررسی کنند.",
            created_at: "۱۴۰۴/۰۷/۰۵",
            read: false
          },
          {
            id: "A-19",
            title: "تعمیرات دوره‌ای طبقه دوم",
            content: "تعمیرات دوره‌ای در طبقه دوم از ساعت ۹ تا ۱۲ انجام می‌شود.",
            created_at: "۱۴۰۴/۰۷/۰۳",
            read: false
          },
          {
            id: "A-12",
            title: "راهنمای ثبت درخواست تعمیرات",
            content: "برای ثبت درخواست تعمیرات، عنوان دقیق، محل و اولویت را انتخاب کنید.",
            created_at: "۱۴۰۴/۰۶/۲۸",
            read: true
          }
        ],

        forms: {
          accommodation: {
            loading: false,
            success: false,
            message: "",
            editingId: "",
            data: {
              requested_dormitory_id: "",
              preferred_room_type: "",
              semester: "",
              request_date: "",
              description: ""
            },
            errors: {
              requested_dormitory_id: "",
              preferred_room_type: "",
              semester: ""
            }
          },
          maintenance: {
            loading: false,
            success: false,
            message: "",
            data: {
              title: "",
              priority: "",
              room_id: "",
              bed_id: "",
              dorm_id: "",
              description: ""
            },
            errors: {
              title: "",
              priority: "",
              room_id: "",
              bed_id: "",
              dorm_id: "",
              description: ""
            }
          }
        },

        init() {
          this.clearDemoDataUnlessEnabled();
          this.loadStoredUser();
          this.updateUnreadBadge();
          this.watchCurrentSection();
          this.loadAccommodationRequests({ silent: true });

          document.body.addEventListener("htmx:configRequest", (event) => {
            const token = this.getAccessToken();
            const path = event.detail?.path
              || event.detail?.pathInfo?.requestPath
              || event.detail?.requestConfig?.path
              || "";
            const method = event.detail?.verb
              || event.detail?.requestConfig?.verb
              || "GET";

            event.detail.headers = event.detail.headers || {};
            event.detail.headers["Accept"] = "application/json";

            if (token && (window.SaraAPI?.shouldAttachAuthHeader?.(path, method) ?? true)) {
              event.detail.headers["Authorization"] = `Bearer ${token}`;
            }
          });

          document.body.addEventListener("htmx:beforeRequest", (event) => {
            this.handleBeforeRequest(event);
          });

          document.body.addEventListener("htmx:afterRequest", (event) => {
            this.handleAfterRequest(event);
          });

          document.body.addEventListener("htmx:sendError", (event) => {
            this.handleRequestFailure(event, "ارتباط با سرور برقرار نشد. داده‌های نمونه همچنان نمایش داده می‌شوند.");
          });

          document.body.addEventListener("htmx:timeout", (event) => {
            this.handleRequestFailure(event, "زمان پاسخ‌گویی سرور به پایان رسید. لطفاً دوباره تلاش کنید.");
          });

          document.getElementById("maintenanceModal")?.addEventListener("show.bs.modal", () => {
            this.prefillMaintenanceFormFromAssignment();
          });
        },

        loadStoredUser() {
          const parsedUser = window.SaraAuth?.getStoredUser?.();

          if (parsedUser) {
            this.user = { ...this.user, ...parsedUser };
            const status = this.accountStatus();
            if (status.message) this.showAlert("warning", status.message);
          }
        },

        getAccessToken() {
          return window.SaraAuth?.getAccessToken?.() || "";
        },

        isDemoMode() {
          return window.SaraAuth?.isDemoMode?.() === true;
        },

        clearDemoDataUnlessEnabled() {
          if (this.isDemoMode()) {
            Object.keys(this.resourceLoading).forEach((key) => {
              this.resourceLoading[key] = false;
            });
            return;
          }

          this.summary = {
            request_status: "unknown",
            request_title: "در حال دریافت",
            unpaid_count: "۰ مورد",
            unpaid_total: "۰ تومان",
            unread_announcements: "۰"
          };
          this.assignment = { dormitory_id: "", room_id: "", bed_id: "", dormitory: "", room: "", bed: "", start_date: "", end_date: "", status: "pending", notes: "" };
          this.dormitories = [];
          this.rooms = [];
          this.beds = [];
          this.accommodationRequests = [];
          this.payments = [];
          this.maintenanceRequests = [];
          this.announcements = [];
        },

        isResourceLoading(resource) {
          return Boolean(this.resourceStates?.[resource]?.loading || this.resourceLoading?.[resource]);
        },

        resourceError(resource) {
          return this.resourceStates?.[resource]?.error || "";
        },

        canRetryResource(resource) {
          return Boolean(this.resourceStates?.[resource]?.retryable || this.resourceError(resource));
        },

        retryResource(resource) {
          return this.loadResource(resource);
        },

        setResourceLoading(resource) {
          this.resourceLoading[resource] = true;
          if (this.resourceStates?.[resource]) window.SaraUI?.setLoading?.(this.resourceStates[resource]);
        },

        setResourceSuccess(resource, data) {
          this.resourceLoading[resource] = false;
          if (this.resourceStates?.[resource]) window.SaraUI?.setSuccess?.(this.resourceStates[resource], data);
        },

        setResourceError(resource, error) {
          this.resourceLoading[resource] = false;
          if (this.resourceStates?.[resource]) window.SaraUI?.setError?.(this.resourceStates[resource], error);
        },

        async loadAccommodationRequests(options = {}) {
          return this.loadResource("accommodationRequests", options);
        },

        accommodationListEndpoint() {
          const userId = this.user?.id || this.user?.user_id;
          return userId
            ? window.SaraAPI.withQuery("/api/accommodation-requests/history/", { user_id: userId })
            : "/api/accommodation-requests/history/";
        },

        accommodationPayload(data = {}) {
          return {
            requested_dorm: data.requested_dormitory_id || data.requested_dorm || "",
            preferred_room: data.preferred_room_type || data.preferred_room || "",
            semester: data.semester || "",
            req_date: data.request_date || data.req_date || "",
            description: data.description || ""
          };
        },

        async loadResource(resource, options = {}) {
          if (this.isDemoMode()) return;

          const endpoints = {
            accommodationRequests: this.accommodationListEndpoint(),
            dormitories: "/api/dormitories/with-rooms/",
            rooms: "/api/rooms/",
            beds: "/api/beds/",
            assignment: "/api/bed-assignments/",
            payments: "/api/payments/",
            maintenanceRequests: "/api/maintenance-requests/",
            announcements: "/api/announcements/"
          };
          const endpoint = endpoints[resource];
          if (!endpoint) return;

          this.setResourceLoading(resource);

          try {
            const data = await window.SaraAPI.get(endpoint);
            this.applyResourceData(resource, data);
            this.setResourceSuccess(resource, data);
          } catch (error) {
            this.setResourceError(resource, error);
            if (!options.silent) this.showAlert("danger", error.message || "دریافت داده‌ها ناموفق بود.");
          }
        },

        fullName() {
          const firstName = this.user.first_name || this.user.firstName || "";
          const lastName = this.user.last_name || this.user.lastName || "";
          return `${firstName} ${lastName}`.trim() || "دانشجو";
        },

        userInitials() {
          const firstName = this.user.first_name || this.user.firstName || "د";
          const lastName = this.user.last_name || this.user.lastName || "ن";
          return `${firstName.charAt(0)}${lastName.charAt(0)}`;
        },

        activeLabel() {
          return this.visibleNavItems().find((item) => item.href === this.activeSection)?.label || "داشبورد";
        },

        visibleNavItems() {
          return window.SaraNavigation?.filter?.(this.navItems, this.user) || this.navItems;
        },

        accountStatus() {
          return window.SaraAuth?.getAccountStatus?.(this.user) || { label: "نامشخص", className: "badge-neutral", message: "" };
        },

        accountPath() {
          return window.SaraAuth?.isDemoMode?.() ? "../account.html?demo=student" : "../account.html";
        },

        watchCurrentSection() {
          const sections = document.querySelectorAll("section[id]");

          if (!("IntersectionObserver" in window)) return;

          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.activeSection = `#${entry.target.id}`;
              }
            });
          }, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });

          sections.forEach((section) => observer.observe(section));
        },

        handleBeforeRequest(event) {
          const resource = event?.detail?.elt?.dataset?.resource;
          if (resource) this.setResourceLoading(resource);

          const formId = event?.detail?.elt?.id;

          if (formId === "accommodationForm") {
            this.forms.accommodation.loading = true;
            this.forms.accommodation.message = "";
          }

          if (formId === "maintenanceForm") {
            this.forms.maintenance.loading = true;
            this.forms.maintenance.message = "";
          }
        },

        handleAfterRequest(event) {
          const xhr = event.detail.xhr;
          const elt = event.detail.elt;
          const data = this.parseJson(xhr.responseText);
          if (elt?.dataset?.resource) this.setResourceSuccess(elt.dataset.resource, data);

          if (xhr.status >= 200 && xhr.status < 300) {
            if (elt?.dataset?.resource) {
              this.applyResourceData(elt.dataset.resource, data);
              return;
            }

            if (elt?.id === "accommodationForm") {
              this.handleAccommodationSuccess(data);
              return;
            }

            if (elt?.id === "maintenanceForm") {
              this.handleMaintenanceSuccess(data);
              return;
            }
          }

          this.handleRequestError(elt, xhr.status, data);
        },

        handleRequestFailure(event, message) {
          const elt = event?.detail?.elt;
          if (elt?.dataset?.resource) {
            this.setResourceError(elt.dataset.resource, {
              message,
              status: 0,
              data: null,
              retryable: true
            });
          }

          if (elt?.id === "accommodationForm") {
            this.forms.accommodation.loading = false;
            this.forms.accommodation.success = false;
            this.forms.accommodation.message = message;
            return;
          }

          if (elt?.id === "maintenanceForm") {
            this.forms.maintenance.loading = false;
            this.forms.maintenance.success = false;
            this.forms.maintenance.message = message;
            return;
          }

          this.showAlert("danger", message);
        },

        applyAccommodationRequests(data) {
          const currentUserId = String(this.user?.id || this.user?.user_id || "");
          this.accommodationRequests = (window.SaraAdapters
            ? window.SaraAdapters.adaptList(data, window.SaraAdapters.accommodationRequest).map((request) => ({
              ...request,
              display_id: this.toPersianNumber(request.id),
              dormitory: this.selectedDormitoryName(request.requested_dormitory_id, request.dormitory),
              preferred_room_type_value: request.preferred_room_type_value || request.preferred_room_type
            }))
            : this.asList(data).map((item, index) => ({
              id: String(item.id || index + 1),
              display_id: this.toPersianNumber(item.id || index + 1),
              semester: item.semester || "—",
              user_id: String(item.user_id || item.user?.id || ""),
              requested_dormitory_id: item.requested_dormitory?.id || item.requested_dormitory_id || item.requested_dorm || "",
              dormitory: this.selectedDormitoryName(
                item.requested_dormitory?.id || item.requested_dormitory_id || item.requested_dorm || "",
                item.requested_dormitory?.name || item.requested_dorm?.name || item.dormitory || item.requested_dormitory_name || ""
              ),
              preferred_room_type: this.roomTypeText(item.preferred_room_type || item.preferred_room),
              preferred_room_type_value: item.preferred_room_type || item.preferred_room || "",
              status: item.status || "pending",
              request_date: item.request_date || item.req_date || item.created_at || "—",
              rejection_reason: item.rejection_reason || item.review_note || "",
              description: item.description || item.review_note || ""
            }))).filter((request) => !currentUserId || !request.user_id || String(request.user_id) === currentUserId);

          const latest = this.accommodationRequests[0];
          if (latest) {
            this.summary.request_status = latest.status;
            this.summary.request_title = this.statusText(latest.status);
          } else {
            this.summary.request_status = "unknown";
            this.summary.request_title = "بدون درخواست";
          }
        },

        applyDormitoryOptions(data) {
          const source = Array.isArray(data?.dormitories) ? data.dormitories : this.asList(data);
          const roomMap = new Map(this.rooms.map((room) => [String(room.id), room]));
          const bedMap = new Map(this.beds.map((bed) => [String(bed.id), bed]));

          this.dormitories = source
            .map((item, index) => this.normalizeDormitoryOption(item, index))
            .filter((dormitory) => dormitory.id);

          source.forEach((dormitory, dormitoryIndex) => {
            const normalizedDormitory = this.normalizeDormitoryOption(dormitory, dormitoryIndex);
            const rooms = dormitory.rooms || dormitory.room_set || dormitory.roomList || [];

            this.asList(rooms).forEach((room, roomIndex) => {
              const normalizedRoom = this.normalizeRoomOption({
                ...room,
                dormitory: room.dormitory || { id: normalizedDormitory.id, name: normalizedDormitory.name },
                dormitory_id: room.dormitory_id || room.dormitory || normalizedDormitory.id,
                dormitory_name: room.dormitory_name || normalizedDormitory.name
              }, roomIndex);
              if (normalizedRoom.id) roomMap.set(String(normalizedRoom.id), { ...roomMap.get(String(normalizedRoom.id)), ...normalizedRoom });

              const beds = room.beds || room.bed_set || room.bedList || [];
              this.asList(beds).forEach((bed, bedIndex) => {
                const normalizedBed = this.normalizeBedOption({
                  ...bed,
                  room: bed.room || { id: normalizedRoom.id, room_number: normalizedRoom.room_number },
                  room_id: bed.room_id || bed.room || normalizedRoom.id
                }, bedIndex);
                if (normalizedBed.id) bedMap.set(String(normalizedBed.id), { ...bedMap.get(String(normalizedBed.id)), ...normalizedBed });
              });
            });
          });

          this.rooms = Array.from(roomMap.values()).filter((room) => room.id);
          this.beds = Array.from(bedMap.values()).filter((bed) => bed.id);
          this.ensureCurrentAssignmentOptions();
        },

        normalizeDormitoryOption(item = {}, index = 0) {
          const adapted = window.SaraAdapters?.dormitory?.(item, index) || {};
          const id = adapted.id || item.id || item.pk || item.dormitory_id || "";
          return {
            ...item,
            ...adapted,
            id: String(id),
            name: adapted.name || item.name || item.title || (id ? `خوابگاه ${this.toPersianNumber(id)}` : ""),
            gender_type: adapted.gender_type || item.gender_type || item.gender || "",
            capacity: adapted.capacity || item.capacity || item.total_capacity || item.totalRoom || ""
          };
        },

        normalizeRoomOption(item = {}, index = 0) {
          const adapted = window.SaraAdapters?.room?.(item, index) || {};
          const dormitory = item.dormitory && typeof item.dormitory === "object" ? item.dormitory : {};
          const dormitoryId = adapted.dormitory_id || item.dormitory_id || dormitory.id || item.dormitory || item.dorm || "";
          const id = adapted.id || item.id || item.pk || item.room_id || "";
          return {
            ...item,
            ...adapted,
            id: String(id),
            dormitory_id: String(dormitoryId || ""),
            dormitory_name: adapted.dormitory_name || item.dormitory_name || dormitory.name || this.selectedDormitoryName(dormitoryId, ""),
            room_number: adapted.room_number || item.room_number || item.roomNumber || item.number || id,
            floor_number: adapted.floor_number || item.floor_number || item.floorNumber || item.floor || "",
            capacity: adapted.capacity || item.capacity || "",
            occupied: adapted.occupied || item.occupied || item.currentOccupancy || item.occupied_beds || "",
            status: adapted.status || item.status || "active"
          };
        },

        normalizeBedOption(item = {}, index = 0) {
          const adapted = window.SaraAdapters?.bed?.(item, index) || {};
          const room = item.room && typeof item.room === "object" ? item.room : {};
          const roomId = adapted.room_id || item.room_id || room.id || item.room || "";
          const id = adapted.id || item.id || item.pk || item.bed_id || "";
          return {
            ...item,
            ...adapted,
            id: String(id),
            room_id: String(roomId || ""),
            bed_number: adapted.bed_number || item.bed_number || item.bedNumber || item.number || id,
            status: adapted.status || item.status || "available",
            description: adapted.description || item.description || item.notes || ""
          };
        },

        ensureCurrentAssignmentOptions() {
          const assignment = this.assignment || {};
          if (assignment.dormitory_id && !this.dormitories.some((item) => String(item.id) === String(assignment.dormitory_id))) {
            this.dormitories.push({
              id: String(assignment.dormitory_id),
              name: assignment.dormitory || `خوابگاه ${this.toPersianNumber(assignment.dormitory_id)}`
            });
          }

          if (assignment.room_id && !this.rooms.some((item) => String(item.id) === String(assignment.room_id))) {
            this.rooms.push({
              id: String(assignment.room_id),
              dormitory_id: String(assignment.dormitory_id || ""),
              dormitory_name: assignment.dormitory || this.selectedDormitoryName(assignment.dormitory_id, ""),
              room_number: assignment.room || assignment.room_id,
              status: "active"
            });
          }

          if (assignment.bed_id && !this.beds.some((item) => String(item.id) === String(assignment.bed_id))) {
            this.beds.push({
              id: String(assignment.bed_id),
              room_id: String(assignment.room_id || ""),
              bed_number: assignment.bed || assignment.bed_id,
              status: "assigned"
            });
          }
        },

        queryResource(resource, items, keys) {
          const state = this.tableState[resource];
          return window.SaraUI?.searchList?.(items, state?.query, keys) || items;
        },

        sortedResource(resource, items) {
          return window.SaraUI?.sortList?.(items, this.tableState[resource]?.sort) || items;
        },

        pagedResource(resource, items) {
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

        tableItems(resource, items, keys) {
          return this.pagedResource(
            resource,
            this.sortedResource(resource, this.queryResource(resource, items, keys))
          ).items;
        },

        tablePage(resource, items, keys) {
          return this.pagedResource(
            resource,
            this.sortedResource(resource, this.queryResource(resource, items, keys))
          );
        },

        setTableSort(resource, key) {
          this.tableState[resource].sort = window.SaraUI?.toggleSort?.(this.tableState[resource].sort, key) || { key, direction: "asc" };
          this.tableState[resource].page = 1;
        },

        resetTablePage(resource) {
          if (this.tableState[resource]) this.tableState[resource].page = 1;
        },

        sortIcon(resource, key) {
          const sort = this.tableState[resource]?.sort;
          if (sort?.key !== key) return "↕";
          return sort.direction === "asc" ? "↑" : "↓";
        },

        accommodationList() {
          return this.tableItems("accommodationRequests", this.accommodationRequests, ["id", "semester", "dormitory", "preferred_room_type", "status", "request_date", "description"]);
        },

        accommodationPage() {
          return this.tablePage("accommodationRequests", this.accommodationRequests, ["id", "semester", "dormitory", "preferred_room_type", "status", "request_date", "description"]);
        },

        paymentList() {
          return this.tableItems("payments", this.payments, ["id", "payment_type", "amount", "due_date", "status", "description", "transaction_ref"]);
        },

        paymentPage() {
          return this.tablePage("payments", this.payments, ["id", "payment_type", "amount", "due_date", "status", "description", "transaction_ref"]);
        },

        maintenanceList() {
          return this.tableItems("maintenanceRequests", this.maintenanceRequests, ["id", "title", "description", "location", "priority", "status", "created_at"]);
        },

        maintenancePage() {
          return this.tablePage("maintenanceRequests", this.maintenanceRequests, ["id", "title", "description", "location", "priority", "status", "created_at"]);
        },

        announcementList() {
          return this.tableItems("announcements", this.announcements, ["id", "title", "content", "target", "created_at"]);
        },

        announcementPage() {
          return this.tablePage("announcements", this.announcements, ["id", "title", "content", "target", "created_at"]);
        },

        applyResourceData(resource, data) {
          const list = this.asList(data);

          if (resource === "me" && data && !Array.isArray(data)) {
            this.user = { ...this.user, ...data };
            window.SaraAuth?.updateStoredUser?.(this.user);
            const status = this.accountStatus();
            if (status.message) this.showAlert("warning", status.message);
            return;
          }

          if (resource === "accommodationRequests") {
            this.applyAccommodationRequests(data);
            return;
          }

          if (resource === "dormitories") {
            this.applyDormitoryOptions(data);
            return;
          }

          if (resource === "rooms") {
            this.rooms = (window.SaraAdapters
              ? window.SaraAdapters.adaptList(data, window.SaraAdapters.room)
              : list.map((item, index) => this.normalizeRoomOption(item, index)))
              .map((room, index) => this.normalizeRoomOption(room, index))
              .filter((room) => room.id);
            this.ensureCurrentAssignmentOptions();
            return;
          }

          if (resource === "beds") {
            this.beds = (window.SaraAdapters
              ? window.SaraAdapters.adaptList(data, window.SaraAdapters.bed)
              : list.map((item, index) => this.normalizeBedOption(item, index)))
              .map((bed, index) => this.normalizeBedOption(bed, index))
              .filter((bed) => bed.id);
            this.ensureCurrentAssignmentOptions();
            return;
          }

          if (resource === "assignment") {
            const assignment = Array.isArray(list) ? list[0] : data;
            if (assignment) {
              const room = assignment.room || assignment.bed?.room || {};
              const bed = assignment.bed || {};
              const dormitory = assignment.dormitory || room.dormitory || assignment.dorm || {};
              const roomId = room.id || assignment.room_id || (typeof assignment.room === "string" || typeof assignment.room === "number" ? assignment.room : "");
              const bedId = bed.id || assignment.bed_id || (typeof assignment.bed === "string" || typeof assignment.bed === "number" ? assignment.bed : "");
              const dormitoryId = dormitory.id || assignment.dormitory_id || assignment.dorm_id || (typeof assignment.dormitory === "string" || typeof assignment.dormitory === "number" ? assignment.dormitory : "");
              this.assignment = {
                id: assignment.id || "—",
                dormitory_id: dormitoryId,
                room_id: roomId,
                bed_id: bedId,
                dormitory: dormitory.name || assignment.dormitory_name || "—",
                room: this.toPersianNumber(room.room_number || assignment.room_number || roomId || ""),
                bed: this.toPersianNumber(bed.bed_number || assignment.bed_number || bedId || ""),
                start_date: assignment.start_date || "—",
                end_date: assignment.end_date || "—",
                status: assignment.status || "active",
                notes: assignment.notes || "",
                history: assignment.history || assignment.assignments || []
              };
              this.ensureCurrentAssignmentOptions();
            }
            return;
          }

          if (resource === "payments") {
            this.payments = window.SaraAdapters
              ? window.SaraAdapters.adaptList(data, window.SaraAdapters.payment)
              : list.map((item) => ({
                id: item.transaction_ref || item.id || "—",
                payment_type: item.payment_type || "—",
                amount: this.formatAmount(item.amount),
                due_date: item.due_date || "—",
                status: item.status || "unpaid",
                transaction_ref: item.transaction_ref || item.reference || "",
                paid_at: item.paid_at || item.payment_date || "",
                assignment: item.bed_assignment?.id || item.bed_assignment_id || "",
                description: item.description || ""
              }));
            this.updatePaymentSummary();
            return;
          }

          if (resource === "maintenanceRequests") {
            this.maintenanceRequests = window.SaraAdapters
              ? window.SaraAdapters.adaptList(data, window.SaraAdapters.maintenanceRequest)
              : list.map((item) => ({
                id: item.id || "—",
                title: item.title || "بدون عنوان",
                description: item.description || "",
                location: item.location || `اتاق ${this.toPersianNumber(item.room?.room_number || item.room_id || "—")}`,
                priority: item.priority || "medium",
                status: item.status || "pending",
                created_at: item.created_at || "—",
                updated_at: item.updated_at || "",
                comments: item.comments || item.history || []
              }));
            return;
          }

          if (resource === "announcements") {
            this.announcements = window.SaraAdapters
              ? window.SaraAdapters.adaptList(data, window.SaraAdapters.announcement)
              : list.map((item) => ({
                id: item.id || "—",
                title: item.title || "بدون عنوان",
                content: item.content || "",
                created_at: item.created_at || "—",
                target: item.target_dormitory?.name || item.target_dormitory_name || item.target_role?.name || item.target_role_name || item.target || "عمومی",
                expires_at: item.expires_at || "",
                read: Boolean(item.read || item.is_read || item.read_at)
              }));
            this.updateUnreadBadge();
            this.syncAnnouncementReads();
          }
        },

        async syncAnnouncementReads() {
          if (this.isDemoMode() || this.announcementReadsSyncing || !this.announcements.length) return;

          this.announcementReadsSyncing = true;
          try {
            const data = await window.SaraAPI.get("/api/announcements/reads/me/");
            const reads = this.asList(data);
            const readIds = new Set(reads.map((item) => String(
              item.announcement?.id || item.announcement_id || item.announcement || ""
            )).filter(Boolean));

            if (!readIds.size) return;

            this.announcements = this.announcements.map((announcement) => (
              readIds.has(String(announcement.id))
                ? { ...announcement, read: true }
                : announcement
            ));
            this.updateUnreadBadge();
          } catch {
            // Read-state sync is secondary to loading the announcement list.
          } finally {
            this.announcementReadsSyncing = false;
          }
        },

        handleRequestError(elt, status, data) {
          const message = this.serverMessage(status, data);

          if (elt?.dataset?.resource) {
            this.setResourceError(elt.dataset.resource, {
              message,
              status,
              data,
              retryable: [408, 429, 500, 502, 503, 504].includes(Number(status))
            });
            this.showAlert("danger", message);
            return;
          }

          if (elt?.id === "accommodationForm") {
            this.forms.accommodation.loading = false;
            this.forms.accommodation.success = false;
            this.applyFormErrors("accommodation", data);
            this.forms.accommodation.message = message;
            return;
          }

          if (elt?.id === "maintenanceForm") {
            this.forms.maintenance.loading = false;
            this.forms.maintenance.success = false;
            this.applyFormErrors("maintenance", data);
            this.forms.maintenance.message = message;
            return;
          }

          this.showAlert("danger", message);
        },

        handleAccommodationSuccess(data) {
          this.forms.accommodation.loading = false;
          this.forms.accommodation.success = true;
          this.forms.accommodation.message = data?.message || "درخواست اسکان با موفقیت ثبت شد.";
          this.showAlert("success", "درخواست اسکان ثبت شد و پس از بررسی وضعیت آن بروزرسانی می‌شود.");

          const saved = data?.data || data || {};
          const newRequest = {
            id: String(saved.id || data?.id || this.accommodationRequests.length + 1),
            display_id: this.toPersianNumber(saved.id || data?.id || this.accommodationRequests.length + 1),
            semester: this.forms.accommodation.data.semester,
            requested_dormitory_id: this.forms.accommodation.data.requested_dormitory_id,
            dormitory: this.selectedDormitoryName(this.forms.accommodation.data.requested_dormitory_id),
            preferred_room_type: this.roomTypeText(this.forms.accommodation.data.preferred_room_type),
            preferred_room_type_value: this.forms.accommodation.data.preferred_room_type,
            status: saved.status || data?.request_status || "pending",
            request_date: this.forms.accommodation.data.request_date || "امروز",
            description: this.forms.accommodation.data.description
          };

          this.accommodationRequests = [newRequest, ...this.accommodationRequests];
          this.summary.request_status = newRequest.status;
          this.summary.request_title = this.statusText(newRequest.status);

          window.setTimeout(() => {
            this.closeModal("accommodationModal");
            this.resetAccommodationForm();
          }, 900);
        },

        handleMaintenanceSuccess(data) {
          const responseData = data?.data || data || {};
          this.forms.maintenance.loading = false;
          this.forms.maintenance.success = true;
          this.forms.maintenance.message = data?.message || "درخواست تعمیرات با موفقیت ثبت شد.";
          this.showAlert("success", "درخواست تعمیرات ثبت شد و توسط واحد پشتیبانی بررسی می‌شود.");

          const newTicket = {
            id: data?.id || `M-${this.maintenanceRequests.length + 1}`,
            title: this.forms.maintenance.data.title,
            description: this.forms.maintenance.data.description,
            location: `اتاق ${this.toPersianNumber(this.forms.maintenance.data.room_id)}${this.forms.maintenance.data.bed_id ? `، تخت ${this.toPersianNumber(this.forms.maintenance.data.bed_id)}` : ""}`,
            priority: this.forms.maintenance.data.priority,
            dorm_id: this.forms.maintenance.data.dorm_id,
            room_id: this.forms.maintenance.data.room_id,
            bed_id: this.forms.maintenance.data.bed_id,
            status: responseData.status || "pending",
            created_at: responseData.created_at || responseData.createAt || "امروز"
          };

          this.maintenanceRequests = [newTicket, ...this.maintenanceRequests];

          window.setTimeout(() => {
            this.closeModal("maintenanceModal");
            this.resetMaintenanceForm();
          }, 900);
        },

        validateAccommodation(event) {
          this.clearFormErrors("accommodation");
          const form = this.forms.accommodation;

          if (!form.data.requested_dormitory_id) {
            form.errors.requested_dormitory_id = "انتخاب خوابگاه الزامی است.";
          }

          if (!form.data.preferred_room_type) {
            form.errors.preferred_room_type = "انتخاب نوع اتاق الزامی است.";
          }

          if (!form.data.semester) {
            form.errors.semester = "وارد کردن نیم‌سال الزامی است.";
          }

          if (this.hasFormErrors("accommodation")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.markFormInvalid("accommodation", "لطفاً خطاهای فرم را اصلاح کنید و دوباره درخواست را ارسال کنید.");
            return;
          }

          event.preventDefault();
          event.stopImmediatePropagation();

          if (form.editingId) {
            this.saveAccommodationEdit();
            return;
          }

          this.submitAccommodationRequest();
        },

        validateMaintenance(event) {
          this.clearFormErrors("maintenance");
          this.prefillMaintenanceFormFromAssignment();
          this.syncMaintenanceLocationFromBed();
          const form = this.forms.maintenance;

          if (!form.data.title) {
            form.errors.title = "وارد کردن عنوان مشکل الزامی است.";
          }

          if (!form.data.priority) {
            form.errors.priority = "انتخاب اولویت الزامی است.";
          }

          if (!form.data.room_id) {
            form.errors.room_id = "انتخاب اتاق الزامی است.";
          }

          if (!form.data.bed_id) {
            form.errors.bed_id = "انتخاب تخت الزامی است.";
          }

          if (!form.data.dorm_id) {
            form.errors.dorm_id = "شناسه خوابگاه از تخصیص فعال قابل تشخیص نیست.";
            form.message = form.errors.dorm_id;
          }

          if (!form.data.description) {
            form.errors.description = "شرح مشکل الزامی است.";
          }

          if (this.hasFormErrors("maintenance")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.markFormInvalid("maintenance", "لطفاً خطاهای فرم را اصلاح کنید و دوباره درخواست را ارسال کنید.");
          }
        },

        clearFormErrors(formName) {
          Object.keys(this.forms[formName].errors).forEach((key) => {
            this.forms[formName].errors[key] = "";
          });
          this.forms[formName].message = "";
        },

        hasFormErrors(formName) {
          return Object.values(this.forms[formName].errors).some(Boolean);
        },

        markFormInvalid(formName, message) {
          const form = this.forms[formName];
          if (!form) return;
          form.loading = false;
          form.success = false;
          form.message = message || "لطفاً خطاهای فرم را اصلاح کنید و دوباره ارسال کنید.";
        },

        applyFormErrors(formName, data) {
          const errors = this.forms[formName].errors;
          const fieldMap = formName === "accommodation"
            ? {
                requested_dorm: "requested_dormitory_id",
                requested_dormitory_id: "requested_dormitory_id",
                preferred_room: "preferred_room_type",
                preferred_room_type: "preferred_room_type",
                semester: "semester"
              }
            : {
                room: "room_id",
                room_id: "room_id",
                bed: "bed_id",
                bed_id: "bed_id",
                dorm: "dorm_id",
                dorm_id: "dorm_id",
                dormitory_id: "dorm_id",
                title: "title",
                priority: "priority",
                description: "description"
              };

          Object.entries(fieldMap).forEach(([apiField, formField]) => {
            if (errors[formField] !== undefined && data?.[apiField]) {
              errors[formField] = this.normalizeError(data[apiField]);
            }
          });

          Object.keys(errors).forEach((key) => {
            if (data?.[key]) errors[key] = this.normalizeError(data[key]);
          });
        },

        resetAccommodationForm() {
          this.forms.accommodation.data = {
            requested_dormitory_id: "",
            preferred_room_type: "",
            semester: "",
            request_date: "",
            description: ""
          };
          this.forms.accommodation.loading = false;
          this.forms.accommodation.message = "";
          this.forms.accommodation.success = false;
          this.forms.accommodation.editingId = "";
          this.clearFormErrors("accommodation");
        },

        resetMaintenanceForm() {
          this.forms.maintenance.data = {
            title: "",
            priority: "",
            room_id: "",
            bed_id: "",
            dorm_id: "",
            description: ""
          };
          this.forms.maintenance.loading = false;
          this.forms.maintenance.message = "";
          this.forms.maintenance.success = false;
          this.clearFormErrors("maintenance");
        },

        prefillMaintenanceFormFromAssignment() {
          const data = this.forms.maintenance.data;
          if (!data.room_id) data.room_id = this.assignment.room_id || "";
          if (!data.bed_id) data.bed_id = this.assignment.bed_id || "";
          if (!data.dorm_id) data.dorm_id = this.assignment.dormitory_id || this.assignment.dorm_id || "";
          this.syncMaintenanceLocationFromBed();
        },

        closeModal(id) {
          const element = document.getElementById(id);
          const instance = bootstrap.Modal.getInstance(element);

          if (instance) {
            instance.hide();
          }
        },

        openDetail(type, title, item) {
          this.detail = { type, title, item: item || {} };
          const modal = new bootstrap.Modal(document.getElementById("studentDetailModal"));
          modal.show();
        },

        openAccommodationDetail(request) {
          this.openDetail("accommodation", "جزئیات درخواست اسکان", request);
        },

        openPaymentDetail(payment) {
          this.openDetail("payment", "جزئیات پرداخت", payment);
        },

        openMaintenanceDetail(ticket) {
          this.openDetail("maintenance", "جزئیات درخواست تعمیرات", ticket);
        },

        openAnnouncementDetail(announcement) {
          this.openDetail("announcement", announcement.title || "جزئیات اطلاعیه", announcement);
        },

        canModifyRequest(request) {
          return request?.status === "pending";
        },

        editAccommodationRequest(request) {
          if (!this.canModifyRequest(request)) return;
          this.forms.accommodation.editingId = request.id;
          this.forms.accommodation.data = {
            requested_dormitory_id: request.requested_dormitory_id || "",
            preferred_room_type: request.preferred_room_type_value || "",
            semester: request.semester || "",
            request_date: request.request_date || "",
            description: request.description || ""
          };
          this.forms.accommodation.message = "";
          this.forms.accommodation.success = false;
          new bootstrap.Modal(document.getElementById("accommodationModal")).show();
        },

        async submitAccommodationRequest() {
          const form = this.forms.accommodation;
          form.loading = true;
          form.message = "";

          try {
            const payload = this.accommodationPayload(form.data);
            let data = { data: payload };

            if (!window.SaraAuth?.isDemoMode?.()) {
              data = await window.SaraAPI.post("/api/accommodation-requests/", payload);
            }

            this.handleAccommodationSuccess(data);
          } catch (error) {
            form.success = false;
            this.applyFormErrors("accommodation", error?.data || {});
            form.message = error.message || "ثبت درخواست اسکان ناموفق بود.";
          } finally {
            form.loading = false;
          }
        },

        async saveAccommodationEdit() {
          const form = this.forms.accommodation;
          form.loading = true;
          form.message = "";

          try {
            const payload = this.accommodationPayload(form.data);
            if (!window.SaraAuth?.isDemoMode?.()) {
              await window.SaraAPI.put(`/api/accommodation-requests/${encodeURIComponent(form.editingId)}/`, payload);
            }

            this.accommodationRequests = this.accommodationRequests.map((request) => {
              if (request.id !== form.editingId) return request;
              return {
                ...request,
                semester: form.data.semester,
                requested_dormitory_id: form.data.requested_dormitory_id,
                dormitory: this.selectedDormitoryName(form.data.requested_dormitory_id),
                preferred_room_type: this.roomTypeText(form.data.preferred_room_type),
                preferred_room_type_value: form.data.preferred_room_type,
                request_date: form.data.request_date,
                description: form.data.description
              };
            });

            form.success = true;
            form.message = "درخواست اسکان به‌روزرسانی شد.";
            this.showAlert("success", "ویرایش درخواست اسکان ثبت شد.");
            window.setTimeout(() => {
              this.closeModal("accommodationModal");
              this.resetAccommodationForm();
            }, 700);
          } catch (error) {
            form.success = false;
            form.message = error.message || "ویرایش درخواست اسکان ناموفق بود.";
          } finally {
            form.loading = false;
          }
        },

        async cancelAccommodationRequest(request) {
          if (!this.canModifyRequest(request)) return;

          try {
            if (!window.SaraAuth?.isDemoMode?.()) {
              await window.SaraAPI.put(`/api/accommodation-requests/${encodeURIComponent(request.id)}/`, { status: "cancelled" });
            }
            request.status = "cancelled";
            request.description = request.description || "درخواست توسط دانشجو لغو شد.";
            this.summary.request_status = "cancelled";
            this.summary.request_title = this.statusText("cancelled");
            this.showAlert("success", "درخواست اسکان لغو شد.");
          } catch (error) {
            this.showAlert("danger", error.message || "لغو درخواست اسکان ناموفق بود.");
          }
        },

        detailRows() {
          const item = this.detail.item || {};
          const maps = {
            accommodation: [
              ["شناسه", item.display_id || item.id, true],
              ["نیم‌سال", item.semester],
              ["خوابگاه ترجیحی", item.dormitory],
              ["نوع اتاق", item.preferred_room_type],
              ["وضعیت", this.statusText(item.status)],
              ["تاریخ درخواست", item.request_date],
              ["دلیل رد/یادداشت", item.rejection_reason],
              ["توضیحات", item.description]
            ],
            payment: [
              ["شناسه", item.id, true],
              ["نوع پرداخت", item.payment_type],
              ["مبلغ", item.amount],
              ["سررسید", item.due_date],
              ["وضعیت", this.paymentStatusText(item.status)],
              ["رسید/مرجع تراکنش", item.transaction_ref, true],
              ["تاریخ پرداخت", item.paid_at],
              ["تخصیص مرتبط", item.assignment, true],
              ["توضیحات", item.description]
            ],
            maintenance: [
              ["شناسه", item.id, true],
              ["عنوان", item.title],
              ["مکان", item.location],
              ["اولویت", this.priorityText(item.priority)],
              ["وضعیت", this.statusText(item.status)],
              ["تاریخ ثبت", item.created_at],
              ["آخرین بروزرسانی", item.updated_at],
              ["شرح", item.description],
              ["تاریخچه/یادداشت‌ها", this.historyText(item.comments)]
            ]
          };
          return (maps[this.detail.type] || []).map(([label, value, ltr]) => ({ label, value, ltr: Boolean(ltr) }));
        },

        historyText(items) {
          if (!Array.isArray(items) || items.length === 0) return "";
          return items.map((item) => item.note || item.comment || item.status || String(item)).join(" | ");
        },

        async markAnnouncementRead(announcement) {
          if (!announcement || announcement.read) return;
          const previous = announcement.read;
          announcement.read = true;
          this.updateUnreadBadge();

          try {
            if (!window.SaraAuth?.isDemoMode?.()) {
              const data = await window.SaraAPI.post(`/api/announcements/${announcement.id}/read/`, {});
              announcement.read_at = data?.read_at || announcement.read_at || "";
            }
            this.showAlert("success", "اطلاعیه به عنوان خوانده‌شده علامت‌گذاری شد.");
          } catch (error) {
            announcement.read = previous;
            this.updateUnreadBadge();
            this.showAlert("danger", error.message || "ثبت وضعیت خوانده‌شده ناموفق بود.");
          }
        },

        updateUnreadBadge() {
          const unreadCount = this.announcements.filter((announcement) => !announcement.read).length;
          const persianCount = this.toPersianNumber(unreadCount);
          this.summary.unread_announcements = persianCount;

          this.navItems = this.navItems.map((item) => {
            if (item.href !== "#announcements") return item;
            return { ...item, badge: unreadCount > 0 ? persianCount : "" };
          });
        },

        updatePaymentSummary() {
          const unpaidPayments = this.payments.filter((payment) => ["unpaid", "pending"].includes(payment.status));
          this.summary.unpaid_count = `${this.toPersianNumber(unpaidPayments.length)} مورد`;

          if (unpaidPayments.length === 0) {
            this.summary.unpaid_total = "۰ تومان";
          }
        },

        selectedDormitoryName(value, fallback = "بدون ترجیح") {
          const dormitory = this.dormitories.find((item) => String(item.id) === String(value));
          if (dormitory?.name) return dormitory.name;
          if (fallback && !["—", "بدون ترجیح"].includes(String(fallback))) return fallback;
          return value ? `خوابگاه ${this.toPersianNumber(value)}` : fallback;
        },

        roomOptions() {
          this.ensureCurrentAssignmentOptions();
          return [...this.rooms].sort((a, b) => this.roomOptionLabel(a).localeCompare(this.roomOptionLabel(b), "fa", { numeric: true, sensitivity: "base" }));
        },

        bedOptionsForMaintenance() {
          this.ensureCurrentAssignmentOptions();
          const roomId = this.forms.maintenance.data.room_id;
          const beds = roomId
            ? this.beds.filter((bed) => String(bed.room_id) === String(roomId))
            : this.beds;
          return [...beds].sort((a, b) => this.bedOptionLabel(a).localeCompare(this.bedOptionLabel(b), "fa", { numeric: true, sensitivity: "base" }));
        },

        roomOptionLabel(room = {}) {
          const dormitory = room.dormitory_name || this.selectedDormitoryName(room.dormitory_id, "");
          const roomNumber = room.room_number || room.number || room.id || "—";
          return `${dormitory ? `${dormitory} - ` : ""}اتاق ${this.toPersianNumber(roomNumber)}`;
        },

        bedOptionLabel(bed = {}) {
          const room = this.rooms.find((item) => String(item.id) === String(bed.room_id));
          const bedNumber = bed.bed_number || bed.number || bed.id || "—";
          const roomLabel = room ? `${this.roomOptionLabel(room)} - ` : "";
          return `${roomLabel}تخت ${this.toPersianNumber(bedNumber)}`;
        },

        syncMaintenanceLocationFromRoom() {
          const data = this.forms.maintenance.data;
          const room = this.rooms.find((item) => String(item.id) === String(data.room_id));
          if (room?.dormitory_id) data.dorm_id = room.dormitory_id;
          if (data.bed_id && !this.bedOptionsForMaintenance().some((bed) => String(bed.id) === String(data.bed_id))) {
            data.bed_id = "";
          }
        },

        syncMaintenanceLocationFromBed() {
          const data = this.forms.maintenance.data;
          const bed = this.beds.find((item) => String(item.id) === String(data.bed_id));
          if (bed?.room_id) data.room_id = bed.room_id;
          this.syncMaintenanceLocationFromRoom();
        },

        roomTypeText(value) {
          const labels = {
            single: "تک‌نفره",
            double: "دونفره",
            shared: "چندنفره"
          };
          return labels[value] || value || "—";
        },

        statusText(status) {
          const labels = {
            pending: "در انتظار بررسی",
            approved: "تایید شده",
            rejected: "رد شده",
            assigned: "تخصیص داده شده",
            cancelled: "لغو شده",
            active: "فعال",
            inactive: "غیرفعال",
            progress: "در حال رسیدگی",
            resolved: "حل شده",
            paid: "پرداخت شده",
            unpaid: "پرداخت نشده",
            read: "خوانده شده",
            unread: "خوانده نشده"
          };
          return labels[status] || status || "نامشخص";
        },

        statusBadgeClass(status) {
          const classes = {
            active: "badge-active",
            approved: "badge-approved",
            assigned: "badge-assigned",
            pending: "badge-pending",
            cancelled: "badge-inactive",
            progress: "badge-progress",
            resolved: "badge-active",
            rejected: "badge-rejected",
            inactive: "badge-inactive",
            paid: "badge-paid",
            unpaid: "badge-unpaid",
            read: "badge-read",
            unread: "badge-unread"
          };
          return classes[status] || "badge-neutral";
        },

        paymentStatusText(status) {
          const labels = {
            paid: "پرداخت شده",
            unpaid: "پرداخت نشده",
            pending: "در انتظار تایید",
            overdue: "سررسید گذشته",
            cancelled: "لغو شده"
          };
          return labels[status] || status || "نامشخص";
        },

        paymentBadgeClass(status) {
          const classes = {
            paid: "badge-paid",
            unpaid: "badge-unpaid",
            pending: "badge-pending",
            overdue: "badge-urgent",
            cancelled: "badge-inactive"
          };
          return classes[status] || "badge-neutral";
        },

        priorityText(priority) {
          const labels = {
            low: "کم",
            medium: "متوسط",
            high: "زیاد",
            urgent: "فوری"
          };
          return labels[priority] || priority || "نامشخص";
        },

        priorityBadgeClass(priority) {
          const classes = {
            low: "badge-low",
            medium: "badge-medium",
            high: "badge-high",
            urgent: "badge-urgent"
          };
          return classes[priority] || "badge-neutral";
        },

        serverMessage(status, data) {
          return window.SaraUI?.apiErrorMessage?.(status, data) || "عملیات ناموفق بود. لطفاً دوباره تلاش کنید.";
        },

        asList(data) {
          return window.SaraUI?.asList?.(data) || [];
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

        formatAmount(value) {
          return window.SaraUI?.formatAmount?.(value, "تومان") || "—";
        },

        toPersianNumber(value) {
          return window.SaraUI?.toPersianNumber?.(value) || String(value);
        },

        clearAlert() {
          this.alert.message = "";
        },

        showAlert(type, message) {
          this.alert.type = type;
          this.alert.message = message;
        },

        logout() {
          window.SaraAuth?.logout?.("../login.html");
        }
      };
    }
