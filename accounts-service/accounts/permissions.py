from rest_framework.permissions import BasePermission


class IsSystemAdministrator(BasePermission):
    """Allows access only to the system-administration role or a superuser."""

    message = 'Only system administrators can perform this action.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.roles.filter(name='system_admin').exists()
            )
        )
