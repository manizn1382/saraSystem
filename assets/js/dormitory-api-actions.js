/* Persist dormitory-admin room and bed actions through the implemented API. */
(function () {
  const originalFactory = window.dormitoryAdmin;
  if (typeof originalFactory !== 'function') return;

  function apiRoomStatus(status) {
    return { active: 'available', inactive: 'closed', maintenance: 'maintenance' }[status] || status;
  }

  function upsert(items, item) {
    const index = items.findIndex((current) => String(current.id) === String(item.id));
    if (index === -1) items.push(item);
    else items.splice(index, 1, item);
  }

  function responseData(response) {
    return response?.data || response;
  }

  window.dormitoryAdmin = function () {
    const state = originalFactory();
    const originalInit = state.init;
    const originalUpdateRoomOccupancy = state.updateRoomOccupancy;

    state.init = function () {
      this.forms.room.dormitory_id = this.forms.room.dormitory_id || '';
      const result = originalInit.call(this);
      document.body.addEventListener('htmx:beforeRequest', (event) => {
        const requestPath = event.detail?.path || event.detail?.pathInfo?.requestPath || '';
        if (!/\/api\/(accommodation-requests|bed-assignments|announcements)\//.test(requestPath)) return;

        event.preventDefault();
        const formName = this.formName(event.detail?.elt?.id);
        const message = 'این قابلیت تا زمان استقرار سرویس مربوطه در دسترس نیست.';
        if (formName) {
          this.forms[formName].loading = false;
          this.forms[formName].success = false;
          this.forms[formName].message = message;
        } else {
          this.showAlert('warning', message);
        }
      });
      return result;
    };

    state.openRoomModal = function (room = null) {
      const fallbackDormitory = this.dormitories[0];
      Object.assign(this.forms.room, room
        ? { ...room, dormitory_id: room.dormitory_id || '' }
        : {
            id: '',
            dormitory_id: fallbackDormitory?.id || '',
            room_number: '',
            floor_number: '',
            capacity: '4',
            occupied: '0',
            status: 'active'
          });
      bootstrap.Modal.getOrCreateInstance(document.getElementById('roomModal')).show();
    };

    state.saveRoom = async function () {
      const form = this.forms.room;
      if (!form.dormitory_id || !form.room_number || !form.floor_number || !form.capacity) {
        this.showAlert('warning', 'خوابگاه، شماره اتاق، طبقه و ظرفیت را وارد کنید.');
        return;
      }

      if (this.isDemoMode()) {
        const dormitory = this.dormitories.find((item) => String(item.id) === String(form.dormitory_id));
        const room = { ...form, dormitory_name: dormitory?.name || '' };
        room.id = room.id || `room-${Date.now()}`;
        upsert(this.rooms, room);
        this.selectedRoomId = room.id;
        this.updateStats();
        this.closeModal('roomModal');
        this.showAlert('success', 'اطلاعات اتاق در نمای آزمایشی ثبت شد.');
        return;
      }

      try {
        const payload = {
          dormitory: Number(form.dormitory_id),
          roomNumber: Number(this.toEnglishDigits(form.room_number)),
          floorNumber: Number(this.toEnglishDigits(form.floor_number)),
          capacity: Number(this.toEnglishDigits(form.capacity)),
          status: apiRoomStatus(form.status)
        };
        const endpoint = form.id
          ? `/api/rooms/updateRoom/${form.id}/`
          : '/api/rooms/createRoom/';
        const response = form.id
          ? await window.SaraAPI.patch(endpoint, payload)
          : await window.SaraAPI.post(endpoint, payload);
        const saved = window.SaraAdapters.room(responseData(response));
        upsert(this.rooms, saved);
        this.selectedRoomId = saved.id;
        this.updateStats();
        this.closeModal('roomModal');
        this.showAlert('success', 'اطلاعات اتاق ذخیره شد.');
      } catch (error) {
        this.showAlert('danger', error.message || 'ذخیره اتاق ناموفق بود.');
      }
    };

    state.persistRoomStatus = async function (room, status) {
      if (this.isDemoMode()) {
        room.status = status;
        this.updateStats();
        return;
      }
      try {
        const response = await window.SaraAPI.patch(`/api/rooms/updateRoom/${room.id}/`, {
          status: apiRoomStatus(status)
        });
        upsert(this.rooms, window.SaraAdapters.room(responseData(response)));
        this.updateStats();
      } catch (error) {
        this.showAlert('danger', error.message || 'به‌روزرسانی وضعیت اتاق ناموفق بود.');
      }
    };

    state.disableRoom = function (room) {
      return this.persistRoomStatus(room, 'inactive');
    };

    state.cycleRoomStatus = function (room) {
      const statuses = ['active', 'maintenance', 'inactive'];
      const nextStatus = statuses[(statuses.indexOf(room.status) + 1) % statuses.length];
      return this.persistRoomStatus(room, nextStatus);
    };

    state.saveBed = async function () {
      const form = this.forms.bed;
      if (!form.room_id || !form.bed_number) {
        this.showAlert('warning', 'اتاق و شماره تخت را وارد کنید.');
        return;
      }

      if (this.isDemoMode()) {
        const bed = { ...form, id: form.id || `bed-${Date.now()}` };
        upsert(this.beds, bed);
        originalUpdateRoomOccupancy.call(this, bed.room_id);
        this.updateStats();
        this.closeModal('bedModal');
        this.showAlert('success', 'اطلاعات تخت در نمای آزمایشی ثبت شد.');
        return;
      }

      try {
        const payload = {
          room: Number(form.room_id),
          bedNumber: this.toEnglishDigits(form.bed_number),
          status: form.status,
          description: form.description || ''
        };
        const endpoint = form.id
          ? `/api/beds/updateBed/${form.id}/`
          : '/api/beds/createBed/';
        const response = form.id
          ? await window.SaraAPI.patch(endpoint, payload)
          : await window.SaraAPI.post(endpoint, payload);
        const saved = window.SaraAdapters.bed(responseData(response));
        upsert(this.beds, saved);
        this.selectedRoomId = saved.room_id;
        this.closeModal('bedModal');
        this.showAlert('success', 'اطلاعات تخت ذخیره شد.');
        this.refreshDormitoryResources();
      } catch (error) {
        this.showAlert('danger', error.message || 'ذخیره تخت ناموفق بود.');
      }
    };

    state.cycleBedStatus = async function (bed) {
      const statuses = ['available', 'occupied', 'maintenance', 'reserved'];
      const nextStatus = statuses[(statuses.indexOf(bed.status) + 1) % statuses.length];
      if (this.isDemoMode()) {
        bed.status = nextStatus;
        originalUpdateRoomOccupancy.call(this, bed.room_id);
        this.updateStats();
        return;
      }
      try {
        const response = await window.SaraAPI.patch(`/api/beds/updateBed/${bed.id}/`, {
          status: nextStatus
        });
        upsert(this.beds, window.SaraAdapters.bed(responseData(response)));
        this.refreshDormitoryResources();
      } catch (error) {
        this.showAlert('danger', error.message || 'به‌روزرسانی وضعیت تخت ناموفق بود.');
      }
    };

    state.refreshDormitoryResources = async function () {
      try {
        const [dormitories, rooms, beds] = await Promise.all([
          window.SaraAPI.get('/api/dormitory/listAll/'),
          window.SaraAPI.get('/api/rooms/listAllRoom/'),
          window.SaraAPI.get('/api/beds/listAll/')
        ]);
        this.dormitories = window.SaraAdapters.adaptList(dormitories, window.SaraAdapters.dormitory);
        this.rooms = window.SaraAdapters.adaptList(rooms, window.SaraAdapters.room);
        this.beds = window.SaraAdapters.adaptList(beds, window.SaraAdapters.bed);
        this.updateStats();
      } catch (error) {
        this.showAlert('danger', error.message || 'داده‌های خوابگاه به‌روزرسانی نشد.');
      }
    };

    return state;
  };
})();
