from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    """
    Authenticated users can read announcements.
    Only staff or superusers can create, update, or delete them.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        return (
            request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.is_superuser
            )
        )