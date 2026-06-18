/* SaraSystem status badge helper. */
(function () {
  const maps = {
    accommodation: {
      pending: ['ss-status-warning', 'در انتظار بررسی'],
      approved: ['ss-status-success', 'تأیید شده'],
      rejected: ['ss-status-danger', 'رد شده'],
      assigned: ['ss-status-info', 'تخصیص داده شده'],
      cancelled: ['ss-status-muted', 'لغو شده']
    },
    assignment: {
      active: ['ss-status-success', 'فعال'],
      inactive: ['ss-status-muted', 'غیرفعال'],
      ended: ['ss-status-muted', 'پایان یافته'],
      cancelled: ['ss-status-danger', 'لغو شده']
    },
    payment: {
      paid: ['ss-status-success', 'پرداخت شده'],
      unpaid: ['ss-status-warning', 'پرداخت نشده'],
      overdue: ['ss-status-danger', 'معوق'],
      pending: ['ss-status-info', 'در انتظار'],
      cancelled: ['ss-status-muted', 'لغو شده']
    },
    maintenance: {
      pending: ['ss-status-warning', 'در انتظار بررسی'],
      assigned: ['ss-status-info', 'ارجاع شده'],
      in_progress: ['ss-status-info', 'در حال انجام'],
      progress: ['ss-status-info', 'در حال انجام'],
      resolved: ['ss-status-success', 'حل شده'],
      rejected: ['ss-status-danger', 'رد شده'],
      cancelled: ['ss-status-muted', 'لغو شده']
    },
    priority: {
      low: ['ss-status-muted', 'کم'],
      medium: ['ss-status-info', 'متوسط'],
      high: ['ss-status-warning', 'زیاد'],
      urgent: ['ss-status-danger', 'فوری']
    },
    read: {
      read: ['ss-status-muted', 'خوانده شده'],
      unread: ['ss-status-info', 'جدید']
    },
    capacity: {
      available: ['ss-status-success', 'آزاد'],
      occupied: ['ss-status-info', 'اشغال'],
      reserved: ['ss-status-info', 'رزرو'],
      full: ['ss-status-danger', 'تکمیل'],
      partial: ['ss-status-warning', 'دارای ظرفیت'],
      maintenance: ['ss-status-warning', 'تعمیرات'],
      inactive: ['ss-status-muted', 'غیرفعال']
    }
  };

  function get(type, status) {
    const key = String(status || '').toLowerCase().trim();
    const fallback = ['ss-status-muted', status || 'نامشخص'];
    const match = maps[type]?.[key] || fallback;
    return {
      className: `ss-status-badge ${match[0]}`,
      label: match[1],
      value: key
    };
  }

  function render(type, status) {
    const badge = get(type, status);
    return `<span class="${badge.className}">${badge.label}</span>`;
  }

  window.SaraStatus = { maps, get, render };
})();
