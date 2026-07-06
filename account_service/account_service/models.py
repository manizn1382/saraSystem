from django.db import models
from django.contrib.auth.models import User


class userProfile(models.Model):
    GENDER = (
        ('m', 'male'),
        ('f', 'female'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    nationalId = models.BigIntegerField()
    studentId = models.BigIntegerField()

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    phone = models.CharField(max_length=14)
    gender = models.CharField(choices=GENDER, default='m', max_length=7)
    profileImage = models.CharField(max_length=256, blank=True)
    faceImage = models.CharField(max_length=256, blank=True)
    isVerified = models.BooleanField(default=False)

    class Meta:
        db_table = "profile"
        ordering = ['createdAt']


class Role(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField(default="desc")

    class Meta:
        db_table = "Role"


class Permission(models.Model):
    name = models.CharField(max_length=40)
    code = models.CharField(max_length=50)
    description = models.TextField(default="desc")

    class Meta:
        db_table = "Permission"


class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = "RolePermission"


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assignedAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "UserRole"
