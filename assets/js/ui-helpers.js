/* SaraSystem shared UI helpers. */
(function () {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  function toPersianNumber(value) {
    return String(value ?? '').replace(/\d/g, (digit) => persianDigits[digit]);
  }

  function toEnglishDigits(value) {
    return String(value ?? '')
      .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
  }

  function formatAmount(value, currency = 'ریال') {
    if (value === null || value === undefined || value === '') return '—';
    const number = Number(toEnglishDigits(value));
    if (Number.isNaN(number)) return String(value);
    return `${toPersianNumber(number.toLocaleString('en-US'))} ${currency}`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return toPersianNumber(value);
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(date);
  }

  function normalizeError(value) {
    if (!value) return '';
    if (Array.isArray(value)) return value.map(normalizeError).filter(Boolean).join('، ');
    if (typeof value === 'object') return Object.values(value).map(normalizeError).filter(Boolean).join('، ');
    return String(value);
  }

  function apiErrorMessage(status, data) {
    const serverMessage = data?.detail || data?.message || data?.error || data?.non_field_errors?.[0];
    if (serverMessage) return normalizeError(serverMessage);

    const messages = {
      0: 'ارتباط با سرور برقرار نشد. اتصال اینترنت یا آدرس API را بررسی کنید.',
      400: 'اطلاعات ارسال‌شده معتبر نیست. لطفا فیلدها را بررسی کنید.',
      401: 'نشست شما پایان یافته است. لطفا دوباره وارد شوید.',
      403: 'شما مجوز دسترسی به این بخش را ندارید.',
      404: 'منبع یا آدرس API پیدا نشد.',
      409: 'این عملیات با داده‌های موجود تداخل دارد.',
      422: 'برخی اطلاعات قابل پذیرش نیست. لطفا ورودی‌ها را اصلاح کنید.',
      429: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
      500: 'خطای داخلی سرور رخ داده است. لطفا بعدا دوباره تلاش کنید.',
      502: 'پاسخ نامعتبر از سرور دریافت شد.',
      503: 'سرویس در حال حاضر در دسترس نیست.',
      504: 'زمان پاسخ‌گویی سرور به پایان رسید.'
    };

    return messages[status] || 'عملیات ناموفق بود. لطفا دوباره تلاش کنید.';
  }

  function asList(data) {
    return window.SaraAPI?.list?.(data) || [];
  }

  function createRequestState(initial = {}) {
    return {
      loading: false,
      loaded: false,
      error: '',
      status: null,
      retryable: false,
      pagination: { count: null, next: null, previous: null, page: 1, pageSize: null, totalPages: 1 },
      ...initial
    };
  }

  function setLoading(state) {
    Object.assign(state, { loading: true, error: '', status: null, retryable: false });
    return state;
  }

  function setSuccess(state, data) {
    Object.assign(state, {
      loading: false,
      loaded: true,
      error: '',
      status: 200,
      retryable: false,
      pagination: window.SaraAPI?.pagination?.(data) || state.pagination
    });
    return state;
  }

  function setError(state, error) {
    Object.assign(state, {
      loading: false,
      loaded: true,
      error: error?.message || apiErrorMessage(error?.status, error?.data),
      status: error?.status || 0,
      retryable: Boolean(error?.retryable)
    });
    return state;
  }

  function applyFieldErrors(formErrors = {}, apiFields = {}) {
    Object.keys(formErrors).forEach((key) => {
      formErrors[key] = normalizeError(apiFields[key]);
    });
    return formErrors;
  }

  window.SaraUI = {
    toPersianNumber,
    toEnglishDigits,
    formatAmount,
    formatDate,
    normalizeError,
    apiErrorMessage,
    asList,
    createRequestState,
    setLoading,
    setSuccess,
    setError,
    applyFieldErrors
  };
})();
