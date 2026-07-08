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
        app_label = "account_service"
        db_table = "profile"
        ordering = ['createdAt']

