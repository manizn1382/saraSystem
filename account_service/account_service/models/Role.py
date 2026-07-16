from django.db import models


class Role(models.Model):


    ROLES = (
        ('student', 'student'),
        ('dorm-admin', 'dorm-admin'),
        ('system-admin', 'system-admin'),
        ('support-staff', 'support-staff')
    )


    name = models.CharField(max_length=30, choices=ROLES)
    description = models.TextField(default="desc")

    class Meta:
        app_label = "account_service"
        db_table = "Role"
