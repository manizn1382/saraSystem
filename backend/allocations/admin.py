from django.contrib import admin
from .models import AccommodationRequest, BedAssignment

@admin.register(AccommodationRequest)
class AccommodationRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id', 'semester', 'status', 'request_date']
    list_filter = ['status', 'semester']

@admin.register(BedAssignment)
class BedAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id', 'bed_id', 'status', 'start_date']
    list_filter = ['status']