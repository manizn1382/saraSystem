from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField(default="desc")

    class Meta:
        app_label = "account_service"
        db_table = "Role"
