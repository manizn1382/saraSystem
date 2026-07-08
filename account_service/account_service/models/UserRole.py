from django.db import models
from .Role import Role
from django.contrib.auth.models import User


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assignedAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "UserRole"
        app_label = "account_service"
