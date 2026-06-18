/* SaraSystem session helper. */
(function () {
  const STORAGE_KEYS = {
    accessToken: 'sarasystem.accessToken',
    refreshToken: 'sarasystem.refreshToken',
    user: 'sarasystem.user',
    demoMode: 'sarasystem.demoMode',
    remember: 'sarasystem.rememberSession',
    sessionMessage: 'sarasystem.sessionMessage'
  };

  function storage(remember) {
    return remember ? localStorage : sessionStorage;
  }

  function read(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  function write(key, value, remember) {
    clearKey(key);
    if (value === undefined || value === null || value === '') return;
    storage(remember).setItem(key, value);
  }

  function readBoolean(key, fallback = false) {
    const value = read(key);
    if (value === null || value === undefined) return fallback;
    return value === 'true';
  }

  function clearKey(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  function parseJson(value, fallback = null) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeRole(role) {
    const value = typeof role === 'string'
      ? role
      : role?.code || role?.name || role?.slug || '';

    return String(value).toLowerCase().trim().replace(/[\s-]+/g, '_');
  }

  function normalizePermission(permission) {
    const value = typeof permission === 'string'
      ? permission
      : permission?.code || permission?.name || '';

    return String(value).toLowerCase().trim();
  }

  function getUser() {
    return parseJson(read(STORAGE_KEYS.user), null);
  }

  function getRememberPreference() {
    return readBoolean(STORAGE_KEYS.remember, true);
  }

  function getRoles(user = getUser()) {
    if (!user) return [];
    if (Array.isArray(user.roles)) return user.roles.map(normalizeRole).filter(Boolean);
    if (Array.isArray(user.user_roles)) return user.user_roles.map(normalizeRole).filter(Boolean);
    if (user.role) return [normalizeRole(user.role)].filter(Boolean);
    return [];
  }

  function getPermissions(user = getUser()) {
    if (!user) return [];
    if (Array.isArray(user.permissions)) return user.permissions.map(normalizePermission).filter(Boolean);
    if (Array.isArray(user.role_permissions)) return user.role_permissions.map(normalizePermission).filter(Boolean);
    return [];
  }

  function setSession(session = {}, options = {}) {
    const remember = options.remember !== false;
    const accessToken = session.access || session.access_token || session.token || session.accessToken;
    const refreshToken = session.refresh || session.refresh_token || session.refreshToken;
    const user = session.user || session.account || session.profile || null;

    write(STORAGE_KEYS.remember, String(remember), remember);
    write(STORAGE_KEYS.accessToken, accessToken, remember);
    write(STORAGE_KEYS.refreshToken, refreshToken, remember);
    if (user) write(STORAGE_KEYS.user, JSON.stringify(user), remember);
    if (session.demoMode !== undefined) write(STORAGE_KEYS.demoMode, String(Boolean(session.demoMode)), remember);
  }

  function updateStoredUser(user = {}) {
    const current = getUser() || {};
    const next = { ...current, ...user };
    write(STORAGE_KEYS.user, JSON.stringify(next), getRememberPreference());
    return next;
  }

  function getAccountStatus(user = getUser()) {
    if (!user) {
      return { state: 'unknown', label: 'وضعیت نامشخص', className: 'badge-neutral', message: '' };
    }

    if (user.is_active === false) {
      return {
        state: 'inactive',
        label: 'غیرفعال',
        className: 'badge-inactive',
        message: 'حساب شما غیرفعال است. برای فعال‌سازی با مسئول سامانه تماس بگیرید.'
      };
    }

    if (user.is_verified === false) {
      return {
        state: 'not_verified',
        label: 'تاییدنشده',
        className: 'badge-pending',
        message: 'حساب شما هنوز تایید نشده است. برخی عملیات ممکن است در API رد شوند.'
      };
    }

    return { state: 'active', label: 'فعال', className: 'badge-active', message: '' };
  }

  function setSessionMessage(type, message) {
    write(STORAGE_KEYS.sessionMessage, JSON.stringify({ type, message }), true);
  }

  function consumeSessionMessage() {
    const message = parseJson(read(STORAGE_KEYS.sessionMessage), null);
    clearKey(STORAGE_KEYS.sessionMessage);
    return message;
  }

  async function refreshAccessToken(options = {}) {
    if (read(STORAGE_KEYS.demoMode) === 'true') return read(STORAGE_KEYS.accessToken);

    const refreshToken = read(STORAGE_KEYS.refreshToken);
    if (!refreshToken) return '';

    const endpoint = options.endpoint || '/api/auth/refresh/';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken, refresh_token: refreshToken })
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) return '';

    const accessToken = data?.access || data?.access_token || data?.token;
    const nextRefreshToken = data?.refresh || data?.refresh_token || refreshToken;
    if (!accessToken) return '';

    setSession({
      accessToken,
      refreshToken: nextRefreshToken,
      user: data?.user || getUser(),
      demoMode: false
    }, { remember: getRememberPreference() });

    return accessToken;
  }

  async function loadCurrentUser(options = {}) {
    if (read(STORAGE_KEYS.demoMode) === 'true') return getUser();

    const endpoint = options.endpoint || '/api/users/me/';
    const retryOnUnauthorized = options.retryOnUnauthorized !== false;
    const token = read(STORAGE_KEYS.accessToken);
    if (!token) return null;

    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401 && retryOnUnauthorized) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return loadCurrentUser({ ...options, retryOnUnauthorized: false });
      }
      return null;
    }

    if (!response.ok) return null;

    const user = await response.json();
    return updateStoredUser(user);
  }

  function handleExpiredSession(redirectUrl = '../login.html') {
    clearSession();
    setSessionMessage('warning', 'نشست شما پایان یافته است. لطفا دوباره وارد شوید.');
    window.location.replace(redirectUrl);
  }

  function clearSession() {
    Object.values(STORAGE_KEYS).forEach(clearKey);
  }

  function logout(redirectUrl = '../login.html') {
    clearSession();
    window.location.assign(redirectUrl);
  }

  const SaraAuth = {
    keys: STORAGE_KEYS,
    getAccessToken: () => read(STORAGE_KEYS.accessToken),
    getRefreshToken: () => read(STORAGE_KEYS.refreshToken),
    getStoredUser: getUser,
    getUser: getUser,
    updateStoredUser,
    getUserRoles: getRoles,
    getRoles,
    getPermissions,
    hasRole: (role, user) => getRoles(user).includes(normalizeRole(role)),
    hasAnyRole: (roles, user) => (roles || []).some((role) => getRoles(user).includes(normalizeRole(role))),
    hasPermission: (permission, user) => getPermissions(user).includes(normalizePermission(permission)),
    hasAnyPermission: (permissions, user) => (permissions || []).some((permission) => getPermissions(user).includes(normalizePermission(permission))),
    isAuthenticated: () => Boolean(read(STORAGE_KEYS.accessToken)),
    isDemoMode: () => read(STORAGE_KEYS.demoMode) === 'true',
    getAccountStatus,
    consumeSessionMessage,
    setSessionMessage,
    refreshAccessToken,
    loadCurrentUser,
    handleExpiredSession,
    setSession,
    clearSession,
    logout,
    normalizeRole,
    normalizePermission
  };

  window.SaraAuth = { ...(window.SaraAuth || {}), ...SaraAuth };
})();
