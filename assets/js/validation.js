/* SaraSystem front-end validation helpers. Final validation belongs to the API. */
(function () {
  function required(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  function email(value) {
    return !required(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function same(a, b) {
    return String(a || '') === String(b || '');
  }

  function collect(data, rules) {
    return Object.entries(rules).reduce((errors, [field, checks]) => {
      const message = checks.map((check) => check(data[field], data)).find(Boolean);
      if (message) errors[field] = message;
      return errors;
    }, {});
  }

  const rules = {
    login: (data) => collect(data, {
      username: [(value) => (required(value) ? '' : 'نام کاربری، ایمیل یا شماره دانشجویی الزامی است.')],
      password: [(value) => (required(value) ? '' : 'رمز عبور الزامی است.')]
    }),
    register: (data) => collect(data, {
      first_name: [(value) => (required(value) ? '' : 'نام الزامی است.')],
      last_name: [(value) => (required(value) ? '' : 'نام خانوادگی الزامی است.')],
      national_id: [(value) => (required(value) ? '' : 'کد ملی الزامی است.')],
      student_id: [(value) => (required(value) ? '' : 'شماره دانشجویی الزامی است.')],
      email: [
        (value) => (required(value) ? '' : 'ایمیل الزامی است.'),
        (value) => (email(value) ? '' : 'فرمت ایمیل معتبر نیست.')
      ],
      gender: [(value) => (required(value) ? '' : 'جنسیت الزامی است.')],
      password: [(value) => (required(value) ? '' : 'رمز عبور الزامی است.')],
      password_confirm: [(value, data) => (same(value, data.password) ? '' : 'تکرار رمز عبور با رمز عبور یکسان نیست.')]
    }),
    accommodationRequest: (data) => collect(data, {
      semester: [(value) => (required(value) ? '' : 'نیم‌سال الزامی است.')],
      preferred_room_type: [(value) => (required(value) ? '' : 'نوع اتاق ترجیحی الزامی است.')]
    }),
    bedAssignment: (data) => collect(data, {
      request_id: [(value) => (required(value) ? '' : 'انتخاب درخواست الزامی است.')],
      bed_id: [(value) => (required(value) ? '' : 'انتخاب تخت الزامی است.')],
      start_date: [(value) => (required(value) ? '' : 'تاریخ شروع الزامی است.')]
    }),
    payment: (data) => collect(data, {
      amount: [(value) => (required(value) && !Number.isNaN(Number(window.SaraUI?.toEnglishDigits?.(value) || value)) ? '' : 'مبلغ معتبر الزامی است.')],
      due_date: [(value) => (required(value) ? '' : 'تاریخ سررسید الزامی است.')],
      status: [(value) => (required(value) ? '' : 'وضعیت پرداخت الزامی است.')]
    }),
    maintenance: (data) => collect(data, {
      room_id: [(value) => (required(value) ? '' : 'انتخاب اتاق الزامی است.')],
      title: [(value) => (required(value) ? '' : 'عنوان درخواست الزامی است.')],
      description: [(value) => (required(value) ? '' : 'شرح مشکل الزامی است.')],
      priority: [(value) => (required(value) ? '' : 'اولویت الزامی است.')]
    }),
    announcement: (data) => collect(data, {
      title: [(value) => (required(value) ? '' : 'عنوان اطلاعیه الزامی است.')],
      content: [(value) => (required(value) ? '' : 'متن اطلاعیه الزامی است.')]
    })
  };

  window.SaraValidate = { required, email, same, collect, ...rules };
})();
