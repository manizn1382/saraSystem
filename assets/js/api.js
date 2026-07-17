/* SaraSystem JSON REST API helper. */
(function () {
  const DEFAULT_BASE_URL = '/api';
  const DEFAULT_ACCOUNTS_BASE_URL = 'http://127.0.0.1:8001';
  const DEFAULT_DORMITORY_BASE_URL = 'http://127.0.0.1:8000';
  const DEFAULT_AI_BASE_URL = 'http://127.0.0.1:5000';
  const DEFAULT_NATIONAL_ID_BASE_URL = 'http://127.0.0.1:5001';
  const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
  const ACCOUNT_V1_PATHS = [
    /^\/api\/v1\/users\/(?:create|login|logout|token\/refresh|password\/change|password\/reset|password\/reset\/username|changePassword|editProfile|adminUpdate|list|current|status\/change)\/?$/i,
    /^\/api\/v1\/users\/current\/studentId\/?$/i,
    /^\/api\/v1\/users\/delete\/[^/]+\/?$/i,
    /^\/api\/v1\/role\/(?:create|list|update)\/?$/i,
    /^\/api\/v1\/role\/delete\/[^/]+\/?$/i,
    /^\/api\/v1\/permission\/(?:create|list|update)\/?$/i,
    /^\/api\/v1\/permission\/delete\/[^/]+\/?$/i,
    /^\/api\/v1\/(?:rolePermission|userRole)\/(?:create|detail)\/?$/i,
    /^\/api\/v1\/(?:rolePermission|userRole)\/delete\/[^/]+\/?$/i
  ];

  function configure(options = {}) {
    if (options.baseUrl) window.SARA_API_BASE_URL = options.baseUrl;
    if (options.accountsBaseUrl) window.SARA_ACCOUNTS_API_BASE_URL = options.accountsBaseUrl;
    if (options.dormitoryBaseUrl) window.SARA_DORMITORY_API_BASE_URL = options.dormitoryBaseUrl;
    if (options.aiBaseUrl) window.SARA_AI_API_BASE_URL = options.aiBaseUrl;
    if (options.nationalIdBaseUrl) window.SARA_NATIONAL_ID_API_BASE_URL = options.nationalIdBaseUrl;
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

  function normalizeStudentIdTail(tail = '') {
    if (!tail.startsWith('?')) return tail;
    const params = new URLSearchParams(tail.slice(1));
    if (!params.has('studentId') && params.has('student_id')) {
      params.set('studentId', params.get('student_id'));
      params.delete('student_id');
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  function queryTail(params) {
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  function normalizeRoomListTail(tail = '', forcedDormId = '') {
    if (!tail.startsWith('?')) {
      return forcedDormId ? `${queryTail(new URLSearchParams([['dormId', forcedDormId]]))}${tail}` : tail;
    }
    const params = new URLSearchParams(tail.startsWith('?') ? tail.slice(1) : '');
    const dormitoryId = forcedDormId
      || params.get('dormId')
      || params.get('dormitory_id')
      || params.get('dormitoryId')
      || params.get('dormitory');
    params.delete('dormitory_id');
    params.delete('dormitoryId');
    params.delete('dormitory');
    if (dormitoryId) params.set('dormId', dormitoryId);
    return queryTail(params);
  }

  function normalizeBedListTarget(tail = '') {
    if (!tail.startsWith('?')) {
      return { path: '/api/beds/listAll/', tail };
    }
    const params = new URLSearchParams(tail.startsWith('?') ? tail.slice(1) : '');
    const roomId = params.get('room_id') || params.get('roomId') || params.get('room');
    const status = params.get('status');
    params.delete('room_id');
    params.delete('roomId');
    params.delete('room');
    if (roomId) {
      return {
        path: `/api/rooms/listAllRoomBeds/${encodeURIComponent(roomId)}`,
        tail: queryTail(params)
      };
    }
    params.delete('status');
    return {
      path: status ? `/api/beds/listAll/${encodeURIComponent(status)}` : '/api/beds/listAll/',
      tail: queryTail(params)
    };
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

    if (/^\/api\/accounts\/users\/(?:by-student-id|student-id)\/?$/i.test(value)) {
      return appendUrlTail('/api/v1/users/current/studentId', normalizeStudentIdTail(tail));
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
      return appendUrlTail(`/api/v1/role/update?role_id=${encodeURIComponent(accountRoleMatch[1])}`, tail);
    }
    if (accountRoleMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/v1/role/delete/${encodeURIComponent(accountRoleMatch[1])}`, tail);
    }

    if (/^\/api\/accounts\/permissions\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/v1/permission/create' : '/api/v1/permission/list', tail);
    }
    const accountPermissionMatch = value.match(/^\/api\/accounts\/permissions\/([^/?#]+)\/?$/i);
    if (accountPermissionMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/v1/permission/update?permission_id=${encodeURIComponent(accountPermissionMatch[1])}`, tail);
    }
    if (accountPermissionMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/v1/permission/delete/${encodeURIComponent(accountPermissionMatch[1])}`, tail);
    }

    if (/^\/api\/accounts\/role-permissions\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/v1/rolePermission/create' : '/api/v1/rolePermission/detail', tail);
    }
    const accountRolePermissionMatch = value.match(/^\/api\/accounts\/role-permissions\/([^/?#]+)\/?$/i);
    if (accountRolePermissionMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/v1/rolePermission/delete/${encodeURIComponent(accountRolePermissionMatch[1])}`, tail);
    }

    if (/^\/api\/accounts\/user-roles\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/v1/userRole/create' : '/api/v1/userRole/detail', tail);
    }
    const accountUserRoleMatch = value.match(/^\/api\/accounts\/user-roles\/([^/?#]+)\/?$/i);
    if (accountUserRoleMatch && requestMethod === 'DELETE') {
      return appendUrlTail(`/api/v1/userRole/delete/${encodeURIComponent(accountUserRoleMatch[1])}`, tail);
    }

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
      return appendUrlTail('/api/rooms/listAllRoom/', normalizeRoomListTail(tail, dormRoomsMatch[1]));
    }

    const dormMatch = value.match(/^\/api\/dormitories\/([^/?#]+)\/?$/i);
    if (dormMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/dormitory/updateDorm/${encodeURIComponent(dormMatch[1])}`, tail);
    }

    if (/^\/api\/rooms\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/rooms/createRoom/' : '/api/rooms/listAllRoom/', requestMethod === 'GET' ? normalizeRoomListTail(tail) : tail);
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
      if (requestMethod === 'GET') {
        const target = normalizeBedListTarget(tail);
        return appendUrlTail(target.path, target.tail);
      }
      return appendUrlTail('/api/beds/createBed/', tail);
    }

    const bedMatch = value.match(/^\/api\/beds\/([^/?#]+)\/?$/i);
    if (bedMatch && requestMethod === 'GET') {
      return appendUrlTail(`/api/beds/getBedById/${encodeURIComponent(bedMatch[1])}`, tail);
    }
    if (bedMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/beds/updateBed/${encodeURIComponent(bedMatch[1])}`, tail);
    }

    if (/^\/api\/bed-assignments\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/bedAssign/create' : '/api/bedAssign/detail', tail);
    }

    if (/^\/api\/bed-assignments\/current\/?$/i.test(value)) {
      return appendUrlTail('/api/bedAssign/current', tail);
    }

    const assignmentMatch = value.match(/^\/api\/bed-assignments\/([^/?#]+)\/?$/i);
    if (assignmentMatch && requestMethod === 'GET') {
      return appendUrlTail(`/api/bedAssign/detail?assign_id=${encodeURIComponent(assignmentMatch[1])}`, tail);
    }
    if (assignmentMatch && ['PUT', 'PATCH'].includes(requestMethod)) {
      return appendUrlTail(`/api/bedAssign/update?assign_id=${encodeURIComponent(assignmentMatch[1])}`, tail);
    }

    if (/^\/api\/maintenance-requests\/?$/i.test(value)) {
      return appendUrlTail(requestMethod === 'POST' ? '/api/maintenance/create' : '/api/maintenance/detail', tail);
    }

    const maintenanceStatusMatch = value.match(/^\/api\/maintenance-requests\/([^/?#]+)\/status\/?$/i);
    if (maintenanceStatusMatch && requestMethod === 'PATCH') {
      return appendUrlTail(`/api/maintenance/update/status?maintain_id=${encodeURIComponent(maintenanceStatusMatch[1])}`, tail);
    }

    const maintenanceAssignMatch = value.match(/^\/api\/maintenance-requests\/([^/?#]+)\/assign\/?$/i);
    if (maintenanceAssignMatch && requestMethod === 'PATCH') {
      return appendUrlTail(`/api/maintenance/update/assign?maintain_id=${encodeURIComponent(maintenanceAssignMatch[1])}`, tail);
    }

    const maintenanceCommentMatch = value.match(/^\/api\/maintenance-requests\/([^/?#]+)\/comments\/?$/i);
    if (maintenanceCommentMatch && requestMethod === 'PATCH') {
      return appendUrlTail(`/api/maintenance/update/comments?maintain_id=${encodeURIComponent(maintenanceCommentMatch[1])}`, tail);
    }

    const maintenanceMatch = value.match(/^\/api\/maintenance-requests\/([^/?#]+)\/?$/i);
    if (maintenanceMatch && requestMethod === 'PATCH') {
      return appendUrlTail(`/api/maintenance/update?maintain_id=${encodeURIComponent(maintenanceMatch[1])}`, tail);
    }

    return original;
  }

  function normalizeAiPath(path = '') {
    const value = String(path || '');

    if (/^\/api\/face\/register\/?$/i.test(value)) return '/register';
    if (/^\/api\/face\/verify\/?$/i.test(value)) return '/verify';
    if (/^\/api\/face\/delete\/?$/i.test(value)) return '/delete';
    if (/^\/api\/national-id\/verify\/?$/i.test(value)) return '/verify';

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

  function isNationalIdPath(path = '') {
    const { path: value } = splitUrlPath(path);
    return /^\/api\/national-id\/verify\/?$/i.test(value);
  }

  function isAnnouncementPath(path = '') {
    const { path: value } = splitUrlPath(path);
    return /^\/api\/announcements(?:\/|$)/i.test(value);
  }

  function isPublicApiPath(path = '') {
    const { path: value } = splitUrlPath(path);
    return /^\/api\/public(?:\/|$)/i.test(value)
      || /^\/api\/announcements\/public\/?$/i.test(value);
  }

  function requestPathname(path = '') {
    const raw = String(path || '');
    try {
      if (/^[a-z][a-z\d+.-]*:\/\//i.test(raw)) return new URL(raw).pathname;
    } catch {
      return splitUrlPath(raw).path;
    }
    return splitUrlPath(raw).path;
  }

  function requestOrigin(path = '') {
    try {
      if (/^[a-z][a-z\d+.-]*:\/\//i.test(String(path || ''))) return new URL(String(path)).origin;
    } catch {
      return '';
    }
    return '';
  }

  function isResolvedAiServicePath(path = '') {
    const origin = requestOrigin(path);
    if (!origin) return false;
    const aiBase = window.SARA_AI_API_BASE_URL
      || localStorage.getItem('sarasystem.aiApiBaseUrl')
      || DEFAULT_AI_BASE_URL;
    return origin === requestOrigin(aiBase)
      && /^\/(?:register|verify|delete)\/?$/i.test(requestPathname(path));
  }

  function isResolvedNationalIdServicePath(path = '') {
    const origin = requestOrigin(path);
    if (!origin) return false;
    const nationalIdBase = window.SARA_NATIONAL_ID_API_BASE_URL
      || localStorage.getItem('sarasystem.nationalIdApiBaseUrl')
      || DEFAULT_NATIONAL_ID_BASE_URL;
    return origin === requestOrigin(nationalIdBase)
      && /^\/verify\/?$/i.test(requestPathname(path));
  }

  function isAiRequestPath(path = '', normalizedPath = '') {
    return isAiPath(path)
      || isAiPath(normalizedPath)
      || isNationalIdPath(path)
      || isNationalIdPath(normalizedPath)
      || /^\/(?:register|verify|delete)\/?$/i.test(requestPathname(normalizedPath))
      || isResolvedAiServicePath(path)
      || isResolvedAiServicePath(normalizedPath)
      || isResolvedNationalIdServicePath(path)
      || isResolvedNationalIdServicePath(normalizedPath);
  }

  function isPublicRequestPath(path = '', normalizedPath = '') {
    const value = requestPathname(path);
    const normalizedValue = requestPathname(normalizedPath);
    return isPublicApiPath(path)
      || isPublicApiPath(normalizedPath)
      || /^\/api\/public(?:\/|$)/i.test(value)
      || /^\/api\/public(?:\/|$)/i.test(normalizedValue)
      || /^\/api\/announcements\/public\/?$/i.test(value)
      || /^\/api\/announcements\/public\/?$/i.test(normalizedValue);
  }

  function isAnonymousAccountRequestPath(path = '', method = 'GET') {
    const normalizedPath = normalizeApiPath(path, method);
    const value = requestPathname(normalizedPath);
    const originalValue = requestPathname(path);
    return /^\/api\/v1\/users\/(?:login|create|token\/refresh|password\/reset)\/?$/i.test(value)
      || /^\/api\/accounts\/(?:getToken|refreshToken|register|users\/register|reset-password|forgot-password|password\/reset|password\/reset\/username)\/?$/i.test(originalValue);
  }

  function shouldAttachAuthHeader(path = '', method = 'GET') {
    const normalizedPath = normalizeApiPath(path, method);
    return !isPublicRequestPath(path, normalizedPath)
      && !isAiRequestPath(path, normalizedPath)
      && !isAnonymousAccountRequestPath(path, method);
  }

  function apiBaseUrl(path = '', method = 'GET') {
    const originalValue = String(path || '');
    const value = normalizeApiPath(path, method);
    if (isNationalIdPath(originalValue)) {
      return window.SARA_NATIONAL_ID_API_BASE_URL
        || localStorage.getItem('sarasystem.nationalIdApiBaseUrl')
        || DEFAULT_NATIONAL_ID_BASE_URL;
    }

    if (isAiPath(originalValue)) {
      return window.SARA_AI_API_BASE_URL
        || localStorage.getItem('sarasystem.aiApiBaseUrl')
        || DEFAULT_AI_BASE_URL;
    }

    if (isPublicApiPath(originalValue) || isPublicApiPath(value)) {
      return window.SARA_API_BASE_URL
        || localStorage.getItem('sarasystem.apiBaseUrl')
        || DEFAULT_BASE_URL;
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

    if (/^\/api\/(?:dormitory|rooms|beds|accommodation|bedAssign|maintenance)(?:\/|$)/i.test(value)) {
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
    const path = options.path || options.endpoint || '';
    const method = options.method || 'GET';
    const headers = {
      Accept: 'application/json',
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    };

    const token = options.token || window.SaraAuth?.getAccessToken?.();
    if (token && options.auth !== false && (!path || shouldAttachAuthHeader(path, method))) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  function serializeBody(body) {
    if (!body || body instanceof FormData || typeof body === 'string') return body;
    return JSON.stringify(body);
  }

  function isBedAssignmentCreatePath(path = '', method = 'GET') {
    const { path: value } = splitUrlPath(path);
    return String(method || 'GET').toUpperCase() === 'POST'
      && (/^\/api\/bed-assignments\/?$/i.test(value) || /^\/api\/bedAssign\/create\/?$/i.test(value));
  }

  function normalizeBedAssignmentCreatePayload(body = {}) {
    const { request_id: requestId, bed_id: bedId, room_id: _roomId, ...rest } = body;
    return {
      ...rest,
      request: body.request ?? requestId,
      bed: body.bed ?? bedId
    };
  }

  function isMaintenanceCreatePath(path = '', method = 'GET') {
    const { path: value } = splitUrlPath(path);
    return String(method || 'GET').toUpperCase() === 'POST'
      && (/^\/api\/maintenance-requests\/?$/i.test(value) || /^\/api\/maintenance\/create\/?$/i.test(value));
  }

  function isMaintenanceMutationPath(path = '', method = 'GET') {
    const { path: value } = splitUrlPath(path);
    return ['POST', 'PUT', 'PATCH'].includes(String(method || 'GET').toUpperCase())
      && (/^\/api\/maintenance-requests(?:\/|$)/i.test(value) || /^\/api\/maintenance\/(?:create|update)(?:\/|$)/i.test(value));
  }

  function normalizeMaintenancePayload(path = '', method = 'GET', body = {}) {
    const { path: value } = splitUrlPath(path);
    const normalized = { ...body };
    const requestMethod = String(method || 'GET').toUpperCase();

    if (normalized.room === undefined && normalized.room_id !== undefined) normalized.room = normalized.room_id;
    if (normalized.bed === undefined && normalized.bed_id !== undefined) normalized.bed = normalized.bed_id;
    if (normalized.dorm === undefined) normalized.dorm = normalized.dorm_id ?? normalized.dormitory_id;
    if (normalized.assigned_to === undefined && normalized.assigned_to_id !== undefined) normalized.assigned_to = normalized.assigned_to_id;
    if (normalized.description === undefined && normalized.resolution_note !== undefined) normalized.description = normalized.resolution_note;
    if (isMaintenanceCreatePath(path, requestMethod) && !normalized.status) normalized.status = 'pending';

    if (isMaintenanceCreatePath(path, requestMethod)) {
      const title = String(normalized.title || '').trim();
      const description = String(normalized.description || '').trim();
      normalized.description = title && description && !description.startsWith(title)
        ? `${title}\n\n${description}`
        : description || title;
      delete normalized.title;
    }

    if (/\/comments\/?$/i.test(value) || /^\/api\/maintenance\/update\/comments\/?$/i.test(value)) {
      delete normalized.status;
      delete normalized.assigned_to;
      delete normalized.assigned_to_id;
    }

    delete normalized.room_id;
    delete normalized.bed_id;
    delete normalized.dorm_id;
    delete normalized.dormitory_id;
    delete normalized.location;
    delete normalized.requested_by;
    delete normalized.assigned_to_id;
    delete normalized.resolution_note;

    return normalized;
  }

  function normalizeHtmxParameters(path = '', method = 'GET', parameters) {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return;
    const normalized = normalizeRequestBody(path, method, parameters);
    if (normalized === parameters) return;
    Object.keys(parameters).forEach((key) => delete parameters[key]);
    Object.assign(parameters, normalized);
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

    if (isBedAssignmentCreatePath(path, requestMethod)) {
      return normalizeBedAssignmentCreatePayload(body);
    }

    if (isMaintenanceMutationPath(path, requestMethod)) {
      return normalizeMaintenancePayload(path, requestMethod, body);
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

  function errorMessage(status, data, path = '') {
    return data?.detail
      || data?.message
      || data?.error
      || window.SaraUI?.apiErrorMessage?.(status, data)
      || 'درخواست با خطا روبه‌رو شد.';
  }

  function createError(response, data, path) {
    const error = new Error(errorMessage(response.status, data, path));
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
        headers: buildHeaders({ ...options, path, method, body }),
        body: serializeBody(body)
      });
    } catch (networkError) {
      const error = new Error(backendGapMessage(0, path) || 'ارتباط با سرور برقرار نشد. اتصال اینترنت یا آدرس API را بررسی کنید.');
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

        const requestMethod = event.detail?.verb || event.detail?.requestConfig?.verb || 'GET';
        normalizeHtmxParameters(requestPath, requestMethod, event.detail?.parameters);

        const normalizedPath = normalizeApiPath(requestPath, requestMethod);
        const resolvedPath = joinUrl(requestPath, undefined, requestMethod);
        if (resolvedPath !== requestPath) {
          event.detail.path = resolvedPath;
          if (event.detail.pathInfo) event.detail.pathInfo.requestPath = resolvedPath;
          if (event.detail.requestConfig) event.detail.requestConfig.path = resolvedPath;
        }

        const token = window.SaraAuth?.getAccessToken?.();
        if (token && shouldAttachAuthHeader(requestPath, requestMethod)) {
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

  function coerceBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'ok', 'success', 'successful', 'verified', 'matched', 'valid'].includes(normalized)) return true;
      if (['false', '0', 'no', 'failed', 'failure', 'error', 'rejected', 'mismatch', 'invalid'].includes(normalized)) return false;
    }
    return null;
  }

  function aiResult(data = {}, messages = {}) {
    const response = data && typeof data === 'object' ? data : { result: data };
    const message = response.log
      || response.message
      || response.detail
      || response.error
      || '';
    const candidates = [
      response.success,
      response.verified,
      response.match,
      response.matched,
      response.valid,
      response.ok,
      response.result,
      response.status
    ];
    let succeeded = candidates.map(coerceBoolean).find((value) => value !== null);

    if (succeeded === undefined) {
      const normalizedMessage = String(message || '').toLowerCase();
      const failurePattern = /(doesn'?t match|mismatch|not match|failed|failure|error|no id|no id_card|no face|not exists|invalid|rejected)/i;
      const successPattern = /(success|saved|verified|matched|operation done|deleted successfully)/i;
      if (failurePattern.test(normalizedMessage)) succeeded = false;
      else if (successPattern.test(normalizedMessage)) succeeded = true;
    }

    if (succeeded === undefined) succeeded = false;

    return {
      succeeded,
      message: message || (succeeded ? messages.success : messages.failure) || ''
    };
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
    normalizeHtmxParameters,
    isAccountPath,
    isAiPath,
    isNationalIdPath,
    isAnnouncementPath,
    isPublicApiPath,
    shouldAttachAuthHeader,
    joinUrl,
    normalizeEndpoint,
    buildHeaders,
    parseResponse,
    fieldErrors,
    errorMessage,
    aiResult,
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
