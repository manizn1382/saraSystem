/* SaraSystem session helper. */
(function () {
  const STORAGE_KEYS = {
    accessToken: 'sarasystem.accessToken',
    refreshToken: 'sarasystem.refreshToken',
    user: 'sarasystem.user',
    demoMode: 'sarasystem.demoMode'
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

    write(STORAGE_KEYS.accessToken, accessToken, remember);
    write(STORAGE_KEYS.refreshToken, refreshToken, remember);
    if (user) write(STORAGE_KEYS.user, JSON.stringify(user), remember);
    if (session.demoMode !== undefined) write(STORAGE_KEYS.demoMode, String(Boolean(session.demoMode)), remember);
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
    getUserRoles: getRoles,
    getRoles,
    getPermissions,
    hasRole: (role, user) => getRoles(user).includes(normalizeRole(role)),
    hasAnyRole: (roles, user) => (roles || []).some((role) => getRoles(user).includes(normalizeRole(role))),
    hasPermission: (permission, user) => getPermissions(user).includes(normalizePermission(permission)),
    isAuthenticated: () => Boolean(read(STORAGE_KEYS.accessToken)),
    isDemoMode: () => read(STORAGE_KEYS.demoMode) === 'true',
    setSession,
    clearSession,
    logout,
    normalizeRole,
    normalizePermission
  };

  window.SaraAuth = { ...(window.SaraAuth || {}), ...SaraAuth };
})();
