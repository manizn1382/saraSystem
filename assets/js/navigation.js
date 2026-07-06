/* Role and permission-aware front-end navigation filtering. */
(function () {
  function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function isVisible(item, user) {
    const roles = asArray(item.roles);
    const permissions = asArray(item.permissions);
    const userHasPermissionData = Array.isArray(user?.permissions)
      || Array.isArray(user?.Permission)
      || Array.isArray(user?.role_permissions);

    const roleAllowed = !roles.length || window.SaraAuth?.hasAnyRole?.(roles, user);
    const permissionAllowed = !permissions.length
      || !userHasPermissionData
      || window.SaraAuth?.hasAnyPermission?.(permissions, user);

    return roleAllowed && permissionAllowed;
  }

  function filter(items = [], user = window.SaraAuth?.getStoredUser?.()) {
    return items.filter((item) => isVisible(item, user));
  }

  window.SaraNavigation = { filter, isVisible };
})();
