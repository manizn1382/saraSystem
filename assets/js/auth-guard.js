/* SaraSystem front-end auth guard
   Scope: front-end only. Final authentication and authorization are enforced by the REST API. */
(function () {
  const script = document.currentScript;
  const loginUrl = script?.dataset.loginUrl || '../login.html';
  const unauthorizedUrl = script?.dataset.unauthorizedUrl || '../403.html';
  const allowedRoles = (script?.dataset.allowedRoles || '')
    .split(/[ ,]+/)
    .map(normalizeRole)
    .filter(Boolean);

  const TOKEN_KEYS = ['sarasystem.accessToken', 'sarasystem.refreshToken', 'sarasystem.user', 'sarasystem.demoMode'];

  function getAccessToken() {
    return localStorage.getItem('sarasystem.accessToken') || sessionStorage.getItem('sarasystem.accessToken');
  }

  function getRefreshToken() {
    return localStorage.getItem('sarasystem.refreshToken') || sessionStorage.getItem('sarasystem.refreshToken');
  }

  function isDemoMode() {
    return (localStorage.getItem('sarasystem.demoMode') || sessionStorage.getItem('sarasystem.demoMode')) === 'true';
  }

  function getStoredUser() {
    const raw = localStorage.getItem('sarasystem.user') || sessionStorage.getItem('sarasystem.user');
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearSession() {
    TOKEN_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  function normalizeRole(role) {
    const value = typeof role === 'string'
      ? role
      : role?.code || role?.name || role?.slug || '';

    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '_');
  }

  function getUserRoles(user) {
    if (!user) return [];

    if (Array.isArray(user.roles)) return user.roles.map(normalizeRole).filter(Boolean);
    if (Array.isArray(user.user_roles)) return user.user_roles.map(normalizeRole).filter(Boolean);
    if (user.role) return [normalizeRole(user.role)].filter(Boolean);

    return [];
  }

  function hasAllowedRole(user) {
    if (!allowedRoles.length) return true;

    const roles = getUserRoles(user);
    if (!roles.length) return true; // Let the API response decide later if the role was not stored at login.

    return roles.some((role) => allowedRoles.includes(role));
  }

  function addReturnParam(url) {
    try {
      const target = new URL(url, window.location.href);
      target.searchParams.set('next', window.location.pathname + window.location.search + window.location.hash);
      return target.pathname + target.search + target.hash;
    } catch {
      return url;
    }
  }

  function requireAuth() {
    if (!getAccessToken()) {
      clearSession();
      window.location.replace(addReturnParam(loginUrl));
      return false;
    }

    if (!hasAllowedRole(getStoredUser())) {
      window.location.replace(addReturnParam(unauthorizedUrl));
      return false;
    }

    return true;
  }

  function attachHtmxAuthHeader() {
    document.body.addEventListener('htmx:configRequest', function (event) {
      const token = getAccessToken();
      if (token) {
        event.detail.headers.Authorization = `Bearer ${token}`;
      }
    });

    document.body.addEventListener('htmx:afterRequest', function (event) {
      const status = event.detail?.xhr?.status;
      if (status === 401) {
        clearSession();
        window.location.replace(addReturnParam(loginUrl));
      }

      if (status === 403) {
        window.location.replace(addReturnParam(unauthorizedUrl));
      }
    });
  }

  window.SaraAuth = {
    getAccessToken,
    getRefreshToken,
    isDemoMode,
    getStoredUser,
    getUserRoles,
    clearSession,
    requireAuth,
    normalizeRole
  };

  if (!requireAuth()) return;

  if (document.body) {
    attachHtmxAuthHeader();
  } else {
    document.addEventListener('DOMContentLoaded', attachHtmxAuthHeader, { once: true });
  }
})();
