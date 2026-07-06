/* SaraSystem JSON REST API helper. */
(function () {
  const DEFAULT_BASE_URL = '/api';
  const DEFAULT_ACCOUNTS_BASE_URL = 'http://127.0.0.1:8001';
  const DEFAULT_DORMITORY_BASE_URL = 'http://127.0.0.1:8000';
  const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
  const ACCOUNT_V1_PATHS = [
    /^\/api\/v1\/users\/(?:create|login|token\/refresh|password\/change|changePassword|editProfile|list|current|status\/change)\/?$/i,
    /^\/api\/v1\/users\/delete\/[^/]+\/?$/i,
    /^\/api\/v1\/role\/(?:create|list)\/?$/i,
    /^\/api\/v1\/role\/(?:delete|update)\/[^/]+\/?$/i,
    /^\/api\/v1\/permission\/(?:create|list)\/?$/i,
    /^\/api\/v1\/(?:rolePermission|userRole)\/create\/?$/i
  ];

  function configure(options = {}) {
    if (options.baseUrl) window.SARA_API_BASE_URL = options.baseUrl;
    if (options.accountsBaseUrl) window.SARA_ACCOUNTS_API_BASE_URL = options.accountsBaseUrl;
    if (options.dormitoryBaseUrl) window.SARA_DORMITORY_API_BASE_URL = options.dormitoryBaseUrl;
  }

  function normalizeAccountPath(path = '', method = 'GET') {
    const value = String(path || '');
    const requestMethod = String(method || 'GET').toUpperCase();

    if (/^\/api\/accounts\/getToken\/?$/i.test(value)) return '/api/v1/users/login';
    if (/^\/api\/accounts\/refreshToken\/?$/i.test(value)) return '/api/v1/users/token/refresh';
    if (/^\/api\/accounts\/me\/?$/i.test(value)) return '/api/v1/users/current';
    if (/^\/api\/accounts\/(?:users\/register|register)\/?$/i.test(value)) return '/api/v1/users/create';
    if (/^\/api\/accounts\/(?:update-profile|editProfile)\/?$/i.test(value)) return '/api/v1/users/editProfile';
    if (/^\/api\/accounts\/(?:change-password|changePassword)\/?$/i.test(value)) return '/api/v1/users/password/change';
    if (/^\/api\/v1\/users\/changePassword\/?$/i.test(value)) return '/api/v1/users/password/change';
    if (/^\/api\/accounts\/users\/?$/i.test(value)) {
      return requestMethod === 'POST' ? '/api/v1/users/create' : '/api/v1/users/list';
    }
    if (/^\/api\/accounts\/roles\/?$/i.test(value)) {
      return requestMethod === 'POST' ? '/api/v1/role/create' : '/api/v1/role/list';
    }
    if (/^\/api\/accounts\/permissions\/?$/i.test(value)) {
      return requestMethod === 'POST' ? '/api/v1/permission/create' : '/api/v1/permission/list';
    }
    if (/^\/api\/accounts\/role-permissions\/?$/i.test(value)) return '/api/v1/rolePermission/create';
    if (/^\/api\/accounts\/user-roles\/?$/i.test(value)) return '/api/v1/userRole/create';

    if (ACCOUNT_V1_PATHS.some((pattern) => pattern.test(value))) {
      return value.replace(/\/$/, '');
    }

    return value;
  }

  function isAccountPath(path = '') {
    const value = String(path || '');
    return /^\/api\/accounts(?:\/|$)/i.test(value)
      || ACCOUNT_V1_PATHS.some((pattern) => pattern.test(value));
  }

  function isAnonymousAccountPath(path = '') {
    const value = normalizeAccountPath(path);
    return /^\/api\/v1\/users\/(?:login|create|token\/refresh)\/?$/i.test(value);
  }

  function apiBaseUrl(path = '') {
    const value = normalizeAccountPath(path);
    if (/^\/api\/accounts(?:\/|$)/i.test(value)) {
      return window.SARA_ACCOUNTS_API_BASE_URL
        || localStorage.getItem('sarasystem.accountsApiBaseUrl')
        || DEFAULT_ACCOUNTS_BASE_URL;
    }

    if (isAccountPath(value)) {
      return window.SARA_ACCOUNTS_API_BASE_URL
        || localStorage.getItem('sarasystem.accountsApiBaseUrl')
        || DEFAULT_ACCOUNTS_BASE_URL;
    }

    if (/^\/api\/(?:dormitory|rooms|beds)(?:\/|$)/i.test(value)) {
      return window.SARA_DORMITORY_API_BASE_URL
        || localStorage.getItem('sarasystem.dormitoryApiBaseUrl')
        || DEFAULT_DORMITORY_BASE_URL;
    }

    return window.SARA_API_BASE_URL
      || localStorage.getItem('sarasystem.apiBaseUrl')
      || DEFAULT_BASE_URL;
  }

  function joinUrl(path, baseUrl, method = 'GET') {
    const value = normalizeAccountPath(path, method);
    if (/^https?:\/\//i.test(value)) return value;

    const resolvedBaseUrl = baseUrl || apiBaseUrl(value);
    const base = String(resolvedBaseUrl || '').replace(/\/+$/, '');
    if (/^\/api(\/|$)/i.test(value)) {
      if (/^https?:\/\//i.test(base)) {
        return `${base}${value}`;
      }
      return value;
    }

    const suffix = value.replace(/^\/+/, '');
    return `${base}/${suffix}`;
  }

  function normalizeEndpoint(path) {
    return joinUrl(path).replace(/^\/api\/?/, '/api/');
  }

  function buildHeaders(options = {}) {
    const body = options.body;
    const headers = {
      Accept: 'application/json',
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    };

    const token = options.token || window.SaraAuth?.getAccessToken?.();
    if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  function serializeBody(body) {
    if (!body || body instanceof FormData || typeof body === 'string') return body;
    return JSON.stringify(body);
  }

  async function parseResponse(response) {
    const text = await response.text();
    if (!text) return null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function pagination(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { count: null, next: null, previous: null, page: 1, pageSize: null, totalPages: 1 };
    }

    const count = Number.isFinite(Number(data.count)) ? Number(data.count) : null;
    const pageSize = Number.isFinite(Number(data.page_size || data.pageSize))
      ? Number(data.page_size || data.pageSize)
      : Array.isArray(data.results)
        ? data.results.length
        : null;
    const page = Number.isFinite(Number(data.page)) ? Number(data.page) : 1;

    return {
      count,
      next: data.next || null,
      previous: data.previous || null,
      page,
      pageSize,
      totalPages: count && pageSize ? Math.max(1, Math.ceil(count / pageSize)) : 1
    };
  }

  function list(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (data && typeof data === 'object') return [data];
    return [];
  }

  function fieldErrors(data) {
    if (!data || typeof data !== 'object') return {};
    if (data.errors && typeof data.errors === 'object') return data.errors;
    if (data.field_errors && typeof data.field_errors === 'object') return data.field_errors;
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

  function createError(response, data, path) {
    const error = new Error(errorMessage(response.status, data));
    error.name = 'SaraApiError';
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = data;
    error.fields = fieldErrors(data);
    error.endpoint = normalizeEndpoint(path);
    error.retryable = RETRYABLE_STATUSES.has(response.status);
    return error;
  }

  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const retryOnUnauthorized = options.retryOnUnauthorized !== false;
    const url = joinUrl(path, options.baseUrl, method);

    let response;
    try {
      response = await fetch(url, {
        ...options,
        method,
        headers: buildHeaders(options),
        body: serializeBody(options.body)
      });
    } catch (networkError) {
      const error = new Error('ارتباط با سرور برقرار نشد. اتصال اینترنت یا آدرس API را بررسی کنید.');
      error.name = 'SaraNetworkError';
      error.status = 0;
      error.data = null;
      error.fields = {};
      error.endpoint = normalizeEndpoint(path);
      error.retryable = true;
      error.cause = networkError;
      throw error;
    }

    const data = await parseResponse(response);

    if (response.status === 401 && retryOnUnauthorized && options.auth !== false && !window.SaraAuth?.isDemoMode?.()) {
      const refreshedToken = await window.SaraAuth?.refreshAccessToken?.();
      if (refreshedToken) {
        return request(path, { ...options, retryOnUnauthorized: false });
      }

      if (options.redirectOnExpired !== false && window.SaraAuth?.handleExpiredSession) {
        window.SaraAuth.handleExpiredSession();
        return null;
      }

      window.SaraAuth?.clearSession?.();
    }

    if (!response.ok) throw createError(response, data, path);
    return data;
  }


  function configureHtmxApiBase() {
    const attach = () => {
      if (!document.body || document.body.dataset.saraApiHtmxBase === 'true') return;
      document.body.dataset.saraApiHtmxBase = 'true';

      document.body.addEventListener('htmx:configRequest', (event) => {
        const requestPath = event.detail?.path
          || event.detail?.pathInfo?.requestPath
          || event.detail?.requestConfig?.path
          || '';

        if (!/^\/api(\/|$)/i.test(requestPath)) return;

        const normalizedPath = normalizeAccountPath(requestPath, event.detail?.verb || event.detail?.requestConfig?.verb || 'GET');
        const resolvedPath = joinUrl(normalizedPath);
        if (resolvedPath !== requestPath) {
          event.detail.path = resolvedPath;
          if (event.detail.pathInfo) event.detail.pathInfo.requestPath = resolvedPath;
          if (event.detail.requestConfig) event.detail.requestConfig.path = resolvedPath;
        }

        const token = window.SaraAuth?.getAccessToken?.();
        if (token && !isAnonymousAccountPath(normalizedPath)) {
          event.detail.headers = event.detail.headers || {};
          event.detail.headers.Authorization = `Bearer ${token}`;
        }
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach, { once: true });
    } else {
      attach();
    }
  }

  function withQuery(path, params = {}) {
    const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (!entries.length) return path;
    const joiner = String(path).includes('?') ? '&' : '?';
    const query = new URLSearchParams(entries).toString();
    return `${path}${joiner}${query}`;
  }

  window.SaraAPI = {
    configure,
    API_BASE_URL: DEFAULT_BASE_URL,
    apiBaseUrl,
    normalizeAccountPath,
    isAccountPath,
    joinUrl,
    normalizeEndpoint,
    buildHeaders,
    parseResponse,
    fieldErrors,
    errorMessage,
    pagination,
    list,
    withQuery,
    configureHtmxApiBase,
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' })
  };

  configureHtmxApiBase();
})();
