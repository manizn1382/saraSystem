from rest_framework import serializers
from dormitories.models import Dormitory, Room, Bed


class DormitoriesInfoSerializer(serializers.ModelSerializer):

    available_capacity = serializers.ReadOnlyField()
    occupancy_percentage = serializers.ReadOnlyField()
    gender_display = serializers.ReadOnlyField()

    class Meta:
        model = Dormitory
        fields = [
            'id', 'name', 'address', 'totalRoom', 'currentOccupancy',
            'available_capacity', 'occupancy_percentage', 'gender_display'
        ]
        read_only_fields = ['id', 'name', 'address', 'totalRoom', 'currentOccupancy',
                            'available_capacity', 'occupancy_percentage', 'gender_display']


