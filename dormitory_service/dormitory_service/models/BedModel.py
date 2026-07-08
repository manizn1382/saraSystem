
from .RoomModel import *


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
        app_label = "dormitory_service"
        db_table = 'bed'
        ordering = ['createdAt']
        unique_together = [['id', 'bedNumber']]

    def __str__(self):
        return f"{self.room} - {self.bedNumber}"