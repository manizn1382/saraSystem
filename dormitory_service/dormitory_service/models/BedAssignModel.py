from django.db import models
from dormitory_service.models.BedModel import Bed
from accomodation_service.models import Accommodation


class BedAssign(models.Model):
    STATUS_CHOICE = (
        ('active', 'active'),
        ('inactive', 'inactive'),
        ('ended', 'ended'),
        ('cancelled', 'cancelled'),
    )

    user_id = models.IntegerField()
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE)
    request = models.OneToOneField(Accommodation, on_delete=models.CASCADE)
    assigned_by = models.IntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(choices=STATUS_CHOICE, max_length=12, default='inactive')
    notes = models.TextField(default="desc")

    class Meta:
        db_table = "BedAssign"
