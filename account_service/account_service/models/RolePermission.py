from django.db import models
from .Role import Role
from .Permission import Permission


class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = "RolePermission"
        app_label = "account_service"
