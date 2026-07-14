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
  const UNAUTHORIZED = 'unauthorized';

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

  function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string' || token.split('.').length < 2) return null;

    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      const decoded = window.atob(padded);
      const json = decodeURIComponent(
        Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function normalizeAccountUser(user) {
    if (!user || typeof user !== 'object') return user || null;
    if (window.SaraAuth?.normalizeAccountUser) return window.SaraAuth.normalizeAccountUser(user);
    return {
      ...user,
      id: user.id ?? user.user_id ?? user.pk,
      user_id: user.user_id ?? user.id ?? user.pk
    };
  }

  function storeHydratedUser(user) {
    const normalized = normalizeAccountUser(user);
    if (!normalized) return null;

    const targetStorage = localStorage.getItem('sarasystem.accessToken') ? localStorage : sessionStorage;
    targetStorage.setItem('sarasystem.user', JSON.stringify(normalized));
    return normalized;
  }

  function getStoredUser() {
    const raw = localStorage.getItem('sarasystem.user') || sessionStorage.getItem('sarasystem.user');
    if (!raw) {
      const decodedUser = decodeJwtPayload(getAccessToken());
      if (decodedUser) return storeHydratedUser(decodedUser);
      return bootstrappedDemoSession?.user || null;
    }

    try {
      return normalizeAccountUser(JSON.parse(raw));
    } catch {
      const decodedUser = decodeJwtPayload(getAccessToken());
      if (decodedUser) return storeHydratedUser(decodedUser);
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

    const roles = [];
    if (Array.isArray(user.roles)) roles.push(...user.roles);
    if (Array.isArray(user.Roles)) roles.push(...user.Roles);
    if (Array.isArray(user.user_roles)) roles.push(...user.user_roles);
    if (user.role) roles.push(user.role);
    if (user.is_superuser === true) roles.push('system_admin', 'admin');
    else if (user.is_staff === true) roles.push('admin');

    return Array.from(new Set(roles.map(normalizeRole).filter(Boolean)));
  }

  function hasAllowedRole(user) {
    if (!allowedRoles.length) return true;

    const roles = getUserRoles(user);
    if (!roles.length) return false;

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
      return UNAUTHORIZED;
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
    function requestPath(event) {
      return event.detail?.path
        || event.detail?.pathInfo?.requestPath
        || event.detail?.requestConfig?.path
        || '';
    }

    function requestVerb(event) {
      return event.detail?.verb
        || event.detail?.requestConfig?.verb
        || 'GET';
    }

    function splitPath(value = '') {
      const raw = String(value || '');
      try {
        return new URL(raw, window.location?.href || 'http://localhost/').pathname;
      } catch {
        const [, path = raw] = raw.match(/^([^?#]*)/) || [];
        return path;
      }
    }

    function origin(value = '') {
      try {
        return new URL(String(value || ''), window.location?.href || 'http://localhost/').origin;
      } catch {
        return '';
      }
    }

    function isResolvedAiRequest(path) {
      const aiBase = window.SARA_AI_API_BASE_URL
        || localStorage.getItem('sarasystem.aiApiBaseUrl')
        || 'http://127.0.0.1:5000';
      const pathOrigin = origin(path);
      if (!pathOrigin || pathOrigin !== origin(aiBase)) return false;
      const value = splitPath(path);
      return /^\/(?:register|verify|delete)\/?$/i.test(value);
    }

    function isAiRequest(path, normalized) {
      const value = splitPath(path);
      const normalizedValue = splitPath(normalized);
      return window.SaraAPI?.isAiPath?.(path)
        || window.SaraAPI?.isAiPath?.(normalized)
        || /^\/api\/face\/(?:register|verify|delete)\/?$/i.test(value)
        || /^\/(?:register|verify|delete)\/?$/i.test(normalizedValue)
        || isResolvedAiRequest(path)
        || isResolvedAiRequest(normalized);
    }

    function isPublicRequest(path, normalized) {
      const value = splitPath(path);
      const normalizedValue = splitPath(normalized);
      return window.SaraAPI?.isPublicApiPath?.(path)
        || window.SaraAPI?.isPublicApiPath?.(normalized)
        || /^\/api\/public(?:\/|$)/i.test(value)
        || /^\/api\/public(?:\/|$)/i.test(normalizedValue)
        || /^\/api\/announcements\/public\/?$/i.test(value)
        || /^\/api\/announcements\/public\/?$/i.test(normalizedValue);
    }

    function isAnonymousAccountRequest(path, verb) {
      const normalized = window.SaraAPI?.normalizeApiPath?.(path, verb) || path;
      const value = splitPath(normalized);
      return /^\/api\/v1\/users\/(?:login|create|token\/refresh|password\/reset)\/?$/i.test(value)
        || /^\/api\/accounts\/(?:getToken|refreshToken|register|users\/register|reset-password|forgot-password|password\/reset|password\/reset\/username)\/?$/i.test(splitPath(path));
    }

    function shouldAttachAuthorization(path, verb) {
      if (window.SaraAPI?.shouldAttachAuthHeader) {
        return window.SaraAPI.shouldAttachAuthHeader(path, verb);
      }

      const normalized = window.SaraAPI?.normalizeApiPath?.(path, verb) || path;

      return !isPublicRequest(path, normalized) && !isAiRequest(path, normalized) && !isAnonymousAccountRequest(path, verb);
    }

    document.body.addEventListener('htmx:beforeRequest', function (event) {
      const path = requestPath(event);
      if (isDemoMode() && /^\/api(\/|$)/i.test(path)) {
        event.preventDefault();
      }
    });

    document.body.addEventListener('htmx:configRequest', function (event) {
      const path = requestPath(event);
      const verb = requestVerb(event);
      const token = getAccessToken();
      event.detail.headers = event.detail.headers || {};
      if (token && shouldAttachAuthorization(path, verb)) {
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

  if (authState === UNAUTHORIZED) {
    return;
  }

  redirectToLogin();
})();
