/* SaraSystem JSON REST API helper. */
(function () {
  const DEFAULT_BASE_URL = '/api';
  const DEFAULT_ACCOUNTS_BASE_URL = 'http://127.0.0.1:8001';
  const DEFAULT_DORMITORY_BASE_URL = 'http://127.0.0.1:8000';
  const DEFAULT_AI_BASE_URL = 'http://127.0.0.1:5000';
  const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
  const ACCOUNT_V1_PATHS = [
    /^\/api\/v1\/users\/(?:create|login|logout|token\/refresh|password\/change|password\/reset|password\/reset\/username|changePassword|editProfile|adminUpdate|list|current|status\/change)\/?$/i,
    /^\/api\/v1\/users\/current\/studentId\/?$/i,
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
    if (options.aiBaseUrl) window.SARA_AI_API_BASE_URL = options.aiBaseUrl;
  }

  function splitUrlPath(value = '') {
    const original = String(value || '');
    const [, path = original, tail = ''] = original.match(/^([^?#]*)(.*)$/) || [];
    return { original, path, tail };
  }

  function appendUrlTail(target, tail = '') {
    if (!tail) return target;
    if (tail.startsWith('?') && String(target).includes('?')) return `${target}&${tail.slice(1)}`;
    return `${target}${tail}`;
  }

  function normalizeAccountPath(path = '', method = 'GET') {
    const { original, path: value, tail } = splitUrlPath(path);
    const requestMethod = String(method || 'GET').toUpperCase();

    if (/^\/api\/accounts\/getToken\/?$/i.test(value)) return appendUrlTail('/api/v1/users/login', tail);
    if (/^\/api\/accounts\/refreshToken\/?$/i.test(value)) return appendUrlTail('/api/v1/users/token/refresh', tail);
    if (/^\/api\/accounts\/me\/?$/i.test(value)) return appendUrlTail('/api/v1/users/current', tail);
    if (/^\/api\/accounts\/(?:users\/register|register)\/?$/i.test(value)) return appendUrlTail('/api/v1/users/create', tail);
    if (/^\/api\/accounts\/(?:update-profile|editProfile)\/?$/i.test(value)) return appendUrlTail('/api/v1/users/editProfile', tail);
    if (/^\/api\/accounts\/(?:users\/admin-update|users\/update|adminUpdate)\/?$/i.test(value)) return appendUrlTail('/api/v1/users/adminUpdate', tail);
    if (/^\/api\/accounts\/(?:change-password|changePassword)\/?$/i.test(value)) return appendUrlTail('/api/v1/users/password/change', tail);
    if (/^\/api\/accounts\/(?:reset-password|forgot-password|password\/reset|password\/reset\/username)\/?$/i.test(value)) return appendUrlTail('/api/v1/users/password/reset', tail);
    if (/^\/api\/accounts\/logout\/?$/i.test(value)) return appendUrlTail('/api/v1/users/logout', tail);
    if (/^\/api\/v1\/users\/changePassword\/?$/i.test(value)) return appendUrlTail('/api/v1/users/password/change', tail);
    if (/^\/api\/v1\/users\/password\/reset\/username\/?$/i.test(value)) return appendUrlTail('/api/v1/users/password/reset', tail);
    if (/^\/api\/accounts\/users\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/v1/users/create' : '/api/v1/users/list', tail);
    }

    const accountUserStatusMatch = value.match(/^\/api\/accounts\/users\/([^/?#]+)\/status\/?$/i);
    if (accountUserStatusMatch && requestMethod === 'PATCH') {
      return appendUrlTail('/api/v1/users/status/change', tail);
    }

    const accountUserMatch = value.match(/^\/api\/accounts\/users\/([^/?#]+)\/?$/i);
    if (accountUserMatch && requestMethod === 'GET') {
      return appendUrlTail(`/api/v1/users/current?userId=${encodeURIComponent(accountUserMatch[1])}`, tail);
    }
    if (accountUserMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail('/api/v1/users/adminUpdate', tail);
    }
    if (accountUserMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/v1/users/delete/${encodeURIComponent(accountUserMatch[1])}`, tail);
    }

    if (/^\/api\/accounts\/roles\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/v1/role/create' : '/api/v1/role/list', tail);
    }

    const accountRoleMatch = value.match(/^\/api\/accounts\/roles\/([^/?#]+)\/?$/i);
    if (accountRoleMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/v1/role/update/${encodeURIComponent(accountRoleMatch[1])}`, tail);
    }
    if (accountRoleMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/v1/role/delete/${encodeURIComponent(accountRoleMatch[1])}`, tail);
    }

    if (/^\/api\/accounts\/permissions\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/v1/permission/create' : '/api/v1/permission/list', tail);
    }
    if (/^\/api\/accounts\/role-permissions\/?$/i.test(value)) return appendUrlTail('/api/v1/rolePermission/create', tail);
    if (/^\/api\/accounts\/user-roles\/?$/i.test(value)) return appendUrlTail('/api/v1/userRole/create', tail);

    if (ACCOUNT_V1_PATHS.some((pattern) => pattern.test(value))) {
      return appendUrlTail(value.replace(/\/$/, ''), tail);
    }

    return original;
  }

  function normalizeDormitoryPath(path = '', method = 'GET') {
    const { original, path: value, tail } = splitUrlPath(path);
    const requestMethod = String(method || 'GET').toUpperCase();

    if (/^\/api\/accommodation-requests\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/accommodation/create' : '/api/accommodation/detail', tail);
    }

    if (/^\/api\/accommodation-requests\/review\/?$/i.test(value)) {
      return appendUrlTail('/api/accommodation/review', tail);
    }

    if (/^\/api\/accommodation-requests\/history\/?$/i.test(value)) {
      return appendUrlTail('/api/accommodation/history', tail);
    }

    const reviewMatch = value.match(/^\/api\/accommodation-requests\/([^/?#]+)\/review\/?$/i);
    if (reviewMatch) {
      return appendUrlTail(`/api/accommodation/review?id=${encodeURIComponent(reviewMatch[1])}`, tail);
    }

    const historyMatch = value.match(/^\/api\/accommodation-requests\/([^/?#]+)\/history\/?$/i);
    if (historyMatch) {
      return appendUrlTail(`/api/accommodation/history?id=${encodeURIComponent(historyMatch[1])}`, tail);
    }

    const detailMatch = value.match(/^\/api\/accommodation-requests\/([^/?#]+)\/?$/i);
    if (detailMatch) {
      return appendUrlTail(`/api/accommodation/update?id=${encodeURIComponent(detailMatch[1])}`, tail);
    }

    if (/^\/api\/dormitories\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/dormitory/createDorm/' : '/api/dormitory/listAll/', tail);
    }

    if (/^\/api\/dormitories\/(?:with-rooms|withRooms)\/?$/i.test(value)) {
      return appendUrlTail('/api/dormitory/withRooms/', tail);
    }

    const dormRoomsMatch = value.match(/^\/api\/dormitories\/([^/?#]+)\/rooms\/?$/i);
    if (dormRoomsMatch) {
      return appendUrlTail(`/api/rooms/listAllRoom/?dormId=${encodeURIComponent(dormRoomsMatch[1])}`, tail);
    }

    const dormMatch = value.match(/^\/api\/dormitories\/([^/?#]+)\/?$/i);
    if (dormMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/dormitory/updateDorm/${encodeURIComponent(dormMatch[1])}`, tail);
    }

    if (/^\/api\/rooms\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/rooms/createRoom/' : '/api/rooms/listAllRoom/', tail);
    }

    const roomBedsMatch = value.match(/^\/api\/rooms\/([^/?#]+)\/beds\/?$/i);
    if (roomBedsMatch) {
      return appendUrlTail(`/api/rooms/listAllRoomBeds/${encodeURIComponent(roomBedsMatch[1])}`, tail);
    }

    const roomMatch = value.match(/^\/api\/rooms\/([^/?#]+)\/?$/i);
    if (roomMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/rooms/deleteRoom/${encodeURIComponent(roomMatch[1])}`, tail);
    }
    if (roomMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/rooms/updateRoom/${encodeURIComponent(roomMatch[1])}`, tail);
    }

    if (/^\/api\/beds\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/beds/createBed/' : '/api/beds/listAll/', tail);
    }

    const bedMatch = value.match(/^\/api\/beds\/([^/?#]+)\/?$/i);
    if (bedMatch && requestMethod === 'GET') {
      return appendUrlTail(`/api/beds/getBedById/${encodeURIComponent(bedMatch[1])}`, tail);
    }
    if (bedMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/beds/updateBed/${encodeURIComponent(bedMatch[1])}`, tail);
    }

    return original;
  }

  function normalizeAiPath(path = '') {
    const value = String(path || '');

    if (/^\/api\/face\/register\/?$/i.test(value)) return '/register';
    if (/^\/api\/face\/verify\/?$/i.test(value)) return '/verify';
    if (/^\/api\/face\/delete\/?$/i.test(value)) return '/delete';

    return value;
  }

  function normalizeApiPath(path = '', method = 'GET') {
    return normalizeAiPath(normalizeDormitoryPath(normalizeAccountPath(path, method), method));
  }

  function isAccountPath(path = '') {
    const { path: value } = splitUrlPath(path);
    return /^\/api\/accounts(?:\/|$)/i.test(value)
      || ACCOUNT_V1_PATHS.some((pattern) => pattern.test(value));
  }

  function isAnonymousAccountPath(path = '') {
    const { path: value } = splitUrlPath(normalizeAccountPath(path));
    return /^\/api\/v1\/users\/(?:login|create|token\/refresh|password\/reset)\/?$/i.test(value);
  }

  function isAiPath(path = '') {
    const { path: value } = splitUrlPath(path);
    return /^\/api\/face\/(?:register|verify|delete)\/?$/i.test(value);
  }

  function isAnnouncementPath(path = '') {
    const { path: value } = splitUrlPath(path);
    return /^\/api\/announcements(?:\/|$)/i.test(value);
  }

  function apiBaseUrl(path = '', method = 'GET') {
    const originalValue = String(path || '');
    const value = normalizeApiPath(path, method);
    if (isAiPath(originalValue)) {
      return window.SARA_AI_API_BASE_URL
        || localStorage.getItem('sarasystem.aiApiBaseUrl')
        || DEFAULT_AI_BASE_URL;
    }

    if (isAnnouncementPath(originalValue) || isAnnouncementPath(value)) {
      return window.SARA_ACCOUNTS_API_BASE_URL
        || localStorage.getItem('sarasystem.accountsApiBaseUrl')
        || DEFAULT_ACCOUNTS_BASE_URL;
    }

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

    if (/^\/api\/(?:dormitory|rooms|beds|accommodation)(?:\/|$)/i.test(value)) {
      return window.SARA_DORMITORY_API_BASE_URL
        || localStorage.getItem('sarasystem.dormitoryApiBaseUrl')
        || DEFAULT_DORMITORY_BASE_URL;
    }

    return window.SARA_API_BASE_URL
      || localStorage.getItem('sarasystem.apiBaseUrl')
      || DEFAULT_BASE_URL;
  }

  function joinUrl(path, baseUrl, method = 'GET') {
    const value = normalizeApiPath(path, method);
    if (/^https?:\/\//i.test(value)) return value;

    const resolvedBaseUrl = baseUrl || apiBaseUrl(path, method);
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

  function normalizeRequestBody(path = '', method = 'GET', body) {
    if (!body || body instanceof FormData || typeof body !== 'object' || Array.isArray(body)) return body;

    const { path: value } = splitUrlPath(path);
    const requestMethod = String(method || 'GET').toUpperCase();
    const statusMatch = value.match(/^\/api\/accounts\/users\/([^/?#]+)\/status\/?$/i);
    if (statusMatch && requestMethod === 'PATCH') {
      return { ...body, id: body.id ?? statusMatch[1] };
    }

    const userMatch = value.match(/^\/api\/accounts\/users\/([^/?#]+)\/?$/i);
    if (userMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return { ...body, id: body.id ?? userMatch[1] };
    }

    return body;
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
    const body = normalizeRequestBody(path, method, options.body);

    let response;
    try {
      response = await fetch(url, {
        ...options,
        method,
        headers: buildHeaders({ ...options, body }),
        body: serializeBody(body)
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

        const normalizedPath = normalizeApiPath(requestPath, event.detail?.verb || event.detail?.requestConfig?.verb || 'GET');
        const resolvedPath = joinUrl(requestPath, undefined, event.detail?.verb || event.detail?.requestConfig?.verb || 'GET');
        if (resolvedPath !== requestPath) {
          event.detail.path = resolvedPath;
          if (event.detail.pathInfo) event.detail.pathInfo.requestPath = resolvedPath;
          if (event.detail.requestConfig) event.detail.requestConfig.path = resolvedPath;
        }

        const token = window.SaraAuth?.getAccessToken?.();
        if (token && !isAnonymousAccountPath(normalizedPath) && !isAiPath(requestPath)) {
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
    normalizeDormitoryPath,
    normalizeAiPath,
    normalizeApiPath,
    normalizeRequestBody,
    isAccountPath,
    isAiPath,
    isAnnouncementPath,
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
