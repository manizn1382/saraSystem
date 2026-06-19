/* SaraSystem API response adapters.
   Rendering decision for Section 10:
   - JSON endpoints are normalized here and rendered by Alpine controllers.
   - HTMX is kept for request triggering, form submission, and non-visual API events where the server returns JSON.
   - Large lists may arrive as arrays or paginated { results, count, next, previous, page, page_size } payloads.
   - Backend shape assumptions are intentionally centralized here so endpoint changes do not spread across pages.

   Expected endpoint families:
   /api/users/ -> User[]
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

  function accommodationRequest(item = {}, index = 0) {
    const user = item.user || item.student || {};
    const dormitory = item.requested_dormitory || item.dormitory || {};
    return {
      id: id(item.id, String(index + 1)),
      code: text(item.code || item.request_code || `REQ-${item.id || index + 1}`),
      user_id: id(user.id || item.user_id || item.student_id),
      student_name: fullName(user, item.student_name || 'دانشجو'),
      student_id: text(user.student_id || item.student_number || item.student_id, ''),
      semester: text(item.semester || item.term),
      dormitory: text(dormitory.name || item.requested_dormitory_name || item.dormitory_name || item.dormitory),
      requested_dormitory_id: id(dormitory.id || item.requested_dormitory_id || item.dormitory_id),
      preferred_room_type: roomType(item.preferred_room_type),
      preferred_room_type_value: text(item.preferred_room_type, ''),
      status: text(item.status, 'pending'),
      request_date: text(item.request_date || item.created_at),
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
      total_rooms: Number(item.total_rooms ?? item.rooms_count ?? 0),
      occupied_beds: Number(item.occupied_beds ?? 0),
      available_beds: Number(item.available_beds ?? 0),
      occupancy: Number(item.occupancy ?? item.occupancy_percent ?? 0)
    };
  }

  function room(item = {}, index = 0) {
    const dorm = item.dormitory || {};
    return {
      id: id(item.id, String(index + 1)),
      dormitory_id: id(dorm.id || item.dormitory_id),
      dormitory_name: text(dorm.name || item.dormitory_name),
      room_number: text(item.room_number || item.number),
      floor_number: text(item.floor_number || item.floor),
      capacity: text(item.capacity || 0),
      occupied: text(item.occupied || item.occupied_beds || 0),
      gender_type: text(item.gender_type, ''),
      status: text(item.status, 'active')
    };
  }

  function bed(item = {}, index = 0) {
    const roomData = item.room || {};
    return {
      id: id(item.id, String(index + 1)),
      room_id: id(roomData.id || item.room_id),
      bed_number: text(item.bed_number || item.number || index + 1),
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
      target: text(item.target_dormitory?.name || item.target_role?.name || item.target, 'عمومی'),
      target_role_id: id(item.target_role_id || item.target_role?.id),
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
