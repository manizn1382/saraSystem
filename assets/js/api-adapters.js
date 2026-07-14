/* SaraSystem API response adapters.
   Rendering decision for Section 10:
   - JSON endpoints are normalized here and rendered by Alpine controllers.
   - HTMX is kept for request triggering, form submission, and non-visual API events where the server returns JSON.
   - Large lists may arrive as arrays or paginated { results, count, next, previous, page, page_size } payloads.
   - Backend shape assumptions are intentionally centralized here so endpoint changes do not spread across pages.

   Expected endpoint families:
   /api/accounts/users/ -> User[]
   /api/dormitories/ -> Dormitory[]
   /api/rooms/ -> Room[]
   /api/beds/ -> Bed[]
   /api/accommodation-requests/ -> AccommodationRequest[]
   /api/bed-assignments/ -> BedAssignment[]
   /api/payments/ -> Payment[]
   /api/maintenance-requests/ -> MaintenanceRequest[]
   /api/announcements/ -> Announcement[]
*/
(function () {
  function text(value, fallback = '—') {
    return value === null || value === undefined || value === '' ? fallback : String(value);
  }

  function id(value, fallback = '') {
    return text(value, fallback);
  }

  function fullName(user, fallback = '—') {
    if (!user) return fallback;
    return text(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(), fallback);
  }

  function roomType(value) {
    return {
      single: 'تک‌نفره',
      double: 'دونفره',
      shared: 'چندنفره'
    }[value] || text(value);
  }

  function roomStatus(value) {
    const normalized = String(value || '').toLowerCase();
    return {
      available: 'active',
      full: 'inactive',
      closed: 'inactive'
    }[normalized] || text(value, 'active');
  }

  function accommodationRequest(item = {}, index = 0) {
    const user = item.user || item.student || {};
    const dormitory = item.requested_dormitory || item.requested_dorm || item.dormitory || {};
    const dormitoryId = dormitory.id || item.requested_dormitory_id || item.requested_dorm || item.dormitory_id;
    const dormitoryName = dormitory.name
      || item.requested_dormitory_name
      || item.dormitory_name
      || (typeof item.dormitory === 'string' ? item.dormitory : '')
      || (dormitoryId ? `خوابگاه ${dormitoryId}` : '');
    const preferredRoom = item.preferred_room_type || item.preferred_room;
    return {
      id: id(item.id, String(index + 1)),
      code: text(item.code || item.request_code || `REQ-${item.id || index + 1}`),
      user_id: id(user.id || item.user_id || item.student_id),
      student_name: fullName(user, item.student_name || (item.user_id ? `کاربر ${item.user_id}` : 'دانشجو')),
      student_id: text(user.student_id || item.student_number || item.student_id, ''),
      semester: text(item.semester || item.term),
      dormitory: text(dormitoryName),
      requested_dormitory_id: id(dormitoryId),
      preferred_room_type: roomType(preferredRoom),
      preferred_room_type_value: text(preferredRoom, ''),
      status: text(item.status, 'pending'),
      request_date: text(item.request_date || item.req_date || item.created_at),
      description: text(item.description || item.notes, ''),
      notes: text(item.notes || item.description, ''),
      previous_requests: text(item.previous_requests || item.previous_request_summary, ''),
      current_assignment: text(item.current_assignment || item.assignment_summary, ''),
      rejection_reason: text(item.rejection_reason || item.review_note, '')
    };
  }

  function dormitory(item = {}, index = 0) {
    return {
      id: id(item.id, String(index + 1)),
      name: text(item.name || item.title || `خوابگاه ${item.id || index + 1}`),
      address: text(item.address, ''),
      total_rooms: Number(item.total_rooms ?? item.rooms_count ?? item.totalRoom ?? 0),
      occupied_beds: Number(item.occupied_beds ?? 0),
      available_beds: Number(item.available_beds ?? item.available_capacity ?? 0),
      occupancy: Number(item.occupancy ?? item.occupancy_percent ?? item.occupancy_percentage ?? 0),
      gender_type: text(item.gender_type ?? item.gender, '')
    };
  }

  function room(item = {}, index = 0) {
    const dorm = item.dormitory || {};
    return {
      id: id(item.id, String(index + 1)),
      dormitory_id: id(dorm.id || item.dormitory_id || item.dormitory),
      dormitory_name: text(dorm.name || item.dormitory_name),
      room_number: text(item.room_number || item.roomNumber || item.number),
      floor_number: text(item.floor_number || item.floorNumber || item.floor),
      capacity: text(item.capacity || 0),
      occupied: text(item.occupied || item.occupied_beds || item.currentOccupancy || 0),
      gender_type: text(item.gender_type || item.gender, ''),
      status: roomStatus(item.status)
    };
  }

  function bed(item = {}, index = 0) {
    const roomData = item.room || {};
    return {
      id: id(item.id, String(index + 1)),
      room_id: id(roomData.id || item.room_id || item.room),
      bed_number: text(item.bed_number || item.bedNumber || item.number || index + 1),
      status: text(item.status, 'available'),
      description: text(item.description || item.notes, ''),
      occupant_name: fullName(item.occupant, item.occupant_name || '')
    };
  }

  function bedAssignment(item = {}, index = 0) {
    const user = item.user || item.student || {};
    const bedData = item.bed || {};
    const roomData = item.room || bedData.room || {};
    const dorm = item.dormitory || roomData.dormitory || {};
    return {
      id: id(item.id, String(index + 1)),
      user_id: id(user.id || item.user_id),
      bed_id: id(bedData.id || item.bed_id),
      student_name: fullName(user, item.student_name),
      dormitory: text(dorm.name || item.dormitory_name),
      room: text(roomData.room_number || item.room_number),
      bed: text(bedData.bed_number || item.bed_number),
      start_date: text(item.start_date),
      end_date: text(item.end_date, ''),
      status: text(item.status, 'active'),
      notes: text(item.notes, '')
    };
  }

  function payment(item = {}, index = 0) {
    return {
      id: id(item.id || item.reference || item.transaction_ref, `PAY-${index + 1}`),
      payment_type: text(item.payment_type || item.title || item.type, 'پرداخت خوابگاه'),
      amount: item.amount_display || window.SaraUI?.formatAmount?.(item.amount) || text(item.amount),
      due_date: text(item.due_date),
      paid_at: text(item.paid_at, ''),
      transaction_ref: text(item.transaction_ref || item.reference, ''),
      status: text(item.status, 'unpaid'),
      description: text(item.description || item.notes, '')
    };
  }

  function maintenanceRequest(item = {}, index = 0) {
    const roomData = item.room || {};
    const bedData = item.bed || {};
    return {
      id: id(item.id, `M-${index + 1}`),
      title: text(item.title, 'بدون عنوان'),
      description: text(item.description, ''),
      location: text(item.location || item.location_text || roomData.room_number || bedData.bed_number),
      priority: text(item.priority, 'medium'),
      status: text(item.status, 'pending'),
      assigned_to: fullName(item.assigned_to, item.assigned_to_name || item.assigned_to || ''),
      created_at: text(item.created_at || item.request_date)
    };
  }

  function announcement(item = {}, index = 0) {
    return {
      id: id(item.id, `A-${index + 1}`),
      title: text(item.title, 'بدون عنوان'),
      content: text(item.content || item.body, ''),
      created_at: text(item.created_at),
      target: text(item.target_dormitory?.name || item.target_dormitory_name || item.target_role?.name || item.target_role_name || item.target, 'عمومی'),
      target_role_id: id(item.target_role_id || item.target_role?.id || item.target_role),
      target_dormitory_id: id(item.target_dormitory_id || item.target_dormitory?.id),
      expires_at: text(item.expires_at, ''),
      is_active: item.is_active !== false,
      read: Boolean(item.read || item.is_read)
    };
  }

  function adaptList(data, adapter) {
    return (window.SaraAPI?.list?.(data) || []).map(adapter);
  }

  window.SaraAdapters = {
    fullName,
    roomType,
    adaptList,
    accommodationRequest,
    dormitory,
    room,
    bed,
    bedAssignment,
    payment,
    maintenanceRequest,
    announcement
  };
})();
