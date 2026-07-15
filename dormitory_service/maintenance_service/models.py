from django.db import models
from dormitory_service.models.RoomModel import Room
from dormitory_service.models.BedModel import Bed
from dormitory_service.models.DormModel import Dormitory


class Maintenance(models.Model):
    PRIORITY = (
        ('low', 'low'),
        ('medium', 'medium'),
        ('high', 'high'),
        ('urgent', 'urgent'),
    )

    STATUS = (
        ('pending', 'pending'),
        ('assigned', 'assigned'),
        ('progress', 'progress'),
        ('in_progress', 'in_progress'),
        ('resolved', 'resolved'),
        ('rejected', 'rejected'),
        ('cancelled', 'cancelled'),
    )

    requester_id = models.IntegerField()
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE)
    dorm = models.ForeignKey(Dormitory, on_delete=models.CASCADE)
    title = models.CharField(max_length=40, default="title")
    description = models.TextField(default="desc")
    priority = models.CharField(choices=PRIORITY, max_length=7)
    status = models.CharField(choices=STATUS, max_length=12, default="pending")
    assigned_to = models.IntegerField(null=True)
    createAt = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True)
    resolved_at = models.DateTimeField(null=True)

    class Meta:
        db_table = "maintenance"
