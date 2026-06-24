from rest_framework.permissions import BasePermission


class IsDormitoryAdministrator(BasePermission):
    """Authorize dormitory writes from signed JWT role claims."""

    message = 'Only dormitory or system administrators can modify dormitory data.'
    allowed_roles = {'dormitory_admin', 'system_admin'}

    def has_permission(self, request, view):
        token = getattr(request, 'auth', None)
        roles = token.get('roles', []) if token else []
        if isinstance(roles, str):
            roles = [roles]
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or bool(self.allowed_roles.intersection(roles)))
        )
