from django.db import models


class AccommodationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار بررسی'),
        ('approved', 'تایید شده'),
        ('rejected', 'رد شده'),
        ('assigned', 'تخصیص داده شده'),
    ]
    
    ROOM_TYPE_CHOICES = [
        ('single', 'تک‌نفره'),
        ('double', 'دونفره'),
        ('shared', 'چندنفره'),
    ]
    
    user_id = models.IntegerField()
    requested_dormitory_id = models.IntegerField(null=True, blank=True)
    preferred_room_type = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES)
    semester = models.CharField(max_length=50)
    request_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by_id = models.IntegerField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Request #{self.id}"


class BedAssignment(models.Model):
    STATUS_CHOICES = [
        ('active', 'فعال'),
        ('inactive', 'غیرفعال'),
        ('expired', 'منقضی شده'),
    ]
    
    user_id = models.IntegerField()
    bed_id = models.IntegerField()
    request_id = models.IntegerField(null=True, blank=True)
    assigned_by_id = models.IntegerField(null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Assignment #{self.id}"