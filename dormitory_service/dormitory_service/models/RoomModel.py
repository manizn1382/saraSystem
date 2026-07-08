
from .DormModel import *


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
        app_label = "dormitory_service"
        db_table = "room"
        ordering = ['roomNumber']
        unique_together = [['id', 'roomNumber']]

    def __str__(self):
        return f"Room {self.roomNumber} - Floor {self.floorNumber}"
