from rest_framework import serializers
from .models import AccommodationRequest, BedAssignment


class AccommodationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccommodationRequest
        fields = '__all__'
        read_only_fields = ['request_date', 'created_at', 'updated_at']


class BedAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BedAssignment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']