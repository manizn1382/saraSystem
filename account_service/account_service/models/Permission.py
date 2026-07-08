from django.db import models


class Permission(models.Model):
    name = models.CharField(max_length=40)
    code = models.CharField(max_length=50)
    description = models.TextField(default="desc")

    class Meta:
        db_table = "Permission"
        app_label = "account_service"
