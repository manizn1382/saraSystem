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
  const DEMO_ACCOUNTS = {
    student: {
      accessToken: 'demo-token-student',
      user: { username: 'student', first_name: 'Demo', last_name: 'Student', roles: ['student'] }
    },
    supervisor: {
      accessToken: 'demo-token-dormitory-admin',
      user: { username: 'supervisor', first_name: 'Demo', last_name: 'Dormitory Admin', roles: ['dormitory_admin'] }
    },
    dormadmin: {
      accessToken: 'demo-token-dormitory-admin',
      user: { username: 'dormadmin', first_name: 'Demo', last_name: 'Dormitory Admin', roles: ['dormitory_admin'] }
    },
    admin: {
      accessToken: 'demo-token-admin',
      user: { username: 'admin', first_name: 'Demo', last_name: 'System Admin', roles: ['system_admin'] }
    },
    support: {
      accessToken: 'demo-token-support',
      user: { username: 'support', first_name: 'Demo', last_name: 'Support', roles: ['support_staff'] }
    }
  };

  let bootstrappedDemoSession = null;

  function getAccessToken() {
    return localStorage.getItem('sarasystem.accessToken')
      || sessionStorage.getItem('sarasystem.accessToken')
      || bootstrappedDemoSession?.accessToken
      || '';
  }

  function getRefreshToken() {
    return localStorage.getItem('sarasystem.refreshToken') || sessionStorage.getItem('sarasystem.refreshToken');
  }

  function isDemoMode() {
    return (localStorage.getItem('sarasystem.demoMode') || sessionStorage.getItem('sarasystem.demoMode')) === 'true'
      || bootstrappedDemoSession?.demoMode === true;
  }

  function getStoredUser() {
    const raw = localStorage.getItem('sarasystem.user') || sessionStorage.getItem('sarasystem.user');
    if (!raw) return bootstrappedDemoSession?.user || null;

    try {
      return JSON.parse(raw);
    } catch {
      return bootstrappedDemoSession?.user || null;
    }
  }

  function clearSession() {
    bootstrappedDemoSession = null;

    if (window.SaraAuth?.clearSession && window.SaraAuth.clearSession !== clearSession) {
      window.SaraAuth.clearSession();
      return;
    }

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

  function storeDemoSession(account) {
    bootstrappedDemoSession = {
      accessToken: account.accessToken,
      user: account.user,
      demoMode: true
    };

    localStorage.setItem('sarasystem.accessToken', account.accessToken);
    localStorage.setItem('sarasystem.user', JSON.stringify(account.user));
    localStorage.setItem('sarasystem.demoMode', 'true');
    localStorage.removeItem('sarasystem.refreshToken');
    sessionStorage.removeItem('sarasystem.accessToken');
    sessionStorage.removeItem('sarasystem.refreshToken');
    sessionStorage.removeItem('sarasystem.user');
    sessionStorage.removeItem('sarasystem.demoMode');

    return bootstrappedDemoSession;
  }

  function restoreDemoSessionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const demoKey = String(params.get('demo') || '').toLowerCase().trim();
    const account = DEMO_ACCOUNTS[demoKey];
    if (!account) return null;

    const session = storeDemoSession(account);
    params.delete('demo');

    const cleanSearch = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, document.title, cleanUrl);

    return session;
  }

  function restoreDemoAccessToken() {
    const user = getStoredUser();
    if (!isDemoMode() || !user) return '';

    const role = getUserRoles(user)[0] || user.username || 'user';
    const token = `demo-token-${role}`;
    bootstrappedDemoSession = {
      accessToken: token,
      user,
      demoMode: true
    };
    localStorage.setItem('sarasystem.accessToken', token);
    return token;
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

  function redirectToLogin() {
    clearSession();
    window.SaraAuth?.setSessionMessage?.('warning', 'برای دسترسی به این بخش ابتدا وارد سامانه شوید.');
    window.location.replace(addReturnParam(loginUrl));
  }

  function redirectToUnauthorized() {
    window.location.replace(addReturnParam(unauthorizedUrl));
  }

  function requireAuth() {
    restoreDemoSessionFromUrl();
    const accessToken = getAccessToken() || restoreDemoAccessToken();

    if (!accessToken) {
      return getRefreshToken() && window.SaraAuth?.refreshAccessToken ? null : false;
    }

    if (!hasAllowedRole(getStoredUser())) {
      redirectToUnauthorized();
      return false;
    }

    return true;
  }

  async function refreshThenRequireAuth() {
    try {
      const refreshedToken = await window.SaraAuth?.refreshAccessToken?.();
      if (!refreshedToken) {
        redirectToLogin();
        return false;
      }

      if (!hasAllowedRole(getStoredUser())) {
        redirectToUnauthorized();
        return false;
      }

      return true;
    } catch {
      redirectToLogin();
      return false;
    }
  }

  function attachHtmxAuthHeader() {
    document.body.addEventListener('htmx:beforeRequest', function (event) {
      const path = event.detail?.pathInfo?.requestPath || event.detail?.requestConfig?.path || '';
      if (isDemoMode() && /^\/api(\/|$)/i.test(path)) {
        event.preventDefault();
      }
    });

    document.body.addEventListener('htmx:configRequest', function (event) {
      const token = getAccessToken();
      if (token) {
        event.detail.headers.Authorization = `Bearer ${token}`;
      }
      event.detail.headers.Accept = 'application/json';
    });

    document.body.addEventListener('htmx:afterRequest', function (event) {
      const status = event.detail?.xhr?.status;
      if (status === 401) {
        if (isDemoMode()) return;
        if (window.SaraAuth?.handleExpiredSession) {
          window.SaraAuth.handleExpiredSession(addReturnParam(loginUrl));
          return;
        }
        clearSession();
      }

      if (status === 403) {
        if (isDemoMode()) return;
        window.location.replace(addReturnParam(unauthorizedUrl));
      }
    });
  }

  window.SaraAuth = {
    ...(window.SaraAuth || {}),
    getAccessToken,
    getRefreshToken,
    isDemoMode,
    getStoredUser,
    getUserRoles,
    clearSession,
    requireAuth,
    normalizeRole
  };

  function attachWhenReady() {
    if (document.body) {
      attachHtmxAuthHeader();
    } else {
      document.addEventListener('DOMContentLoaded', attachHtmxAuthHeader, { once: true });
    }
  }

  const authState = requireAuth();

  if (authState === true) {
    attachWhenReady();
    return;
  }

  if (authState === null) {
    refreshThenRequireAuth().then((allowed) => {
      if (allowed) attachWhenReady();
    });
    return;
  }

  redirectToLogin();
})();
