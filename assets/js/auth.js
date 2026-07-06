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

  function normalizeGender(value) {
    const normalized = String(value || '').toLowerCase().trim();
    if (['male', 'man', 'm'].includes(normalized)) return 'm';
    if (['female', 'woman', 'f'].includes(normalized)) return 'f';
    return normalized;
  }

  function normalizeAccountUser(user) {
    if (!user || typeof user !== 'object') return user || null;

    const profile = user.profile || user.userprofile || {};
    const roles = Array.isArray(user.roles)
      ? user.roles
      : Array.isArray(user.Roles)
        ? user.Roles
        : Array.isArray(user.user_roles)
          ? user.user_roles
          : user.role
            ? [user.role]
            : [];
    const permissions = Array.isArray(user.permissions)
      ? user.permissions
      : Array.isArray(user.Permission)
        ? user.Permission
        : Array.isArray(user.role_permissions)
          ? user.role_permissions
          : [];
    const normalizedProfile = {
      ...profile,
      nationalId: profile.nationalId ?? profile.national_id ?? user.nationalId ?? user.national_id ?? '',
      studentId: profile.studentId ?? profile.student_id ?? user.studentId ?? user.student_id ?? '',
      phone: profile.phone ?? user.phone ?? '',
      gender: normalizeGender(profile.gender ?? user.gender ?? ''),
      profileImage: profile.profileImage ?? profile.profile_image ?? user.profileImage ?? user.profile_image ?? '',
      isVerified: profile.isVerified ?? profile.is_verified ?? user.isVerified ?? user.is_verified
    };

    return {
      ...user,
      profile: normalizedProfile,
      roles,
      permissions,
      national_id: user.national_id ?? user.nationalId ?? normalizedProfile.nationalId,
      nationalId: user.nationalId ?? user.national_id ?? normalizedProfile.nationalId,
      student_id: user.student_id ?? user.studentId ?? normalizedProfile.studentId,
      studentId: user.studentId ?? user.student_id ?? normalizedProfile.studentId,
      phone: user.phone ?? normalizedProfile.phone,
      gender: normalizeGender(user.gender ?? normalizedProfile.gender),
      profile_image: user.profile_image ?? user.profileImage ?? normalizedProfile.profileImage,
      profileImage: user.profileImage ?? user.profile_image ?? normalizedProfile.profileImage,
      is_verified: user.is_verified ?? user.isVerified ?? normalizedProfile.isVerified,
      isVerified: user.isVerified ?? user.is_verified ?? normalizedProfile.isVerified
    };
  }

  function getUser() {
    return normalizeAccountUser(parseJson(read(STORAGE_KEYS.user), null));
  }

  function getRememberPreference() {
    return readBoolean(STORAGE_KEYS.remember, true);
  }

  function getRoles(user = getUser()) {
    if (!user) return [];
    if (Array.isArray(user.roles)) return user.roles.map(normalizeRole).filter(Boolean);
    if (Array.isArray(user.Roles)) return user.Roles.map(normalizeRole).filter(Boolean);
    if (Array.isArray(user.user_roles)) return user.user_roles.map(normalizeRole).filter(Boolean);
    if (user.role) return [normalizeRole(user.role)].filter(Boolean);
    return [];
  }

  function getPermissions(user = getUser()) {
    if (!user) return [];
    if (Array.isArray(user.permissions)) return user.permissions.map(normalizePermission).filter(Boolean);
    if (Array.isArray(user.Permission)) return user.Permission.map(normalizePermission).filter(Boolean);
    if (Array.isArray(user.role_permissions)) return user.role_permissions.map(normalizePermission).filter(Boolean);
    return [];
  }

  function setSession(session = {}, options = {}) {
    const remember = options.remember !== false;
    const accessToken = session.access || session.access_token || session.token || session.accessToken;
    const refreshToken = session.refresh || session.refresh_token || session.refreshToken;
    const user = normalizeAccountUser(session.user || session.account || session.profile || null);

    write(STORAGE_KEYS.remember, String(remember), remember);
    write(STORAGE_KEYS.accessToken, accessToken, remember);
    write(STORAGE_KEYS.refreshToken, refreshToken, remember);
    if (user) write(STORAGE_KEYS.user, JSON.stringify(user), remember);
    if (session.demoMode !== undefined) write(STORAGE_KEYS.demoMode, String(Boolean(session.demoMode)), remember);
  }

  function updateStoredUser(user = {}) {
    const current = getUser() || {};
    const next = normalizeAccountUser({ ...current, ...user });
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

    const isVerified = user.is_verified ?? user.isVerified ?? user.profile?.isVerified ?? user.profile?.is_verified;
    if (isVerified === false) {
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

    const endpoint = options.endpoint
      || window.SARA_ACCOUNTS_TOKEN_REFRESH_ENDPOINT
      || localStorage.getItem('sarasystem.accountsTokenRefreshEndpoint')
      || '';
    if (!endpoint) return '';

    const response = await fetch(window.SaraAPI?.joinUrl?.(endpoint) || endpoint, {
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

    const endpoint = options.endpoint
      || window.SARA_ACCOUNTS_ME_ENDPOINT
      || localStorage.getItem('sarasystem.accountsMeEndpoint')
      || '';
    if (!endpoint) return getUser();

    const retryOnUnauthorized = options.retryOnUnauthorized !== false;
    const token = read(STORAGE_KEYS.accessToken);
    if (!token) return null;

    const response = await fetch(window.SaraAPI?.joinUrl?.(endpoint) || endpoint, {
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

    const user = normalizeAccountUser(await response.json());
    return updateStoredUser(user);
  }

  function defaultLoginUrl() {
    return window.location.pathname.includes('/dashboard/') ? '../login.html' : './login.html';
  }

  function handleExpiredSession(redirectUrl = defaultLoginUrl()) {
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
    normalizeAccountUser,
    normalizeGender,
    consumeSessionMessage,
    setSessionMessage,
    refreshAccessToken,
    loadCurrentUser,
    defaultLoginUrl,
    handleExpiredSession,
    setSession,
    clearSession,
    logout,
    normalizeRole,
    normalizePermission
  };

  window.SaraAuth = { ...(window.SaraAuth || {}), ...SaraAuth };
})();
