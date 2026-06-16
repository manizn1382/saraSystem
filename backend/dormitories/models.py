# dormitories/models.py
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
        app_label = "dormitories"
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


class Room(models.Model):
    STATUS_CHOICES = (
        ('available', 'AVAILABLE'),
        ('full', 'FULL'),
        ('maintenance', 'MAINTENANCE'),
        ('closed', 'CLOSED'),
    )

    dormitory = models.ForeignKey(Dormitory, on_delete=models.CASCADE, related_name='rooms')
    roomNumber = models.IntegerField()
    floorNumber = models.IntegerField()
    capacity = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    description = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    currentOccupancy = models.IntegerField(default=0)

    class Meta:
        app_label = "dormitories"
        db_table = "room"
        ordering = ['roomNumber']
        unique_together = [['id', 'roomNumber']]

    def __str__(self):
        return f"Room {self.roomNumber} - Floor {self.floorNumber}"


class Bed(models.Model):
    STATUS_CHOICES = (
        ('available', 'AVAILABLE'),
        ('occupied', 'OCCUPIED'),
        ('reserved', 'RESERVED'),
        ('maintenance', 'MAINTENANCE'),
    )

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    bedNumber = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    description = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'dormitories'
        db_table = 'bed'
        ordering = ['createdAt']
        unique_together = [['id', 'bedNumber']]

    def __str__(self):
        return f"{self.room} - {self.bedNumber}"