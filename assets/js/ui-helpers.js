/* SaraSystem shared UI helpers. */
(function () {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  function toPersianNumber(value) {
    return String(value ?? '').replace(/\d/g, (digit) => persianDigits[digit]);
  }

  function toEnglishDigits(value) {
    return String(value ?? '')
      .replace(/[۰-۹]/g, (digit) => persianDigits.indexOf(digit))
      .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit));
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
      400: 'اطلاعات ارسال‌شده معتبر نیست. لطفا فیلدها را بررسی کنید.',
      401: 'نشست شما پایان یافته است. لطفا دوباره وارد شوید.',
      403: 'شما مجوز دسترسی به این بخش را ندارید.',
      404: 'منبع یا آدرس API پیدا نشد.',
      409: 'این عملیات با داده‌های موجود تداخل دارد.',
      422: 'برخی اطلاعات قابل پذیرش نیست.',
      429: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
      500: 'خطای داخلی سرور رخ داده است. لطفا بعدا دوباره تلاش کنید.'
    };

    return messages[status] || 'عملیات ناموفق بود. لطفا دوباره تلاش کنید.';
  }

  function asList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (data && typeof data === 'object') return [data];
    return [];
  }

  window.SaraUI = {
    toPersianNumber,
    toEnglishDigits,
    formatAmount,
    formatDate,
    normalizeError,
    apiErrorMessage,
    asList
  };
})();
