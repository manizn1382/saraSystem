from django.db import models
from dormitory_service.models.DormModel import Dormitory


class Accommodation(models.Model):

    STATUS_CHOICE = (
        ('pending', 'pending'),
        ('approved', 'approved'),
        ('rejected', 'rejected'),
        ('assigned', 'assigned'),
        ('cancelled', 'cancelled'),
    )

    user_id = models.IntegerField()
    requested_dorm = models.ForeignKey(Dormitory, on_delete=models.CASCADE)
    preferred_room = models.CharField(max_length=40)
    semester = models.CharField(max_length=60)
    req_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(choices=STATUS_CHOICE, max_length=12, default="pending")
    reviewed_by = models.IntegerField(null=True)
    reviewed_at = models.DateTimeField(null=True)
    description = models.TextField(default="desc")
    review_note = models.TextField(default="no-desc")

    class Meta:
        db_table = "accommodation"
        ordering = ["-req_date"]
