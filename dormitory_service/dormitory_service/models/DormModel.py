
from django.db import models


class Dormitory(models.Model):
    DORM_TYPE_CHOICES = (
        ('b', 'Boys'),
        ('g', 'Girls'),
    )
    GENDER_CHOICES = (
        ('m', 'male'),
        ('f', 'female'),
    )

    name = models.CharField(max_length=200)
    dorm_type = models.CharField(max_length=1, choices=DORM_TYPE_CHOICES, default='b')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='m')
    address = models.TextField(blank=True, null=True)
    totalRoom = models.IntegerField(default=0)
    description = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    currentOccupancy = models.IntegerField(default=0)

    class Meta:
        app_label = "dormitory_service"
        db_table = "dormitory"
        ordering = ['createdAt']

    def __str__(self):
        return f"{self.name} ({self.get_dorm_type_display()})"

    @property
    def available_capacity(self):
        return self.totalRoom - self.currentOccupancy

    @property
    def occupancy_percentage(self):
        if self.totalRoom > 0:
            return (self.currentOccupancy / self.totalRoom) * 100
        return 0
