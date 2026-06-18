/* SaraSystem JSON REST API helper. */
(function () {
  const DEFAULT_BASE_URL = window.SARA_API_BASE_URL || '/api';

  function joinUrl(baseUrl, path) {
    if (/^https?:\/\//i.test(path)) return path;
    if (/^\/api(\/|$)/i.test(path)) return path;
    const base = String(baseUrl || '').replace(/\/+$/, '');
    const suffix = String(path || '').replace(/^\/+/, '');
    return `${base}/${suffix}`;
  }

  async function parseResponse(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function fieldErrors(data) {
    if (!data || typeof data !== 'object') return {};
    if (data.errors && typeof data.errors === 'object') return data.errors;
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => Array.isArray(value) || typeof value === 'string')
    );
  }

  function errorMessage(status, data) {
    return window.SaraUI?.apiErrorMessage?.(status, data)
      || data?.detail
      || data?.message
      || data?.error
      || 'درخواست با خطا روبه‌رو شد.';
  }

  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    };

    const token = window.SaraAuth?.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(joinUrl(options.baseUrl || DEFAULT_BASE_URL, path), {
      ...options,
      method,
      headers,
      body: options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body
    });

    const data = await parseResponse(response);

    if (response.status === 401) {
      window.SaraAuth?.clearSession?.();
    }

    if (!response.ok) {
      const error = new Error(errorMessage(response.status, data));
      error.status = response.status;
      error.data = data;
      error.fields = fieldErrors(data);
      throw error;
    }

    return data;
  }

  window.SaraAPI = {
    API_BASE_URL: DEFAULT_BASE_URL,
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    parseResponse,
    errorMessage,
    fieldErrors
  };
})();
